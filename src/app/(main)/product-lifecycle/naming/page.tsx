import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import NamingTool from "@/components/naming/NamingTool";
import {
  KEY_RULE, NAMING_EXAMPLES, OTHER_RULES, TOP_RULES, NAMING_LEVELS, READER_TEST, WHY_IT_MATTERS,
} from "@/lib/naming/guidelines";

export const metadata = { title: "Ticket naming convention · Navina Product Insights Hub" };

const CARD = "rounded-lg bg-white border border-[rgba(50,43,95,0.08)]";

/** A closed box with a heading and one line; the content opens on click. */
function Collapsible({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <details className={`group ${CARD} mt-4 open:shadow-sm`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[18px] font-extrabold text-brand-primary">{title}</span>
          <span className="block text-[14px] text-brand-primary/65 mt-0.5">{sub}</span>
        </span>
        <ChevronDown aria-hidden className="w-5 h-5 shrink-0 text-brand-primary/50 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-[rgba(50,43,95,0.08)] px-5 pb-5 pt-4">{children}</div>
    </details>
  );
}

function SectionHead({ id, title, children }: { id?: string; title: string; children?: React.ReactNode }) {
  return (
    <div id={id} className="mt-10 mb-4 scroll-mt-6">
      <h2 className="text-[22px] font-extrabold text-brand-primary">{title}</h2>
      {children && <p className="text-[14px] text-brand-primary/65 mt-1 max-w-2xl leading-relaxed">{children}</p>}
    </div>
  );
}

export default function TicketNamingPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/product-lifecycle" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-primary/60 hover:text-brand-secondary-600 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          Product lifecycle
        </Link>
        <h1 className="text-[30px] font-extrabold text-brand-primary leading-tight">Ticket naming convention</h1>
        <p className="text-[15px] text-brand-primary/65 mt-1 max-w-2xl leading-relaxed">{WHY_IT_MATTERS}</p>

        <div className="mt-6 rounded-lg bg-teal-50 border border-teal-200 px-5 py-4">
          <p className="text-[12px] font-semibold text-teal-700">The rule that comes first</p>
          <p className="text-[15px] text-brand-primary mt-1 leading-relaxed"><b>{READER_TEST}</b></p>
        </div>

        <SectionHead title="The three rules that matter most" />
        <ol className="grid gap-4 md:grid-cols-3">
          {TOP_RULES.map((r, i) => (
            <li key={r.rule} className={`${CARD} border-t-4 border-t-brand-secondary-500 p-5 flex flex-col`}>
              <span className="text-[28px] font-extrabold text-brand-secondary-600 leading-none">{i + 1}</span>
              <p className="text-[17px] font-extrabold text-brand-primary mt-2 leading-snug">{r.rule}</p>
              <p className="text-[14px] text-brand-primary/70 mt-1.5 leading-relaxed">{r.detail}</p>
              {r.example && (
                <div className="mt-auto pt-4 space-y-1 text-[12.5px] font-mono">
                  {r.example.avoid && (
                    <p className="rounded-sm bg-rose-50 px-2 py-1.5 text-rose-800/90"><span className="font-sans font-bold mr-1.5">Avoid</span>{r.example.avoid}</p>
                  )}
                  <p className="rounded-sm bg-emerald-50 px-2 py-1.5 text-emerald-900"><span className="font-sans font-bold mr-1.5">Use</span>{r.example.use}</p>
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-8">
          <Collapsible title="Also" sub={`${OTHER_RULES.length} more rules, from scope and jargon to linked tickets`}>
            <ol start={4} className="list-decimal pl-6 space-y-2.5 text-[14.5px] leading-relaxed marker:font-bold marker:text-brand-secondary-600 max-w-3xl">
              {OTHER_RULES.map((r) => (
                <li key={r.rule} className="pl-1">
                  <b className="text-brand-primary">{r.rule}.</b> <span className="text-brand-primary/70">{r.detail}</span>
                </li>
              ))}
            </ol>
          </Collapsible>

          <Collapsible title="Format by level" sub="Initiative, Epic and Story each use Product | Topic - then something different">
            <p className="text-[14px] text-brand-primary/65 mb-4 max-w-3xl leading-relaxed">
              Ideas on the Product board follow the Epic format by default. Use the Initiative format for an idea that
              spans quarters, and the Story format for a single action. The Product is the ticket&apos;s Product field,
              for example Analytics or Quality. The Topic is the feature or area inside it, for example Patient registry
              or Task management.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {NAMING_LEVELS.map((n) => (
                <div key={n.type} className={`${CARD} p-4`}>
                  <p className="text-[16px] font-extrabold text-brand-primary">{n.type}</p>
                  <p className="text-[13px] text-brand-primary/75 mt-2 leading-relaxed">{n.format}</p>
                  <p className="text-[12px] font-semibold text-brand-primary/50 mt-3">{n.length}</p>
                  <p className="mt-2 rounded-sm bg-surface-app px-2 py-1.5 font-mono text-[12.5px] text-brand-primary/80">{n.example}</p>
                </div>
              ))}
            </div>
          </Collapsible>

          <Collapsible title="Examples" sub={`${NAMING_EXAMPLES.length} titles to avoid, and what to write instead`}>
            <div className="overflow-x-auto rounded-sm border border-[rgba(50,43,95,0.08)]">
              <table className="w-full min-w-[640px] text-[14px]">
                <thead>
                  <tr className="text-left text-[12px] text-brand-primary/55 bg-surface-app">
                    <th className="px-4 py-2.5 font-semibold">Avoid</th><th className="px-4 py-2.5 font-semibold">Use</th><th className="px-4 py-2.5 font-semibold">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {NAMING_EXAMPLES.map((e) => (
                    <tr key={e.avoid} className="border-t border-[rgba(50,43,95,0.08)] align-top">
                      <td className="px-4 py-2.5 font-mono text-[13px] text-rose-800/80">{e.avoid}</td>
                      <td className="px-4 py-2.5 font-mono text-[13px]">{e.use ?? <em className="font-sans text-brand-primary/55">Needs context first</em>}</td>
                      <td className="px-4 py-2.5 text-brand-primary/65">{e.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Collapsible>
        </div>

        <SectionHead id="review-tool" title="Review a Jira view">
          Paste a link to a Jira view, choose the ideas, and get a proposed name for each. Accept, edit or reject
          each one. Accepting renames the idea in Jira together with its linked Epic and release items. {KEY_RULE}
        </SectionHead>
        <NamingTool />
      </div>
    </div>
  );
}
