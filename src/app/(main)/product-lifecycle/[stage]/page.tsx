import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { STAGES } from "../stages";

type Params = Promise<{ stage: string }>;

export function generateStaticParams() {
  return STAGES.map((s) => ({ stage: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { stage: slug } = await params;
  const stage = STAGES.find((s) => s.slug === slug);
  return { title: `${stage?.type ?? "Product lifecycle"} · Navina Product Insights Hub` };
}

const CARD = "rounded-lg bg-white border border-[rgba(50,43,95,0.08)]";
const NOTE =
  "mt-3 text-[13px] text-brand-primary/65 border-l-[3px] border-[rgba(50,43,95,0.12)] pl-3 max-w-3xl leading-relaxed";

function SectionHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mt-10 mb-4">
      <h2 className="text-[22px] font-extrabold text-brand-primary">{title}</h2>
      {children && (
        <p className="text-[14px] text-brand-primary/65 mt-1 max-w-2xl leading-relaxed">{children}</p>
      )}
    </div>
  );
}

/* ---------- Idea ---------- */

const READY = [
  "OKR linked",
  "Objective impact",
  "Summary with scope in and out",
  "GTM considerations",
  "T-shirt sized (S, M, L, XL)",
  "Dependencies identified",
  "Owning engineering team",
  "Ideation status",
  "Roadmap target quarter or month",
  "Priority score",
];

function IdeaSections() {
  return (
    <>
      <SectionHead title="Definition of Ready: Idea to Epic">
        All ten fields must be complete before the Idea moves to the Dev board and enters the R&amp;D handshake.
      </SectionHead>
      <ol className="grid gap-2 md:grid-cols-2">
        {READY.map((r, i) => (
          <li key={r} className={`${CARD} px-4 py-2 text-[14px]`}>
            <span className="font-bold text-teal-700">{i + 1}.</span> {r}
          </li>
        ))}
      </ol>
      <p className={NOTE}>
        R&amp;D handshake: review session with the Eng Lead, feedback added to the spec, Eng Lead confirms
        readiness, and the delivery link is created in Jira. Only then does the item move to Now.
      </p>
    </>
  );
}

/* ---------- Dev ---------- */

const HIERARCHY = [
  { level: 0, type: "Initiative", desc: "Strategic outcome, spans quarters. Owner: Product Lead" },
  { level: 1, type: "Epic", desc: "Large capability, multiple sprints. Owner: PM" },
  { level: 2, type: "Story", desc: "User-facing slice, fits in a sprint" },
  { level: 2, type: "Task", desc: "Internal work, no user-facing change" },
  { level: 3, type: "Sub-task", desc: "A specific step, under a Story or Task" },
  { level: 2, type: "Bug", desc: "Something is broken" },
  { level: 2, type: "Spike", desc: "Time-boxed research" },
];

const NAMING = [
  {
    type: "Initiative",
    hint: "Strategic outcome, spans quarters",
    format: "Outcome-focused noun phrase. Name the business outcome or theme.",
    length: "Under 50 characters",
    good: ["Population Health: Care gap closure at scale"],
    avoid: ["Q1 population health stuff"],
  },
  {
    type: "Epic",
    hint: "Large capability, multiple sprints",
    format: "Area: Capability. Noun phrase, no verb.",
    length: "Under 50 characters",
    good: ["Analytics: Quality Activity dashboard"],
    avoid: ["Epic for Q1 File Manager work"],
  },
  {
    type: "Story / Task",
    hint: "A slice of work that fits in a sprint",
    format: "User-facing: [Persona] can [action]. Backend or technical, no persona: [Verb] [object].",
    length: "Under 80 characters",
    good: ["Admin can bulk upload users", "Add retry logic to ADT feed ingestion"],
    avoid: ["As an admin I want to upload users so that...", "Backend changes for ADT"],
  },
];

function DevSections() {
  return (
    <>
      <SectionHead title="Ticket hierarchy">
        Idea sits outside the hierarchy on the Product board and becomes an Epic when committed.
      </SectionHead>
      <div className={`${CARD} p-5 overflow-x-auto`}>
        <ul className="space-y-2 min-w-[420px]">
          {HIERARCHY.map((h, i) => (
            <li key={i} className="flex items-baseline gap-3" style={{ paddingLeft: h.level * 28 }}>
              <span className="shrink-0 rounded-pill bg-lavender/60 px-2.5 py-0.5 text-[13px] font-semibold text-brand-primary">
                {h.type}
              </span>
              <span className="text-[14px] text-brand-primary/65">{h.desc}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className={NOTE}>
        The traceability chain is OKR, Idea, Initiative, Epics, Tasks, so every task traces back to a company OKR.
      </p>

      <SectionHead title="Naming guidelines for dev items">
        Three levels: Initiative, Epic, Story. Sentence case. Keep the detail in the description, not the title.
        No ticket IDs, people&apos;s names, dates, or sprint numbers in titles.
      </SectionHead>
      <div className="grid gap-4 md:grid-cols-3">
        {NAMING.map((n) => (
          <div key={n.type} className={`${CARD} p-4`}>
            <p className="text-[17px] font-extrabold text-brand-primary">{n.type}</p>
            <p className="text-[12px] text-brand-primary/50 mb-2">{n.hint}</p>
            <p className="text-[13px] text-brand-primary/75 leading-relaxed">{n.format}</p>
            <p className="text-[12px] font-semibold text-brand-primary/50 mt-2">{n.length}</p>
            <p className="text-[12px] font-semibold text-emerald-700 mt-3 mb-1">Good</p>
            {n.good.map((g) => (
              <p key={g} className="text-[13px] font-mono bg-surface-app rounded-sm px-2 py-1 mb-1">{g}</p>
            ))}
            <p className="text-[12px] font-semibold text-rose-700 mt-3 mb-1">Avoid</p>
            {n.avoid.map((a) => (
              <p key={a} className="text-[13px] font-mono bg-surface-app rounded-sm px-2 py-1 mb-1 text-brand-primary/60">{a}</p>
            ))}
          </div>
        ))}
      </div>
      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        <li className={`${CARD} px-4 py-2.5 text-[14px]`}>
          <b>Say what, not how.</b> Someone should understand the ticket without opening it.
        </li>
        <li className={`${CARD} px-4 py-2.5 text-[14px]`}>
          <b>Check the level:</b> an outcome across quarters is an Initiative, a capability is an Epic, a slice
          of work inside an Epic is a Story or Task.
        </li>
      </ul>
    </>
  );
}

/* ---------- Page ---------- */

export default async function StagePage({ params }: { params: Params }) {
  const { stage: slug } = await params;
  const i = STAGES.findIndex((s) => s.slug === slug);
  if (i < 0) notFound();
  const s = STAGES[i];
  const prev = STAGES[i - 1];
  const next = STAGES[i + 1];

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/product-lifecycle"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-primary/60 hover:text-brand-secondary-600 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Product lifecycle
        </Link>

        <div className={`${CARD} border-t-[6px] ${s.top} p-5`}>
          <p className={`text-[13px] font-semibold ${s.text}`}>{s.board}</p>
          <h1 className="text-[30px] font-extrabold text-brand-primary leading-tight">{s.type}</h1>
          <p className="text-[15px] text-brand-primary/65 mt-1 max-w-2xl">{s.who}</p>

          <dl className="grid gap-3 md:grid-cols-2 mt-4 text-[14px]">
            <div className="bg-surface-app rounded-sm px-3 py-2">
              <dt className="text-[12px] font-semibold text-brand-primary/50">Fed by</dt>
              <dd className="text-brand-primary/80 leading-relaxed">{s.fedBy}</dd>
            </div>
            <div className="bg-surface-app rounded-sm px-3 py-2">
              <dt className="text-[12px] font-semibold text-brand-primary/50">Exit</dt>
              <dd className="text-brand-primary/80 leading-relaxed">{s.exit}</dd>
            </div>
          </dl>

          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-4 inline-flex items-center gap-1.5 rounded-sm border border-current px-3 py-2 text-[14px] font-semibold ${s.text} hover:bg-surface-app transition-colors`}
          >
            {s.cta}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {s.slug === "idea" && <IdeaSections />}
        {s.slug === "dev" && <DevSections />}

        <nav className="mt-12 flex items-center justify-between gap-4 text-[14px] font-semibold">
          {prev ? (
            <Link href={`/product-lifecycle/${prev.slug}`} className="inline-flex items-center gap-1.5 text-brand-primary/70 hover:text-brand-secondary-600">
              <ArrowLeft className="w-4 h-4" />
              {prev.type.split(" / ")[0]}
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/product-lifecycle/${next.slug}`} className="inline-flex items-center gap-1.5 text-brand-primary/70 hover:text-brand-secondary-600">
              {next.type.split(" / ")[0]}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : <span />}
        </nav>
      </div>
    </div>
  );
}
