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

      <SectionHead title="Naming an idea">
        Ideas on the Product board follow the Epic format by default, and an idea and its linked Epic carry the
        same title.{" "}
        <Link href="/product-lifecycle/dev#naming" className="font-semibold text-brand-secondary-600 hover:underline">
          See the naming guidelines
        </Link>
        .
      </SectionHead>
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
];

const NAMING_RULES = [
  <>Use sentence case. Proper nouns and product terms keep their capitals (File Manager, Epic, HCC, SFTP).</>,
  <>Name the action and the object. A bare noun like &quot;Internal users&quot; or &quot;Shell users&quot; fails the reader test.</>,
  <>Keep qualifiers that change the scope, such as &quot;including admin UI&quot;, &quot;roster accounts&quot; or &quot;not only by SFTP&quot;.</>,
  <>Spell out jargon outsiders won&apos;t know, such as PB. Keep terms the whole company uses, such as HCC, EHR, SFTP and HIE.</>,
  <>Say what, not how. Put the detail, the reasoning and the technology choices in the description.</>,
  <>Don&apos;t put ticket IDs, people&apos;s names, dates or sprint numbers in titles.</>,
  <>Check the level: an outcome across quarters is an Initiative, a capability is an Epic, and a slice of work inside an Epic is a Story or Task.</>,
];

const NAMING = [
  {
    type: "Initiative",
    format: "A noun phrase that names the business outcome.",
    length: "Up to 90 characters",
  },
  {
    type: "Epic, or an idea at Epic level",
    format: "Area: what changes, in plain words. A verb is fine if it makes the title clearer.",
    length: "Up to 90 characters",
  },
  {
    type: "Story / Task",
    format: "User-facing: [Persona] can [action]. Technical, with no persona: [Verb] [object].",
    length: "Up to 80 characters",
  },
];

const LINKED_RULES = [
  {
    name: "Same name",
    body: "An idea and its linked dev Epic carry the same title. When one is renamed, rename the other.",
  },
  {
    name: "Team suffix",
    body: "Delivery work split by team gets the team in parentheses at the end, for example Patient registry: Audit log (Analytics). If the team's work has no component name of its own, use <Area>: <Team> tasks.",
  },
  {
    name: "Missing context",
    body: "If the title can't pass the reader test and nobody knows the meaning yet, keep the current title and write NEED TO UPDATE TICKET NAME in capitals at the top of the description. Don't guess.",
  },
];

/** use === null means the right title can't be written until someone supplies the context. */
const NAMING_EXAMPLES: { avoid: string; use: string | null; why: string }[] = [
  { avoid: "User management: Internal users", use: null, why: "A bare noun that doesn't say what the work is." },
  { avoid: "Delete users", use: "Admin can delete users", why: "It names who does what." },
  {
    avoid: "File Manager: Failed file visibility",
    use: "File Manager: Show every file, including failed ones, with a status and failure reason",
    why: "The longer title says what changes.",
  },
  {
    avoid: "Analytics | Patient Registry - Service & DB",
    use: "Patient registry: Merge patient configurations and cohorts into one service (Analytics)",
    why: "The Area comes first and the title says what is built.",
  },
  { avoid: "Patients insurance logic change for PB", use: null, why: "It uses undefined jargon and doesn't say what changes." },
  {
    avoid: "Epic for Q1 File Manager work",
    use: "File Manager: Upload several files at once",
    why: "It carries a date and doesn't say what the work is.",
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

      <div id="naming" className="scroll-mt-6" />
      <SectionHead title="Naming guidelines for ideas and dev items">
        Three levels: Initiative, Epic, Story/Task. Ideas on the Product board follow the Epic format by
        default. Use the Initiative format for an idea that spans quarters, and the Story format for a single
        action.
      </SectionHead>

      <div className="rounded-lg bg-teal-50 border border-teal-200 px-5 py-4">
        <p className="text-[12px] font-semibold text-teal-700">The rule that comes first</p>
        <p className="text-[15px] text-brand-primary mt-1 leading-relaxed">
          <b>The reader test:</b> someone outside the team should understand what changes, and for whom, from
          the title alone. If they would need to open the ticket to find out what the work is, rewrite the title.
        </p>
      </div>

      <h3 className="text-[16px] font-extrabold text-brand-primary mt-8 mb-3">General rules</h3>
      <ol className="grid gap-2 md:grid-cols-2">
        {NAMING_RULES.map((r, i) => (
          <li key={i} className={`${CARD} px-4 py-2.5 text-[14px] leading-relaxed`}>
            <span className="font-bold text-brand-secondary-600">{i + 1}.</span> {r}
          </li>
        ))}
      </ol>

      <h3 className="text-[16px] font-extrabold text-brand-primary mt-8 mb-3">Format by level</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {NAMING.map((n) => (
          <div key={n.type} className={`${CARD} p-4`}>
            <p className="text-[16px] font-extrabold text-brand-primary">{n.type}</p>
            <p className="text-[13px] text-brand-primary/75 mt-2 leading-relaxed">{n.format}</p>
            <p className="text-[12px] font-semibold text-brand-primary/50 mt-3">{n.length}</p>
          </div>
        ))}
      </div>
      <p className={NOTE}>
        The Area is the product area or feature, for example File Manager, Patient cohorts, Patient registry or
        User management.
      </p>

      <h3 className="text-[16px] font-extrabold text-brand-primary mt-8 mb-3">Rules for linked items</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {LINKED_RULES.map((l) => (
          <div key={l.name} className={`${CARD} border-t-4 border-t-brand-secondary-500 p-4`}>
            <p className="text-[15px] font-extrabold text-brand-primary">{l.name}</p>
            <p className="text-[13px] text-brand-primary/70 mt-1 leading-relaxed">{l.body}</p>
          </div>
        ))}
      </div>

      <h3 className="text-[16px] font-extrabold text-brand-primary mt-8 mb-3">Examples</h3>
      <div className={`${CARD} overflow-x-auto`}>
        <table className="w-full min-w-[640px] text-[14px]">
          <thead>
            <tr className="text-left text-[12px] text-brand-primary/55 bg-surface-app">
              <th className="px-4 py-2.5 font-semibold">Avoid</th>
              <th className="px-4 py-2.5 font-semibold">Use</th>
              <th className="px-4 py-2.5 font-semibold">Why</th>
            </tr>
          </thead>
          <tbody>
            {NAMING_EXAMPLES.map((e) => (
              <tr key={e.avoid} className="border-t border-[rgba(50,43,95,0.08)] align-top">
                <td className="px-4 py-2.5 font-mono text-[13px] text-rose-800/80">{e.avoid}</td>
                <td className="px-4 py-2.5 font-mono text-[13px]">
                  {e.use ?? <em className="font-sans text-brand-primary/55">Needs context first</em>}
                </td>
                <td className="px-4 py-2.5 text-brand-primary/65">{e.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- Release ---------- */

/** Statuses as they appear on the REL board. Monitor and Support follows both rollouts. */
const RELEASE_STEPS = [
  { name: "Release Creation", desc: "The Release Event is opened." },
  { name: "Release Planning", desc: "Scope, audience and date are set." },
  { name: "Beta Rollout", desc: "Shipped to the beta group." },
  { name: "Monitor and Support", desc: "Watch and support the beta before going wider." },
  { name: "GA Rollout", desc: "Shipped to everyone." },
  { name: "Monitor and Support", desc: "Watch and support after GA." },
];

const CHILD_TICKETS = [
  {
    type: "Rollout Phase",
    body: "One per phase: Pre-Requisite, Beta Rollout and GA Rollout. Beta is marked Won't Do when a release skips it.",
  },
  {
    type: "CS/Delivery Handover",
    body: "The handover of the release to CS and Delivery, created in the Pre-Requisite phase.",
  },
  {
    type: "Communication Release",
    body: "The communication for the release, created in the Pre-Requisite phase.",
  },
];

const COMING_SOON = [
  "Release checklist",
  "Internal and external communication",
  "Who is told, and where",
  "What to monitor after GA",
];

function ReleaseSections() {
  return (
    <>
      <SectionHead title="Release Event statuses">
        A Release Event moves through these statuses on the Release board. Monitor and Support comes after
        Beta and again after GA.
      </SectionHead>
      <ol className="grid gap-2 md:grid-cols-3">
        {RELEASE_STEPS.map((st, i) => (
          <li key={i} className={`${CARD} px-4 py-3`}>
            <p className="text-[14px] font-bold text-brand-primary">
              <span className="text-orange-700">{i + 1}.</span> {st.name}
            </p>
            <p className="text-[13px] text-brand-primary/65 mt-0.5">{st.desc}</p>
          </li>
        ))}
      </ol>

      <SectionHead title="What sits under a Release Event">
        Every Release Event has child tickets. These are the types you will see on the board.
      </SectionHead>
      <div className="grid gap-4 md:grid-cols-3">
        {CHILD_TICKETS.map((c) => (
          <div key={c.type} className={`${CARD} border-t-4 border-t-orange-500 p-4`}>
            <p className="text-[16px] font-extrabold text-brand-primary">{c.type}</p>
            <p className="text-[13px] text-brand-primary/65 mt-1 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      <SectionHead title="Coming soon" />
      <ul className="grid gap-2 md:grid-cols-2">
        {COMING_SOON.map((t) => (
          <li key={t} className={`${CARD} border-dashed px-4 py-3 text-[14px] text-brand-primary/60`}>
            {t}
          </li>
        ))}
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
        {s.slug === "release" && <ReleaseSections />}

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
