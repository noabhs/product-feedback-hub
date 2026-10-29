import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NamingTool from "@/components/naming/NamingTool";
import {
  KEY_RULE, LINKED_RULES, NAMING_EXAMPLES, NAMING_LEVELS, NAMING_RULES, READER_TEST, WHY_IT_MATTERS,
} from "@/lib/naming/guidelines";

export const metadata = { title: "Ticket naming convention · Navina Product Insights Hub" };

const CARD = "rounded-lg bg-white border border-[rgba(50,43,95,0.08)]";

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
          <p className="text-[15px] text-brand-primary mt-1 leading-relaxed"><b>The reader test:</b> {READER_TEST}</p>
        </div>

        <SectionHead title="General rules" />
        <ol className="grid gap-2 md:grid-cols-2">
          {NAMING_RULES.map((r, i) => (
            <li key={r.rule} className={`${CARD} px-4 py-2.5 text-[14px] leading-relaxed`}>
              <span className="font-bold text-brand-secondary-600">{i + 1}.</span> <b>{r.rule}.</b> <span className="text-brand-primary/70">{r.detail}</span>
            </li>
          ))}
        </ol>

        <SectionHead title="Format by level">
          Ideas on the Product board follow the Epic format by default. Use the Initiative format for an idea that
          spans quarters, and the Story format for a single action. The Area is the product area or feature, for
          example File Manager, Patient cohorts, Patient registry or User management.
        </SectionHead>
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

        <SectionHead title="Rules for linked items" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {LINKED_RULES.map((l) => (
            <div key={l.name} className={`${CARD} border-t-4 border-t-brand-secondary-500 p-4`}>
              <p className="text-[15px] font-extrabold text-brand-primary">{l.name}</p>
              <p className="text-[13px] text-brand-primary/70 mt-1 leading-relaxed">{l.body}</p>
            </div>
          ))}
        </div>

        <SectionHead title="Examples" />
        <div className={`${CARD} overflow-x-auto`}>
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

        <SectionHead id="review-tool" title="Review a Jira view">
          Paste a link to a Jira view, choose the ideas, and get a proposed name for each. Accept, edit or reject
          each one. Accepting renames the idea in Jira together with its linked Epic and release items. {KEY_RULE}
        </SectionHead>
        <NamingTool />
      </div>
    </div>
  );
}
