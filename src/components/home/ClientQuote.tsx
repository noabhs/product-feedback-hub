import Link from "next/link";
import type { RecapQuote } from "@/lib/weekly-recap";

const SERIF = "Georgia, 'Times New Roman', serif";

/**
 * The weekly "voice of the client" quote, set like the pull-quote in a
 * newsletter: a kicker, the words large and in serif, then who said it.
 * Rendered only when the week's brief picked one.
 */
export function ClientQuote({ quote }: { quote: RecapQuote }) {
  const long = quote.text.length > 180;
  return (
    <figure className="relative bg-white rounded-lg border border-[rgba(50,43,95,0.08)] px-6 md:px-10 py-7 md:py-8 overflow-hidden">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-brand-secondary-500" />
      <figcaption className="flex items-baseline gap-2.5 mb-4">
        <span className="text-[12px] font-semibold text-brand-secondary-500 uppercase tracking-wide">
          Voice of the client
        </span>
        <span className="text-[11px] text-brand-primary/40">
          {new Date(quote.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </figcaption>

      <blockquote className="relative">
        <span
          aria-hidden
          className="absolute -left-1 md:-left-3 -top-5 text-[64px] leading-none text-brand-secondary-500/25 select-none"
          style={{ fontFamily: SERIF }}
        >
          “
        </span>
        <p
          className={`relative italic text-brand-primary leading-snug ${
            long ? "text-[19px] md:text-[22px]" : "text-[22px] md:text-[27px]"
          }`}
          style={{ fontFamily: SERIF }}
        >
          {quote.text}”
        </p>
      </blockquote>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="h-px w-8 bg-brand-primary/25" aria-hidden />
        <span className="text-[13.5px] text-brand-primary">
          {quote.speaker && <span className="font-semibold">{quote.speaker}</span>}
          {quote.speaker && quote.client && <span className="text-brand-primary/40">, </span>}
          {quote.client && (
            <span className={quote.speaker ? "text-brand-primary/70" : "font-semibold"}>{quote.client}</span>
          )}
        </span>
        <Link
          href={`/insights/${quote.entryId}`}
          className="ml-auto text-[12px] font-medium text-brand-secondary-600 hover:underline"
        >
          See the feedback →
        </Link>
      </div>
    </figure>
  );
}
