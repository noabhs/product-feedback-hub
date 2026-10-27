import { ArrowRight, ExternalLink } from "lucide-react";

export const metadata = { title: "Product lifecycle · Navina Product Insights Hub" };

const JIRA = "https://navina.atlassian.net/browse";
const DEV_BOARD = "https://navina.atlassian.net/jira/boards?page=1&projectLocation=10022&sortKey=name&sortOrder=ASC";

/** Where ideas come from. Only feature requests have a board of their own. */
const SOURCES = [
  { title: "Business needs", body: "Strategy, market, GTM, leadership asks. Becomes an Idea once the PM shapes it and links it to the objective it serves." },
  { title: "Goals and OKRs", body: "Company and group objectives. Every Idea links to a company objective (OKR)." },
  { title: "Product thinking", body: "Discovery, customer insights, and technical input from R&D." },
  {
    title: "Feature requests",
    body: "Client and internal asks, triaged weekly on the NIH board. Approved requests become an Idea or merge into an existing one, and the requester is notified.",
    href: `${JIRA}/NIH`,
    cta: "Open NIH board",
  },
];

/** Static class strings, so Tailwind can see every one of them. */
const STAGES = [
  {
    board: "Product board",
    type: "Idea",
    who: "An opportunity under discovery, whatever its source. Owned by the PM.",
    exit: "Definition of Ready complete, R&D handshake",
    note: "Product is the only gatekeeper: no Definition of Ready, no commitment.",
    href: `${JIRA}/PRODUCT`,
    cta: "Open Product board",
    top: "border-t-teal-500",
    text: "text-teal-700",
  },
  {
    board: "Dev board",
    type: "Initiative / Epic / Story",
    who: "Committed build work. Owned by the PM with the R&D lead.",
    exit: "Dev done, PM sign-off",
    note: "Fed by Ideas that passed Definition of Ready and the R&D handshake. Work is broken into Stories, Tasks, Bugs and Spikes, each under one Epic.",
    href: DEV_BOARD,
    cta: "Open Dev board",
    top: "border-t-brand-secondary-500",
    text: "text-brand-secondary-600",
  },
  {
    board: "Release board",
    type: "Rel item",
    who: "What ships, to whom, and when. Owned by the PM as release owner.",
    exit: "GA rollout, then monitoring",
    note: "Fed by Epics committed to the roadmap with a target quarter. The PM owns it through Beta, GA and monitoring.",
    href: `${JIRA}/REL`,
    cta: "Open Release board",
    top: "border-t-orange-500",
    text: "text-orange-700",
  },
];

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

const BOARDS = [
  { name: "NIH", label: "Feature request triage", href: `${JIRA}/NIH` },
  { name: "PRODUCT", label: "Ideas (Product board)", href: `${JIRA}/PRODUCT` },
  { name: "NA", label: "Dev board: Initiatives, Epics, Stories", href: DEV_BOARD },
  { name: "REL", label: "Release board", href: `${JIRA}/REL` },
];

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

const CARD = "rounded-lg bg-white border border-[rgba(50,43,95,0.08)]";

export default function ProductLifecyclePage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-2">
          <h1 className="text-[30px] font-extrabold text-brand-primary mb-2 leading-tight">Product lifecycle</h1>
          <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
            How work moves through Jira, from product idea to release. Three steps: Idea, Epic, Release. Many
            things can start an idea. Each ticket type has one job, one naming format, and one board it lives on.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {BOARDS.map((b) => (
              <a
                key={b.name}
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                title={b.label}
                className="inline-flex items-center gap-1.5 rounded-pill bg-white border border-[rgba(50,43,95,0.1)] px-3 py-1 text-[12px] font-medium text-brand-primary/70 hover:border-brand-secondary-500 hover:text-brand-secondary-600 transition-colors"
              >
                {b.name} · {b.label}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            ))}
          </div>
        </div>

        <SectionHead title="The lifecycle">
          Ideas are fed from four sources. Each idea then moves left to right: Idea, Epic, Release.
        </SectionHead>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SOURCES.map((s) => (
            <div key={s.title} className={`${CARD} border-b-4 border-b-teal-500 p-4 flex flex-col`}>
              <p className="text-[14px] font-bold text-brand-primary">{s.title}</p>
              <p className="text-[13px] text-brand-primary/65 mt-1 leading-relaxed">{s.body}</p>
              {s.href && (
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto pt-3 text-[13px] font-semibold text-teal-700 hover:underline"
                >
                  {s.cta}
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
            <div key={s.board} className="relative">
              <div className={`${CARD} border-t-[6px] ${s.top} p-4 h-full flex flex-col gap-2`}>
                <p className={`text-[13px] font-semibold ${s.text}`}>{s.board}</p>
                <p className="text-[22px] font-extrabold text-brand-primary leading-tight">{s.type}</p>
                <p className="text-[14px] text-brand-primary/65">{s.who}</p>
                <p className="text-[13px] bg-surface-app rounded-sm px-2 py-1.5 text-brand-primary/65">
                  <b className="text-brand-primary">Exit:</b> {s.exit}
                </p>
                <p className="text-[13px] text-brand-primary/65 leading-relaxed">{s.note}</p>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-sm border border-current px-3 py-2 text-[14px] font-semibold ${s.text} hover:bg-surface-app transition-colors`}
                >
                  {s.cta}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
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
        <p className="mt-3 text-[13px] text-brand-primary/65 border-l-[3px] border-[rgba(50,43,95,0.12)] pl-3 max-w-3xl leading-relaxed">
          The traceability chain is OKR, Idea, Initiative, Epics, Tasks, so every task traces back to a company OKR.
        </p>

        <SectionHead title="Naming guidelines for dev items">
          Three levels: Initiative, Epic, Story. Sentence case. Keep the detail in the description, not the
          title. No ticket IDs, people&apos;s names, dates, or sprint numbers in titles.
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
            <b>Check the level:</b> an outcome across quarters is an Initiative, a capability is an Epic, a
            slice of work inside an Epic is a Story or Task.
          </li>
        </ul>

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
        <p className="mt-3 text-[13px] text-brand-primary/65 border-l-[3px] border-[rgba(50,43,95,0.12)] pl-3 max-w-3xl leading-relaxed">
          R&amp;D handshake: review session with the Eng Lead, feedback added to the spec, Eng Lead confirms
          readiness, and the delivery link is created in Jira. Only then does the item move to Now.
        </p>
      </div>
    </div>
  );
}
