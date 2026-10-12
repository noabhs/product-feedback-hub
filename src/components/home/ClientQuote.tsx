import Link from "next/link";
import type { RecapQuote } from "@/lib/weekly-recap";

const SERIF = "Georgia, 'Times New Roman', serif";

/**
 * The weekly "voice of the client" quote, set like a newsletter pull-quote but
 * kept compact: a small label, the words in serif italic, then who said it.
 * Rendered only when the week's brief picked one.
 */
export function ClientQuote({ quote }: { quote: RecapQuote }) {
  return (
    <figure className="relative bg-white rounded-lg border border-[rgba(50,43,95,0.08)] pl-5 pr-5 py-3.5 overflow-hidden">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-secondary-500" />
      <figcaption className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[10.5px] font-semibold text-brand-secondary-500 uppercase tracking-wide">
          Quote of the week
        </span>
        <span className="text-[10.5px] text-brand-primary/40">
          {new Date(quote.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </figcaption>

      <blockquote
        className="italic text-brand-primary text-[14.5px] md:text-[15.5px] leading-snug"
        style={{ fontFamily: SERIF }}
      >
        “{quote.text}”
      </blockquote>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
        <span className="text-brand-primary/40">—</span>
        <span className="text-brand-primary">
          {quote.speaker && <span className="font-semibold">{quote.speaker}</span>}
          {quote.speaker && quote.client && <span className="text-brand-primary/40">, </span>}
          {quote.client && (
            <span className={quote.speaker ? "text-brand-primary/70" : "font-semibold"}>{quote.client}</span>
          )}
        </span>
        <Link
          href={`/insights/${quote.entryId}`}
          className="ml-auto text-[11.5px] font-medium text-brand-secondary-600 hover:underline"
        >
          See the feedback →
        </Link>
      </div>
    </figure>
  );
}
