import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { STAGES, NIH_BOARD } from "./stages";

export const metadata = { title: "Product lifecycle · Navina Product Insights Hub" };

/**
 * Where ideas come from. Only feature requests have a board of their own, and
 * two of the four aren't in place yet — marked, rather than left to look live.
 */
const SOURCES = [
  { title: "Business needs", body: "Strategy, market, GTM, leadership asks. Becomes an Idea once the PM shapes it and links it to the objective it serves.", soon: true },
  { title: "Goals and OKRs", body: "Company and group objectives. Every Idea links to a company objective (OKR).", soon: true },
  { title: "Product thinking", body: "Discovery, customer insights, and technical input from R&D." },
  {
    title: "Feature requests",
    body: "Client and internal asks, triaged weekly on the NIH board. Approved requests become an Idea or merge into an existing one, and the requester is notified.",
    href: NIH_BOARD,
    cta: "Open NIH board",
  },
];

const CARD = "rounded-lg bg-white border border-[rgba(50,43,95,0.08)]";

export default function ProductLifecyclePage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[30px] font-extrabold text-brand-primary mb-2 leading-tight">Product lifecycle</h1>
          <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
            How work moves through Jira, from product idea to release. Three steps: Idea, Epic, Release. Many
            things can start an idea. Open a step to see its rules, naming and boards.
          </p>
        </div>

        <p className="text-[13px] font-semibold text-brand-primary/50 mb-2">Ideas are fed from four sources</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SOURCES.map((s) => (
            <div key={s.title} className={`${CARD} border-b-4 border-b-teal-500 p-4 flex flex-col`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-bold text-brand-primary">{s.title}</p>
                {s.soon && (
                  <span className="shrink-0 rounded-pill bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-amber-800">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-[13px] text-brand-primary/65 mt-1 leading-relaxed">{s.body}</p>
              {s.href && (
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal-700 hover:underline"
                >
                  {s.cta}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 my-3 text-[13px] text-brand-primary/50">
          <span className="flex-1 border-t-2 border-dashed border-[rgba(50,43,95,0.12)]" />
          feed ideas
          <span className="flex-1 border-t-2 border-dashed border-[rgba(50,43,95,0.12)]" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STAGES.map((s, i) => (
            <div key={s.slug} className="relative">
              <Link
                href={`/product-lifecycle/${s.slug}`}
                className={`group ${CARD} border-t-[6px] ${s.top} p-4 h-full flex flex-col gap-2 hover:shadow-md hover:border-brand-secondary-500 transition`}
              >
                <p className={`text-[13px] font-semibold ${s.text}`}>{s.board}</p>
                <p className="text-[22px] font-extrabold text-brand-primary leading-tight">{s.type}</p>
                <p className="text-[14px] text-brand-primary/65">{s.who}</p>
                <p className="text-[13px] bg-surface-app rounded-sm px-2 py-1.5 text-brand-primary/65">
                  <b className="text-brand-primary">Exit:</b> {s.exit}
                </p>
                <span className={`mt-auto pt-2 inline-flex items-center gap-1.5 text-[14px] font-semibold ${s.text}`}>
                  See details
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
              {i < STAGES.length - 1 && (
                <ArrowRight
                  aria-hidden
                  className="hidden md:block absolute -right-[18px] top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-brand-primary/40"
                />
              )}
            </div>
          ))}
        </div>

        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-brand-primary/65">
          <li><b className="text-brand-primary">Initiative</b> sits above Epics and groups them by strategic outcome</li>
          <li><b className="text-brand-primary">Many to one:</b> several sources can merge into one Idea</li>
          <li><b className="text-brand-primary">One to many:</b> one Idea can split into several Epics</li>
        </ul>
      </div>
    </div>
  );
}
