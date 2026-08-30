import Link from "next/link";
import { clsx } from "clsx";
import { parseAnswer } from "@/lib/answer-format";
import type { ReactNode } from "react";

interface AnswerBodyProps {
  answer: string;
  /**
   * In the order the API returned them, because that is the order the model was
   * given: [3] in the prose is sources[2]. A citation past the end of the list
   * still renders, just without a link.
   */
  sources?: { id: string }[];
  /** "dark" sits on the purple ask bar, "light" on the Feedback insights log page. */
  tone?: "dark" | "light";
}

const INLINE = /\*\*(.+?)\*\*|\[(\d{1,2})\]/g;

/**
 * Bold spans and [n] citations inside one block of text. The citations are the
 * reason this isn't a plain string: they name a specific insight, and reading
 * an answer means being able to go and check it.
 */
function renderInline(text: string, sources: { id: string }[], dark: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE)) {
    const at = match.index!;
    if (at > cursor) out.push(text.slice(cursor, at));
    cursor = at + match[0].length;

    if (match[1] !== undefined) {
      out.push(
        <strong key={at} className="font-semibold">
          {match[1]}
        </strong>,
      );
      continue;
    }

    const n = Number(match[2]);
    const source = sources[n - 1];
    const chip = clsx(
      "mx-0.5 inline-flex items-center rounded-[3px] px-1 text-[10px] font-semibold leading-[1.6] align-[0.1em] tabular-nums",
      dark ? "bg-white/10 text-teal" : "bg-[rgba(50,43,95,0.06)] text-brand-secondary-500",
      source && (dark ? "hover:bg-white/25" : "hover:bg-[rgba(50,43,95,0.12)]"),
      "transition-colors",
    );

    out.push(
      source ? (
        <Link key={at} href={`/insights/${source.id}`} title="Open the source this cites" className={chip}>
          {n}
        </Link>
      ) : (
        <span key={at} className={chip} title="This source is outside the list below">
          {n}
        </span>
      ),
    );
  }

  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

/**
 * Renders an AI answer as paragraphs and lists rather than one run of text.
 * Shared by the ask bar and the log so an answer reads the same in both places.
 */
export function AnswerBody({ answer, sources = [], tone = "light" }: AnswerBodyProps) {
  const dark = tone === "dark";
  const blocks = parseAnswer(answer);

  return (
    <div
      className={clsx(
        "flex flex-col gap-2.5 leading-relaxed",
        dark ? "text-[14px] text-white/90" : "text-[13.5px] text-brand-primary opacity-80",
      )}
    >
      {blocks.map((block, i) =>
        block.kind === "p" ? (
          <p key={i}>{renderInline(block.text, sources, dark)}</p>
        ) : (
          <ul key={i} className="flex flex-col gap-2">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-2">
                <span
                  className={clsx(
                    "shrink-0 font-semibold tabular-nums",
                    dark ? "text-teal" : "text-brand-secondary-500",
                  )}
                >
                  {block.kind === "ol" ? item.marker : "•"}
                </span>
                <span className="min-w-0">{renderInline(item.text, sources, dark)}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
