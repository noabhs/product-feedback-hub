"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import "./lifecycle.css";
import {
  ART,
  GATE,
  GOLIVE,
  ITEMS,
  ORDER,
  OF,
  PHASES,
  RHYTHM,
  RULES,
  RELEASE,
  type ArtKey,
  type Chip,
  type Group,
  type Phase,
} from "./data";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "rhythm", label: "Rhythm" },
  { id: "handoff", label: "Handoff" },
  { id: "rules", label: "Rules" },
  { id: "ref", label: "Reference" },
] as const;
type TabId = (typeof TABS)[number]["id"];
const isTab = (s: string): s is TabId => TABS.some((t) => t.id === s);

/**
 * The URL hash is the whole navigation state: a tab (#rules), a phase (#prepare) or a step (#hld).
 * replaceState fires no event of its own, so setHash announces the change itself.
 */
const HASH_EVENT = "lifecycle-hash";
function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  window.addEventListener(HASH_EVENT, cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener(HASH_EVENT, cb);
  };
}
const readHash = () => window.location.hash.slice(1);
function setHash(h: string) {
  try {
    if (window.location.hash !== "#" + h) window.history.replaceState(null, "", "#" + h);
  } catch {
    /* a sandboxed frame may refuse; the page still works without the hash */
  }
  window.dispatchEvent(new Event(HASH_EVENT));
}

const phaseById = (id: string) => PHASES.find((p) => p.id === id);
const sty = (o: { c: string; dark?: boolean }, extra?: Record<string, string | number>) =>
  ({ "--c": o.c, ...(o.dark ? { "--on": "#1B1A47" } : {}), ...extra }) as React.CSSProperties;

const Svg = ({ k }: { k: ArtKey }) => <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: ART[k] }} />;

const ARROW = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const CHEV = (
  <svg
    className="chev"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const MINIDIA = (
  <svg viewBox="0 0 40 40" aria-hidden="true">
    <path d="M20 3l17 17-17 17L3 20z" fill="#F5A524" />
    <path d="M13 20l5 5 9-10" fill="none" stroke="#1B1A47" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- overview ---------- */

function StepChip({ c }: { c: Chip }) {
  if (Array.isArray(c)) {
    return (
      <li>
        <button type="button" className="chipb" data-item={c[1]}>
          {c[0]}
        </button>
      </li>
    );
  }
  if ("gate" in c) {
    const g = c.gate === 1 ? GATE : GOLIVE;
    return (
      <li className="gstep">
        <button type="button" className="gchip" data-item={c.id}>
          {MINIDIA}
          {c.gate === 1 ? "Roadmap gate" : "Go-live gate"}
        </button>
        <span className="gt-s">{g.sub}</span>
      </li>
    );
  }
  return (
    <li className="par">
      <button type="button" className="chipb" data-item={c.id}>
        {c.t}
      </button>
    </li>
  );
}

function PhaseCard({ p, i }: { p: Phase; i: number }) {
  return (
    <div className={`ph${p.arr ? " arr" : ""}`} data-phase={p.id} style={sty(p, { "--i": i })}>
      <div className="ph-art">
        <span className="tag">{i + 1}</span>
        <Svg k={p.art} />
      </div>
      <div className="ph-b">
        <h3>{p.n}</h3>
        <p className="mission">{p.mission}</p>
        <ul className="steps2">
          {p.chips.map((c) => (
            <StepChip key={Array.isArray(c) ? c[1] : c.id} c={c} />
          ))}
        </ul>
        {p.note && <p className="note">{p.note}</p>}
        <div className="who">{p.who}</div>
        <button className="lnk" type="button" data-phase={p.id}>
          Details {ARROW}
        </button>
      </div>
    </div>
  );
}

function Groups({ items }: { items: Group[] }) {
  return (
    <>
      {items.map((r, i) => (
        <div className="group" key={r.n} style={sty(r, { "--i": i })}>
          <div className="g-main">
            <div className="art">
              <span className="tag">{r.when}</span>
              <Svg k={r.art} />
            </div>
            <div className="gb">
              <h3>{r.n}</h3>
              <p className="mission">{r.mission}</p>
            </div>
          </div>
          <div className="g-side">
            <h4>Details</h4>
            <div className="sq-grid">
              {r.rows.map(([h, t]) => (
                <div className="sq" key={h}>
                  <h5>{h}</h5>
                  <p>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

const Cell = ({ items }: { items: string[] }) => (
  <ul className="cell">
    {items.map((x) => (
      <li key={x}>{x}</li>
    ))}
  </ul>
);

/* ---------- panel ---------- */

function Accordion({ id, open, onToggle }: { id: string; open: boolean; onToggle: () => void }) {
  const it = ITEMS[id];
  const section = (h: string, a: string[]) => (
    <div className="sec">
      <h4>{h}</h4>
      <ul>
        {a.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
  return (
    <section className="acc" id={`acc-${id}`} style={sty(it)}>
      <h3 className="acc-hd">
        <button className="acc-h" type="button" id={`acch-${id}`} aria-expanded={open} aria-controls={`accb-${id}`} onClick={onToggle}>
          <span className="acc-tag">{it.tag}</span>
          <span className="acc-t">
            <b>{it.title}</b>
            <span>{it.sum}</span>
          </span>
          {CHEV}
        </button>
      </h3>
      <div className="acc-b" id={`accb-${id}`} role="region" aria-labelledby={`acch-${id}`} hidden={!open}>
        <p className="acc-m">{it.mission}</p>
        {section("Owner", [it.owner])}
        {section("Exit criteria", it.exit)}
        {section(it.flabel || "Required fields", it.fields)}
        {section("Automation", it.auto)}
      </div>
    </section>
  );
}

/* ---------- page ---------- */

export default function Lifecycle() {
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  // What the hash means: a tab, a phase or a step. Phases and steps live in the Overview panel.
  const phase = phaseById(hash) ?? (OF[hash] ? phaseById(OF[hash]) : undefined);
  const tab: TabId = isTab(hash) ? hash : "overview";
  const cur = ITEMS[hash] ? hash : phase?.items[0];
  const open = !!phase;

  // The panel keeps showing its last phase while it slides out.
  const [lastPhase, setLastPhase] = useState<Phase | null>(null);
  if (phase && phase !== lastPhase) setLastPhase(phase);
  const shown = phase ?? lastPhase;

  // A row the reader collapsed stays collapsed until the hash moves on.
  const [collapsed, setCollapsed] = useState<{ hash: string } | null>(null);
  const openId = open && cur && collapsed?.hash !== hash ? cur : null;

  const toTop = () => rootRef.current?.closest("main")?.scrollTo(0, 0);
  const reduced = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function openItem(id: string, from?: HTMLElement | null) {
    if (!open) lastFocus.current = from ?? (document.activeElement as HTMLElement | null);
    setHash(id);
  }
  function openPhase(pid: string, from?: HTMLElement | null) {
    const p = phaseById(pid);
    if (!p) return;
    if (!open) lastFocus.current = from ?? (document.activeElement as HTMLElement | null);
    setHash(pid);
  }
  function closePanel() {
    setHash(tab);
    lastFocus.current?.focus();
  }
  function go(tabId: TabId) {
    setHash(tabId);
    toTop();
  }
  const navigate = (d: number) => {
    const t = cur ? ORDER[ORDER.indexOf(cur) + d] : undefined;
    if (t) openItem(t);
  };

  // Moving between phases starts the panel at its top, then brings the open row into view.
  useEffect(() => {
    if (phase && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [phase]);
  useEffect(() => {
    if (openId) document.getElementById(`acc-${openId}`)?.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
  }, [openId]);
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  // A hash that names a tab, phase or step from outside (a shared link) starts at the top of the page.
  useEffect(() => {
    if (!hash) return;
    const t = window.setTimeout(toTop, 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
      else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(-1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function onMainClick(e: React.MouseEvent) {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-go],[data-item],[data-phase]");
    if (!t) return;
    const goTo = t.getAttribute("data-go");
    if (goTo && isTab(goTo)) return go(goTo);
    const item = t.getAttribute("data-item");
    if (item) return openItem(item, t);
    const p = t.getAttribute("data-phase");
    if (p) openPhase(p, t);
  }

  const pv = cur ? ORDER[ORDER.indexOf(cur) - 1] : undefined;
  const nx = cur ? ORDER[ORDER.indexOf(cur) + 1] : undefined;

  return (
    <div className="lc" ref={rootRef}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- React 19 hoists this to the head, and it only loads while this page is open */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap"
        precedence="default"
      />
      <header className="top">
        <div className="top-in">
          <div className="brand">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="10" fill="#5B3FE8" />
              <circle cx="8.5" cy="16" r="3.4" fill="#fff" />
              <circle cx="16" cy="16" r="3.4" fill="#FFB84D" />
              <circle cx="23.5" cy="16" r="3.4" fill="#fff" />
              <path d="M12 16h1M19.5 16h1" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>From goals to impact</span>
          </div>
          <div className="tabs" role="tablist" aria-label="Views">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`view-${t.id}`}
                onClick={() => go(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="spacer" />
          <Link className="btn" href="/product-lifecycle/naming">
            Ticket naming and renaming tool
          </Link>
        </div>
      </header>

      <div className="lc-main" onClick={onMainClick}>
        <section id="view-overview" role="tabpanel" aria-labelledby="tab-overview" hidden={tab !== "overview"}>
          <div className="intro">
            <div>
              <h1>The whole cycle</h1>
              <p>
                From company goals to a live feature, and back to new ideas. Two gates protect dev effort and releases. A feedback loop
                closes the cycle. Select any box or step for its detail.
              </p>
            </div>
            <div className="stats">
              <div className="stat">
                <b>6</b>phases
              </div>
              <div className="stat">
                <b>2</b>gates
              </div>
              <div className="stat">
                <b>1</b>feedback loop
              </div>
            </div>
          </div>
          <div className="flow">
            {PHASES.map((p, i) => (
              <PhaseCard key={p.id} p={p} i={i} />
            ))}
          </div>
          <div className="boards" aria-label="Which board each phase lives on">
            <a
              className="bar p"
              href="https://navina.atlassian.net/jira/polaris/projects/PRODUCT/ideas/view/7348286"
              target="_blank"
              rel="noopener noreferrer"
            >
              {"PRODUCT board: ideas, why and what "}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </a>
            <a
              className="bar d"
              href="https://navina.atlassian.net/jira/boards?page=1&amp;projectLocation=10022&amp;sortKey=name&amp;sortOrder=ASC"
              target="_blank"
              rel="noopener noreferrer"
            >
              {"Dev board: initiatives, epics, stories "}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </a>
            <a className="bar r" href="https://navina.atlassian.net/browse/REL" target="_blank" rel="noopener noreferrer">
              {"Release board: release events and rollout "}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </a>
          </div>
          <div className="loop">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              stroke="#3E63DD"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M40 24a16 16 0 1 1-4.7-11.3" />
              <path d="M40 8v10H30" />
            </svg>
            <div>
              <h3>The feedback loop</h3>
              <p>
                After go-live we keep checking KPIs and collecting feedback. Results feed the next goals and OKRs, and improvements become
                new ideas.
              </p>
            </div>
            <div className="to">
              <span className="chip" style={{ "--c": "#E93D82" } as React.CSSProperties}>
                Goals and OKRs
              </span>
              <span className="chip" style={{ "--c": "#8E4EC6" } as React.CSSProperties}>
                New Idea
              </span>
            </div>
          </div>
          <div className="express" style={{ "--dark": "color-mix(in srgb,#E5702A 58%,var(--ink))" } as React.CSSProperties}>
            <h3>Express lane</h3>
            <p>
              Bugs, incidents, KTLO, tech debt and client escalations skip the roadmap gate. They keep a PRODUCT link and use a reserved
              share of dev capacity.
            </p>
            <button className="lnk" type="button" data-go="rules">
              {"Rules "}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <p className="sect-sub" style={{ marginTop: "14px" }}>
            Select a phase, a step or a gate to open its owner, exit criteria, required fields and automation. In the panel, use Previous
            and Next (or the arrow keys) to walk the whole flow in order.
          </p>
        </section>
        <section id="view-rhythm" role="tabpanel" aria-labelledby="tab-rhythm" hidden={tab !== "rhythm"}>
          <div className="intro">
            <div>
              <h1>The planning rhythm</h1>
              <p>
                Top-down goals and product OKRs are set before each quarter, then two quarterly meetings run the work. Between sessions, the
                Product Lead and Eng lead can approve urgent changes.
              </p>
            </div>
            <div className="stats">
              <div className="stat">
                <b>Before</b>goals and OKRs
              </div>
              <div className="stat">
                <b>Weeks 1-2</b>candidates
              </div>
              <div className="stat">
                <b>Last 2 weeks</b>roadmap and dev planning
              </div>
            </div>
          </div>
          <div className="groups">
            <Groups items={RHYTHM} />
          </div>
          <h2 className="sect">Roadmap: Now, Next, Later</h2>
          <p className="sect-sub">
            Defined by the Planned Quarter field, not by status. A quarter is only set at the roadmap gate, and only for this quarter or the
            next.
          </p>
          <div className="sq-grid wide page">
            <div className="sq" style={{ "--c": "#30A46C" } as React.CSSProperties}>
              <h5>Now (this quarter)</h5>
              <p>
                Planned Quarter is the current quarter. Mostly In Development and Gradual Rollout, plus items still in HLD or Ready for Dev
                that were given this quarter.
              </p>
            </div>
            <div className="sq" style={{ "--c": "#F5A524" } as React.CSSProperties}>
              <h5>Next (next quarter)</h5>
              <p>
                Planned Quarter is the next quarter. Passed the roadmap gate and is in HLD in progress or Ready for Dev, waiting to be
                pulled into development.
              </p>
            </div>
            <div className="sq" style={{ "--c": "#3E63DD" } as React.CSSProperties}>
              <h5>Later</h5>
              <p>No Planned Quarter yet. Exploration, PRD in progress and anything that has not passed the roadmap gate.</p>
            </div>
            <div className="sq" style={{ "--c": "#E5702A" } as React.CSSProperties}>
              <h5>At quarter end</h5>
              <p>Next becomes Now. Anything in Now that is not live yet is flagged and re-confirmed under change control.</p>
            </div>
          </div>
          <h2 className="sect">View by Navina OKR</h2>
          <p className="sect-sub">
            A view grouped by Navina OKR, showing status, Product, Team and PM, and excluding Done and Cancelled. The same view feeds both
            meetings.
          </p>
          <div className="sq-grid wide page">
            <div className="sq" style={{ "--c": "#8E4EC6" } as React.CSSProperties}>
              <h5>The view</h5>
              <p>Grouped by OKR, one view for the quarterly candidates meeting and dev planning</p>
            </div>
            <div className="sq" style={{ "--c": "#F5A524" } as React.CSSProperties}>
              <h5>Check 1: no OKR</h5>
              <p>In-flight ideas with no OKR and no exempt tag. Fix at the next candidates meeting.</p>
            </div>
            <div className="sq" style={{ "--c": "#EF5350" } as React.CSSProperties}>
              <h5>Check 2: no ideas</h5>
              <p>KRs with no ideas in flight. These are coverage gaps.</p>
            </div>
            <div className="sq" style={{ "--c": "#12A594" } as React.CSSProperties}>
              <h5>OKR field</h5>
              <p>{'Rename "Navina Q4 OKR" to "Navina OKR". Options carry the quarter prefix, so the field is never rebuilt.'}</p>
            </div>
          </div>
        </section>
        <section id="view-handoff" role="tabpanel" aria-labelledby="tab-handoff" hidden={tab !== "handoff"}>
          <div className="intro">
            <div>
              <h1>Handoffs: to dev, then to clients</h1>
              <p>
                Passing the roadmap gate creates a draft in the dev backlog, with HLD as its first work item. The Delivery type, set at the
                gate, decides whether that is an initiative or an epic. Release management, further down, covers the second handoff from dev
                to clients.
              </p>
            </div>
          </div>
          <h2 className="sect">How Delivery type is pre-filled</h2>
          <p className="sect-sub">The Eng lead confirms or overrides it before the idea can pass the roadmap gate.</p>
          <div
            className="card static"
            style={{ "--c": "#F5A524", "--on": "#1B1A47", maxWidth: "560px", animation: "none" } as React.CSSProperties}
          >
            <div className="cb">
              <ol className="steps">
                <li>HB/TF is Task Force: Initiative</li>
                <li>Team field has 2 or more teams: Initiative</li>
                <li>Otherwise: Epic</li>
              </ol>
            </div>
          </div>
          <h2 className="sect">Two paths</h2>
          <p className="sect-sub">Stories and tasks always live in the squad. Content is never copied from the idea, only linked.</p>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))" }}>
            <div className="card static" style={{ "--c": "#12A594", "--i": "0" } as React.CSSProperties}>
              <div className="art">
                <span className="tag">Path A</span>
                <svg viewBox="0 0 160 110" aria-hidden="true">
                  <rect className="a float" x="58" y="12" width="44" height="28" rx="8" />
                  <rect className="d" x="16" y="68" width="40" height="28" rx="8" />
                  <rect className="a" x="104" y="68" width="40" height="28" rx="8" />
                  <path className="sd" d="M80 40v14M80 54H36v14M80 54h64" />
                  <path className="sd" d="M80 54h44v14" />
                </svg>
              </div>
              <div className="cb">
                <h3>Initiative</h3>
                <div className="chain" style={{ "--c": "#12A594" } as React.CSSProperties}>
                  <span className="c" style={{ "--c": "#8E4EC6" } as React.CSSProperties}>
                    Idea
                  </span>
                  <span className="a">to</span>
                  <span className="c">Initiative</span>
                  <span className="a">to</span>
                  <span className="c">Epics</span>
                  <span className="a">to</span>
                  <span className="c">Stories</span>
                </div>
                <ul className="pts">
                  <li>For multi-team work and all task forces</li>
                  <li>Automation creates it, links it to the idea, copies Product, Owner and OKR</li>
                  <li>One epic per squad slice, created by each Eng lead at dev planning</li>
                  <li>Initiative is the delivery container and outcome owner</li>
                </ul>
              </div>
            </div>
            <div className="card static" style={{ "--c": "#3E63DD", "--i": "1" } as React.CSSProperties}>
              <div className="art">
                <span className="tag">Path B</span>
                <svg viewBox="0 0 160 110" aria-hidden="true">
                  <rect className="bb" x="30" y="22" width="100" height="70" rx="12" />
                  <rect className="a float" x="40" y="14" width="80" height="48" rx="10" />
                  <path className="sw" d="M62 38l11 11 24-24" />
                  <rect className="d" x="48" y="72" width="64" height="8" rx="4" />
                </svg>
              </div>
              <div className="cb">
                <h3>Epic</h3>
                <div className="chain" style={{ "--c": "#3E63DD" } as React.CSSProperties}>
                  <span className="c" style={{ "--c": "#8E4EC6" } as React.CSSProperties}>
                    Idea
                  </span>
                  <span className="a">to</span>
                  <span className="c">Epic</span>
                  <span className="a">to</span>
                  <span className="c">Stories</span>
                </div>
                <ul className="pts">
                  <li>For single-team, single-epic work</li>
                  <li>Automation creates it in the squad board, from the Team field, linked to the idea</li>
                  <li>No initiative layer</li>
                  <li>If scope grows, switch Delivery type to Initiative. Automation creates it and re-parents the epic</li>
                </ul>
              </div>
            </div>
            <div className="card static" style={{ "--c": "#E93D82", "--i": "2" } as React.CSSProperties}>
              <div className="art">
                <span className="tag">Task forces</span>
                <svg viewBox="0 0 160 110" aria-hidden="true">
                  <circle className="bb" cx="80" cy="55" r="44" />
                  <circle className="a" cx="80" cy="55" r="30" />
                  <circle className="w" cx="80" cy="55" r="18" />
                  <circle className="d float" cx="80" cy="55" r="8" />
                </svg>
              </div>
              <div className="cb">
                <h3>Task forces</h3>
                <ul className="pts">
                  <li>A new task force is automatically an Initiative, with Delivery type locked</li>
                  <li>Created directly on the dev board with the TF lead as owner, one goal and a sunset date</li>
                  <li>Automation creates a linked idea stub in PRODUCT, so the roadmap stays complete</li>
                </ul>
              </div>
            </div>
          </div>
          <h2 className="sect">Status flows back up</h2>
          <p className="sect-sub">
            For initiatives, status rolls up from the child epics first, then to the idea. Rollout is tracked in REL.
          </p>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Dev board event</th>
                  <th>Idea status becomes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Gate passed, draft initiative or epic created</td>
                  <td>HLD in progress</td>
                </tr>
                <tr>
                  <td>First epic moves to In Progress</td>
                  <td>In Development</td>
                </tr>
                <tr>
                  <td>Epic reaches Rollout</td>
                  <td>Gradual Rollout</td>
                </tr>
                <tr>
                  <td>Go-live gate passed, all epics Done or Closed</td>
                  <td>Done (Live)</td>
                </tr>
                <tr>
                  <td>Epic Blocked</td>
                  <td>Blocked</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h2 className="sect">Release management</h2>
          <p className="sect-sub">
            Proposed. The second handoff, from dev to clients, so releases are repeatable and safe. It builds on the Release phase in the
            Overview.
          </p>
          <div className="groups">
            <Groups items={[RELEASE]} />
          </div>
        </section>
        <section id="view-rules" role="tabpanel" aria-labelledby="tab-rules" hidden={tab !== "rules"}>
          <div className="intro">
            <div>
              <h1>Rules for exceptions</h1>
              <p>
                What happens to urgent work, to features after go-live, and when plans change. Capacity numbers and timings are proposed
                starting points to calibrate.
              </p>
            </div>
            <div className="stats">
              <div className="stat">
                <b>3</b>rules
              </div>
            </div>
          </div>
          <div className="groups">
            <Groups items={RULES} />
          </div>
        </section>
        <section id="view-ref" role="tabpanel" aria-labelledby="tab-ref" hidden={tab !== "ref"}>
          <div className="intro">
            <div>
              <h1>Reference</h1>
              <p>Required fields, ownership, automations and what is still open.</p>
            </div>
          </div>
          <h2 className="sect">Every step at a glance</h2>
          <p className="sect-sub">
            One row per status, gate and workstream, built from the same data as the Overview panels. Handy to scan or paste elsewhere.
          </p>
          <div className="tbl-wrap">
            <table style={{ minWidth: "940px" }}>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Owner</th>
                  <th>Exit criteria</th>
                  <th>Required fields</th>
                  <th>Automation</th>
                </tr>
              </thead>
              <tbody>
                {ORDER.map((id) => {
                  const it = ITEMS[id];
                  return (
                    <tr key={id}>
                      <td>
                        <b>{it.title}</b>
                        <br />
                        <span className="mut">{it.tag}</span>
                      </td>
                      <td>{it.owner}</td>
                      <td>
                        <Cell items={it.exit} />
                      </td>
                      <td>
                        <Cell items={it.fields} />
                      </td>
                      <td>
                        <Cell items={it.auto} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <h2 className="sect">Required fields, stage by stage</h2>
          <p className="sect-sub">
            Today all five are required at creation, so submitters guess. Proposal: enforce fields as the idea matures, using Jira
            transition validators.
          </p>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>To reach</th>
                  <th>Required</th>
                  <th>Why then</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>New Idea</td>
                  <td>Brief, Pains, Persona, Solution, Open Questions; Product; Team</td>
                  <td>The submitter knows these</td>
                </tr>
                <tr>
                  <td>Exploration</td>
                  <td>{'HB/TF; Navina OKR, or "No OKR - exempt" with a one-line reason'}</td>
                  <td>The quarterly candidates meeting picks by OKR and mode of work</td>
                </tr>
                <tr>
                  <td>HLD in progress (the gate)</td>
                  <td>
                    Planned Quarter; Delivery type; Eng lead; rough T-shirt size; PRD basics (problem, persona, success metric, draft MVP
                    scope)
                  </td>
                  <td>Dev design effort starts only on ideas with a roadmap slot</td>
                </tr>
                <tr>
                  <td>Ready for Dev</td>
                  <td>Final PRD link; HLD link; refined estimate</td>
                  <td>Build-ready checkpoint</td>
                </tr>
                <tr>
                  <td>In Development</td>
                  <td>Nothing new</td>
                  <td>The timeline was set at the gate</td>
                </tr>
                <tr>
                  <td>Done (Live)</td>
                  <td>Go-live gate checklist complete</td>
                  <td>The feature proved itself in the gradual rollout</td>
                </tr>
                <tr>
                  <td>Express lane</td>
                  <td>Work type; owner; one-line justification; PRODUCT link (auto-created)</td>
                  <td>Skips Exploration, PRD and the roadmap gate</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="sect-sub">
            {
              'Express lane work (bugs, incidents, KTLO, tech debt, client escalations) uses "No OKR - exempt" and skips the roadmap gate. See the Rules tab.'
            }
          </p>
          <h2 className="sect">Who owns what</h2>
          <div className="sq-grid wide page">
            <div className="sq" style={{ "--c": "#8E4EC6" } as React.CSSProperties}>
              <h5>Submitter</h5>
              <p>Writes the brief, fills Product and Team</p>
            </div>
            <div className="sq" style={{ "--c": "#3E63DD" } as React.CSSProperties}>
              <h5>PM</h5>
              <p>Exploration, PRD, OKR and HB/TF tagging. Owns the initiative outcome</p>
            </div>
            <div className="sq" style={{ "--c": "#12A594" } as React.CSSProperties}>
              <h5>Eng lead</h5>
              <p>HLD, estimate, Delivery type. Owns delivery, epics and breakdown</p>
            </div>
            <div className="sq" style={{ "--c": "#F5A524" } as React.CSSProperties}>
              <h5>Product Lead</h5>
              <p>Runs the quarterly candidates meeting, proposes group KRs, ranks the Ready for Dev queue</p>
            </div>
            <div className="sq" style={{ "--c": "#30A46C" } as React.CSSProperties}>
              <h5>Squad</h5>
              <p>Stories and tasks, build and release</p>
            </div>
          </div>
          <h2 className="sect">Automations</h2>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Automation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Idea created</td>
                  <td>Brief template, title dedup check, auto-assign PM by Product</td>
                </tr>
                <tr>
                  <td>NIH request created</td>
                  <td>Create or link an idea</td>
                </tr>
                <tr>
                  <td>Any status transition</td>
                  <td>{"Validator blocks it if the stage's required fields are empty"}</td>
                </tr>
                <tr>
                  <td>Roadmap gate</td>
                  <td>Block HLD in progress if Planned Quarter, Delivery type, Eng lead, rough size or PRD basics are empty</td>
                </tr>
                <tr>
                  <td>Gate passed</td>
                  <td>
                    Create draft initiative or epic in the dev backlog with HLD as its first work item, link it, sync Product, Owner and OKR
                  </td>
                </tr>
                <tr>
                  <td>Idea to Ready for Dev</td>
                  <td>Block if the final PRD, HLD or refined estimate is missing. Flag size changes after HLD for re-confirmation</td>
                </tr>
                <tr>
                  <td>Go-live gate</td>
                  <td>Block Done (Live) until the gate checklist is complete</td>
                </tr>
                <tr>
                  <td>After go-live</td>
                  <td>Create a KPI review reminder for the PM. Improvement ideas keep a link to the original idea</td>
                </tr>
                <tr>
                  <td>Express lane item created</td>
                  <td>Create a lightweight linked idea in PRODUCT, flag the Work type, count it against the express share</td>
                </tr>
                <tr>
                  <td>Idea moved backward</td>
                  <td>Require a reason, pause the dev draft item, re-confirm the timeline at the next quarterly planning</td>
                </tr>
                <tr>
                  <td>Planned Quarter changed</td>
                  <td>Log the reason and notify the Product Lead in Slack</td>
                </tr>
                <tr>
                  <td>KPI review</td>
                  <td>PM records the KPI outcome (Scale, Iterate, Sunset or Wait) and the learning on the idea</td>
                </tr>
                <tr>
                  <td>Epic reaches Rollout</td>
                  <td>Create a release event in the REL board, linked to the idea and the epic, from the release plan</td>
                </tr>
                <tr>
                  <td>General availability closed</td>
                  <td>Close the release event, move the idea to Done (Live) once the go-live gate is complete</td>
                </tr>
                <tr>
                  <td>Dev status change</td>
                  <td>Roll up to initiative, then to idea status</td>
                </tr>
                <tr>
                  <td>Quarterly</td>
                  <td>Slack digest ahead of both planning meetings, stale-idea flag</td>
                </tr>
                <tr>
                  <td>Quarter start</td>
                  <td>Reminder to load KR options and re-tag open ideas</td>
                </tr>
                <tr>
                  <td>Dev item with no idea link</td>
                  <td>Slack flag, unless exempt</td>
                </tr>
                <tr>
                  <td>New task force initiative</td>
                  <td>Create linked idea stub in PRODUCT</td>
                </tr>
                <tr>
                  <td>Delivery type changed to Initiative</td>
                  <td>Create initiative, re-parent existing epic</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h2 className="sect">Still open</h2>
          <div className="warnbox">
            <h3>Decisions needed</h3>
            <ul>
              <li>HB/TF: confirm it means Home Base vs Task Force</li>
              <li>Express lane: confirm the work types and who approves express work above the capacity cap</li>
              <li>
                Size changes after HLD: confirm the rule that the timeline is re-confirmed at the next quarterly planning, or ad hoc by the
                Product Lead and Eng lead
              </li>
              <li>
                Go-live gate: confirm the proposed checklist (beta feedback, quality sign-off, KPIs instrumented, commercialization and
                handoff ready, rollout plan) and who signs off
              </li>
              <li>KPI review timing after go-live (for example 30 and 90 days) and where results are logged</li>
              <li>Capacity split: confirm the proposed 70 / 20 / 10 start and when it is calibrated</li>
              <li>KPI outcome: confirm the new field (Scale, Iterate, Sunset, Wait) and where results are logged</li>
              <li>Release management: confirm the rollout stages, the release plan template and who owns the go or no-go</li>
              <li>
                Commercialization (PMM): confirm when PMM is looped in (proposed: at the roadmap gate for customer-facing items) and whether
                it needs its own status or just a checklist
              </li>
              <li>
                Between sessions: confirm the proposed rule that the Product Lead and Eng lead can approve a roadmap gate or a pull into
                development mid-quarter, with a reason logged
              </li>
              <li>Company OKRs: confirm leadership owns them, and the timing</li>
              <li>
                Rollout: how groups that work differently today move onto this flow, and who runs the weekly audit of unlinked dev items
              </li>
            </ul>
          </div>
        </section>
      </div>

      <div className={`scrim${open ? " on" : ""}`} onClick={closePanel} />
      <aside className={`panel${open ? " on" : ""}`} role="dialog" aria-modal="true" aria-labelledby="pTitle" aria-hidden={!open}>
        {shown && (
          <div>
            <div className="p-head" style={sty(shown)}>
              <button className="p-close" type="button" aria-label="Close" ref={closeRef} onClick={closePanel}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <span className="p-badge">
                Phase {PHASES.indexOf(shown) + 1} of {PHASES.length}
              </span>
              <h2 id="pTitle">{shown.n}</h2>
              <p className="mission">{shown.mission}</p>
              <div className="art">
                <Svg k={shown.art} />
              </div>
            </div>
          </div>
        )}
        <div className="p-body" ref={bodyRef}>
          {shown?.items.map((id) => (
            <Accordion
              key={id}
              id={id}
              open={openId === id}
              onToggle={() => {
                if (openId === id) setCollapsed({ hash });
                else {
                  setCollapsed(null);
                  setHash(id);
                }
              }}
            />
          ))}
        </div>
        <div className="p-foot">
          {(
            [
              ["Previous", pv, -1],
              ["Next", nx, 1],
            ] as const
          ).map(([label, id, d]) => (
            <button
              key={label}
              type="button"
              className={`nav ${d < 0 ? "prev" : "next"}${id ? "" : " off"}`}
              tabIndex={id ? 0 : -1}
              aria-hidden={!id}
              aria-label={id ? `${label}: ${ITEMS[id].title}` : label}
              onClick={() => id && navigate(d)}
            >
              <small>{label}</small>
              <b>{id ? ITEMS[id].title : ""}</b>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
