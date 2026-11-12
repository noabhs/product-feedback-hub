/**
 * The "From goals to impact" content: phases, steps, gates, rhythm and rules.
 * One data set drives the Overview panels and the Reference table, so a change here shows up in both.
 */

export type ArtKey = keyof typeof ART;

/** What every step, gate and workstream shares: shown in its panel row and in the Reference table. */
export type Detail = {
  c: string;
  dark?: boolean;
  owner: string;
  mission: string;
  /** Heading of the list of fields, when it is not "Required fields". */
  flabel?: string;
  exit: string[];
  fields: string[];
  auto: string[];
};
type Stage = Detail & { n: string; g: string; art: ArtKey; exit1: string; next: string };
export type Gate = Detail & { n: string; art: ArtKey; sub: string; side: [string, string][] };
type Extra = Detail & { n: string; art: ArtKey; out: string };

/** A step chip on a phase card: a plain step, a gate, or a workstream that runs alongside. */
export type Chip = [label: string, id: string] | { gate: 1 | 2; id: string } | { t: string; par: true; id: string };
export type Phase = {
  id: string;
  n: string;
  c: string;
  art: ArtKey;
  mission: string;
  chips: Chip[];
  note?: string;
  who: string;
  arr?: boolean;
  items: string[];
};
/** A card with a mission on the left and a grid of detail boxes on the right. */
export type Group = {
  n: string;
  c: string;
  dark?: boolean;
  art: ArtKey;
  when: string;
  mission: string;
  rows: [string, string][];
};
export type Item = Detail & { id: string; tag: string; title: string; sum: string };

export const ART = {
  idea: '<svg viewBox="0 0 160 110" aria-hidden="true"><circle class="bb" cx="80" cy="52" r="42"/><path class="a float" d="M80 16c-17 0-30 13-30 29 0 11 6 18 12 24 3 3 4 6 4 10h28c0-4 1-7 4-10 6-6 12-13 12-24 0-16-13-29-30-29z"/><rect class="d" x="68" y="83" width="24" height="7" rx="3.5"/><rect class="d" x="72" y="93" width="16" height="6" rx="3"/><path class="sw" d="M68 44c2-7 7-10 12-10"/><circle class="a twinkle tb" cx="130" cy="26" r="5"/><circle class="a twinkle tb" cx="30" cy="38" r="4" style="animation-delay:-1s"/></svg>',
  explore:
    '<svg viewBox="0 0 160 110" aria-hidden="true"><circle class="bb" cx="80" cy="55" r="44"/><circle class="a float" cx="72" cy="48" r="25"/><circle class="w" cx="72" cy="48" r="17" opacity=".85"/><path class="sd" style="stroke-width:9" d="M91 67l24 24"/></svg>',
  prd: '<svg viewBox="0 0 160 110" aria-hidden="true"><rect class="bb" x="40" y="18" width="80" height="84" rx="10"/><rect class="a float" x="46" y="10" width="68" height="84" rx="9"/><rect class="w" x="58" y="26" width="44" height="6" rx="3"/><rect class="w" x="58" y="40" width="44" height="6" rx="3" opacity=".8"/><rect class="w" x="58" y="54" width="30" height="6" rx="3" opacity=".8"/><circle class="d" cx="104" cy="78" r="9"/><path class="sw" style="stroke-width:3.5" d="M99 78l4 4 7-8"/></svg>',
  hld: '<svg viewBox="0 0 160 110" aria-hidden="true"><rect class="a float" x="58" y="10" width="44" height="28" rx="8"/><rect class="d" x="14" y="70" width="40" height="28" rx="8"/><rect class="a" x="106" y="70" width="40" height="28" rx="8"/><rect class="bb" x="60" y="70" width="40" height="28" rx="8"/><path class="sd" d="M80 38v14M80 52H34v18M80 52h46v18M80 52v18"/></svg>',
  ready:
    '<svg viewBox="0 0 160 110" aria-hidden="true"><rect class="bb" x="34" y="56" width="92" height="30" rx="9"/><rect class="bb" x="42" y="86" width="76" height="16" rx="8"/><rect class="a float" x="26" y="14" width="108" height="36" rx="10"/><circle class="w" cx="48" cy="32" r="10"/><path class="sd" style="stroke-width:3.5" d="M43 32l4 4 7-8"/><rect class="w" x="68" y="26" width="52" height="6" rx="3"/><rect class="w" x="68" y="37" width="34" height="5" rx="2.5" opacity=".75"/></svg>',
  dev: '<svg viewBox="0 0 160 110" aria-hidden="true"><rect class="a float" x="20" y="14" width="120" height="82" rx="12"/><circle class="w" cx="34" cy="27" r="3"/><circle class="w" cx="45" cy="27" r="3" opacity=".7"/><circle class="w" cx="56" cy="27" r="3" opacity=".5"/><path class="sw" d="M62 52l-14 14 14 14M98 52l14 14-14 14M86 48l-12 36"/></svg>',
  rollout:
    '<svg viewBox="0 0 160 110" aria-hidden="true"><rect class="bb" x="24" y="64" width="22" height="34" rx="5"/><rect class="bb" x="54" y="50" width="22" height="48" rx="5"/><rect class="a" x="84" y="34" width="22" height="64" rx="5"/><rect class="d float" x="114" y="14" width="22" height="84" rx="5"/></svg>',
  done: '<svg viewBox="0 0 160 110" aria-hidden="true"><circle class="bb" cx="80" cy="55" r="46"/><circle class="a float" cx="80" cy="55" r="33"/><path class="sw" d="M63 56l12 12 23-25"/><circle class="a twinkle tb" cx="132" cy="22" r="4"/><circle class="a twinkle tb" cx="28" cy="26" r="5" style="animation-delay:-1.4s"/></svg>',
  cal: '<svg viewBox="0 0 160 110" aria-hidden="true"><rect class="a float" x="28" y="16" width="104" height="80" rx="12"/><rect class="d" x="28" y="16" width="104" height="22" rx="11"/><rect class="d" x="28" y="26" width="104" height="12"/><g class="w"><rect x="42" y="50" width="16" height="12" rx="3"/><rect x="66" y="50" width="16" height="12" rx="3" opacity=".7"/><rect x="90" y="50" width="16" height="12" rx="3" opacity=".7"/><rect x="42" y="70" width="16" height="12" rx="3" opacity=".7"/><rect x="66" y="70" width="16" height="12" rx="3"/><rect x="90" y="70" width="16" height="12" rx="3" opacity=".7"/></g></svg>',
  board:
    '<svg viewBox="0 0 160 110" aria-hidden="true"><rect class="bb" x="18" y="14" width="38" height="82" rx="9"/><rect class="bb" x="62" y="14" width="38" height="82" rx="9"/><rect class="bb" x="106" y="14" width="38" height="82" rx="9"/><rect class="a" x="23" y="22" width="28" height="18" rx="5"/><rect class="a" x="23" y="46" width="28" height="18" rx="5"/><rect class="d float" x="67" y="22" width="28" height="18" rx="5"/><rect class="a" x="111" y="22" width="28" height="18" rx="5"/></svg>',
  timeline:
    '<svg viewBox="0 0 160 110" aria-hidden="true"><rect class="bb" x="14" y="62" width="132" height="10" rx="5"/><rect class="a" x="14" y="62" width="86" height="10" rx="5"/><circle class="d" cx="28" cy="67" r="9"/><circle class="a" cx="64" cy="67" r="9"/><circle class="w" cx="64" cy="67" r="4"/><path class="sd" d="M104 67V22"/><path class="a float" d="M104 22h30l-8 12 8 12h-30z"/><circle class="bb" cx="136" cy="67" r="9"/></svg>',
  bolt: '<svg viewBox="0 0 160 110" aria-hidden="true"><circle class="bb" cx="80" cy="55" r="46"/><path class="a float" d="M94 10L54 62h24l-10 38 40-54H84z"/></svg>',
  kpi: '<svg viewBox="0 0 160 110" aria-hidden="true"><rect class="bb" x="18" y="14" width="124" height="82" rx="12"/><path class="sd" d="M38 55h30M68 55l22-22M68 55h22M68 55l22 22"/><circle class="a float" cx="102" cy="33" r="9"/><circle class="d" cx="102" cy="55" r="9"/><circle class="a" cx="102" cy="77" r="9" opacity=".6"/><circle class="a" cx="34" cy="55" r="7"/></svg>',
  swap: '<svg viewBox="0 0 160 110" aria-hidden="true"><circle class="bb" cx="80" cy="55" r="46"/><path class="s float" style="stroke-width:5" d="M46 42h62M96 30l12 12-12 12"/><path class="s" style="stroke-width:5" d="M114 70H52M64 58L52 70l12 12"/></svg>',
  megaphone:
    '<svg viewBox="0 0 160 110" aria-hidden="true"><circle class="bb" cx="80" cy="55" r="46"/><rect class="d" x="34" y="42" width="16" height="26" rx="6"/><path class="a float" d="M50 42l52-24v74L50 68z"/><path class="s" d="M114 40c9 7 9 23 0 30"/><path class="s" d="M62 74l6 22h14l-6-18" style="stroke-width:5"/></svg>',
  shield:
    '<svg viewBox="0 0 160 110" aria-hidden="true"><circle class="bb" cx="80" cy="55" r="46"/><path class="a float" d="M80 12l36 13v25c0 23-15 38-36 46-21-8-36-23-36-46V25z"/><path class="sw" d="M62 54l13 13 25-27"/></svg>',
  monitor:
    '<svg viewBox="0 0 160 110" aria-hidden="true"><rect class="bb" x="18" y="14" width="124" height="82" rx="12"/><path class="s float" style="stroke-width:5" d="M34 72l26-22 22 12 30-34"/><circle class="d" cx="112" cy="28" r="7"/><rect class="a" x="34" y="84" width="92" height="5" rx="2.5" opacity=".5"/></svg>',
  target:
    '<svg viewBox="0 0 160 110" aria-hidden="true"><circle class="bb" cx="80" cy="55" r="46"/><circle class="a" cx="80" cy="55" r="33"/><circle class="w" cx="80" cy="55" r="21"/><circle class="d float" cx="80" cy="55" r="9"/><path class="sd" d="M80 55l34-34"/></svg>',
};

const STAGES: Stage[] = [
  {
    n: "New Idea",
    g: "disc",
    c: "#8E4EC6",
    art: "idea",
    owner: "Submitter",
    mission: "The backlog of problems worth solving. The brief is written, nothing is validated yet.",
    exit1: "Picked at the quarterly meeting",
    next: "Exploration",
    exit: ["Picked at the quarterly product candidates meeting"],
    fields: ["Brief, Pains, Persona, Solution, Open Questions", "Product", "Team"],
    auto: [
      "Brief template",
      "Title dedup check",
      "Auto-assign PM by Product",
      "NIH request creates or links an idea",
      "Stale flag for the quarterly meeting",
    ],
  },
  {
    n: "Exploration",
    g: "disc",
    c: "#3E63DD",
    art: "explore",
    owner: "PM",
    mission: "Validate the pain, size the impact, check OKR fit.",
    exit1: "Go decision logged",
    next: "PRD in progress",
    exit: ["Go (to PRD) or Cancel", "Decision logged as a comment"],
    fields: ["To enter: HB/TF", 'To enter: Navina OKR, or "No OKR - exempt" with a one-line reason'],
    auto: ["Validator blocks entry if fields are empty"],
  },
  {
    n: "PRD in progress",
    g: "disc",
    c: "#0BB5D6",
    art: "prd",
    owner: "PM with Design",
    dark: true,
    mission: "Define what to build and for whom, enough to earn a roadmap slot.",
    exit1: "Draft PRD ready for the gate",
    next: "Roadmap gate",
    exit: [
      "PRD linked",
      "Problem, persona, success metric and draft MVP scope set",
      "Proposed for the next roadmap and dev planning meeting",
    ],
    fields: ["PRD link", "Problem, persona, success metric, draft MVP scope"],
    auto: ["None beyond the validators"],
  },
  {
    n: "HLD in progress",
    g: "prep",
    c: "#12A594",
    art: "hld",
    owner: "Eng lead",
    mission: "Dev designs how it could be built. Starts only after the roadmap gate.",
    exit1: "HLD, final PRD, refined estimate",
    next: "Ready for Dev",
    exit: ["HLD linked", "Estimate refined, dependencies identified", "PRD finalized with agreed MVP scope"],
    fields: ["To enter: Planned Quarter, Delivery type, Eng lead, rough size (all set at the gate)", "HLD link"],
    auto: [
      "Gate validator blocks entry if any gate field is empty",
      "Draft initiative or epic created in the dev backlog, with HLD as its first work item",
      "Delivery type pre-fill: Task Force or 2+ teams is Initiative, otherwise Epic",
    ],
  },
  {
    n: "Ready for Dev",
    g: "prep",
    c: "#F5A524",
    art: "ready",
    owner: "PM and Eng lead",
    dark: true,
    mission: "Build-ready checkpoint: PRD final and HLD done. Waits for dev planning to be pulled in.",
    exit1: "Pulled at dev planning",
    next: "In Development",
    exit: ["Pulled into In Development at dev planning"],
    fields: ["Final PRD link", "HLD link", "Refined estimate"],
    auto: [
      "Blocks entry if the final PRD, HLD or refined estimate is missing",
      "Flags items where HLD changed the size, so the timeline is re-confirmed at the next quarterly planning",
    ],
  },
  {
    n: "In Development",
    g: "dev",
    c: "#30A46C",
    art: "dev",
    owner: "Eng lead and squad",
    mission: "Delivery is under way on the dev board.",
    exit1: "Epic reaches Rollout",
    next: "Gradual Rollout",
    exit: ["First epic moves to In Progress (entry)", "Epic reaches Rollout (exit)"],
    fields: ["None new, Planned Quarter was set at the gate"],
    auto: ["Idea status follows dev status, no manual edits"],
  },
  {
    n: "Gradual Rollout",
    g: "del",
    c: "#E5702A",
    art: "rollout",
    owner: "Eng lead and squad",
    mission: "The feature is released in stages (beta) and proves itself before going live.",
    exit1: "Go-live gate passed",
    next: "Go-live gate",
    exit: ["Epic reaches Rollout", "Release tracked in REL", "Beta feedback reviewed", "Commercialization ready (PMM)"],
    fields: ["None"],
    auto: ["Idea status follows epic status"],
  },
  {
    n: "Done (Live)",
    g: "live",
    c: "#5B6B8C",
    art: "done",
    owner: "Eng lead and PM",
    mission: "Everything is delivered and live for all clients.",
    exit1: "Monitoring continues",
    next: "Monitor and improve",
    exit: ["Go-live gate passed", "All epics Done or Closed"],
    fields: ["Go-live gate checklist complete"],
    auto: [
      "Blocked until the go-live gate checklist is complete",
      "Initiative closes when all child epics are done",
      "Starts the monitoring loop: KPI review reminder to the PM",
    ],
  },
];
export const GATE: Gate = {
  n: "Roadmap timeline",
  c: "#F5A524",
  dark: true,
  art: "timeline",
  sub: "No timeline, no HLD",
  owner: "Product Lead approves, PM and Eng lead propose",
  mission: "The gate before HLD. Dev starts design work only on ideas that have a slot on the roadmap.",
  flabel: "Required to pass",
  exit: [
    "Idea moves to HLD in progress",
    "Draft initiative or epic created in the dev backlog",
    "Decided at the quarterly roadmap and dev planning meeting (last 2 weeks of the quarter)",
  ],
  fields: [
    "Planned Quarter",
    "Delivery type, pre-filled by rule",
    "Eng lead named",
    "Rough T-shirt size from the Eng lead, without a full HLD",
    "PRD basics: problem, persona, success metric, draft MVP scope",
  ],
  auto: [
    "Blocks entry to HLD if any gate field is empty",
    "Creates the draft initiative or epic, linked to the idea, copying Product, Owner and OKR",
    "Flags a size change after HLD, so the timeline is re-confirmed",
  ],
  side: [
    ["Decided at", "Roadmap and dev planning, last 2 weeks of the quarter"],
    ["Requires", "Planned Quarter, Delivery type, Eng lead, rough size and PRD basics"],
    ["Creates", "A draft initiative or epic in the dev backlog, with HLD as its first work item"],
    ["Blocks", "HLD from starting if any gate field is empty"],
  ],
};
export const GOLIVE: Gate = {
  n: "Go-live gate",
  c: "#F5A524",
  dark: true,
  art: "shield",
  sub: "Beta to live",
  owner: "PM and Eng lead, with Quality sign-off and PMM (proposed)",
  mission:
    "The gate between beta and live. A feature goes live for everyone only after it has proven itself in the gradual rollout.",
  flabel: "Required to pass (proposed)",
  exit: ["Idea moves to Done (Live)", "Remaining clients are rolled out"],
  fields: [
    "Beta feedback reviewed and blockers closed",
    "Quality and safety sign-off",
    "KPIs instrumented, with a baseline for the PRD success metric",
    "Commercialization ready (PMM): positioning, enablement and customer communication",
    "Support and delivery handoff done: handoff doc, docs and training",
    "Rollout plan agreed for the remaining clients",
  ],
  auto: [
    "Blocks Done (Live) until the gate checklist is complete",
    "Starts the monitoring loop: a KPI review reminder is created for the PM",
  ],
  side: [
    ["Decided by", "PM and Eng lead, with Quality sign-off"],
    ["Requires", "Beta feedback reviewed, quality sign-off, KPIs instrumented, commercialization and handoff ready"],
    ["Blocks", "Done (Live) until the checklist is complete"],
    ["Starts", "The monitoring loop after go-live"],
  ],
};
const MON: Extra = {
  n: "Monitor and improve",
  c: "#3E63DD",
  art: "monitor",
  out: "Improvement ideas logged",
  owner: "PM, reviewed at the quarterly candidates meeting",
  mission: "Live is not the end. We check KPIs, collect feedback and feed improvements back into the flow.",
  flabel: "What we check",
  exit: [
    "KPI decision recorded: Scale, Iterate, Sunset or Wait",
    "Findings logged on the idea",
    "Improvement ideas created as new ideas, linked to the original",
    "KPI results shared before the next OKR cycle",
  ],
  fields: [
    "KPIs against the success metric defined in the PRD",
    "Client and user feedback (NIH requests, support, CS)",
    "Adoption and quality signals",
    "KPI outcome field, filled at the review",
  ],
  auto: [
    "KPI review reminder to the PM after go-live (timing to confirm)",
    "Improvement ideas keep a link to the original idea",
    "Quarterly digest includes recent KPI results",
  ],
};
const COMM: Extra = {
  n: "Commercialization",
  c: "#D946EF",
  art: "megaphone",
  out: "Ready before go-live",
  owner: "PMM, with the PM",
  mission: "Product marketing prepares the launch: positioning, enablement and customer communication. Runs alongside rollout.",
  flabel: "What PMM prepares",
  exit: ["Commercialization ready before the go-live gate", "Beta clients informed"],
  fields: [
    "Positioning and messaging",
    "Pricing and packaging, if changed",
    "Sales and CS enablement",
    "Customer communication and release notes",
    "Launch plan and timing",
  ],
  auto: [
    "The go-live gate checklist includes commercialization readiness",
    "PMM is looped in at the roadmap gate for customer-facing items (proposed)",
  ],
};
export const PHASES: Phase[] = [
  {
    id: "goals",
    n: "Goals",
    c: "#E93D82",
    art: "target",
    mission: "Business goals turned into product OKRs.",
    chips: [
      ["Business goals", "business-goals"],
      ["Product OKRs", "product-okrs"],
    ],
    who: "Leadership and Product Leads",
    arr: true,
    items: ["business-goals", "product-okrs"],
  },
  {
    id: "discover",
    n: "Discover and plan",
    c: "#8E4EC6",
    art: "idea",
    mission: "Ideas are validated, defined and given a roadmap slot.",
    chips: [
      ["New Idea", "new-idea"],
      ["Exploration", "exploration"],
      ["PRD in progress", "prd"],
      { gate: 1, id: "roadmap-gate" },
    ],
    note: "Every idea links to a goal through the Navina OKR field.",
    who: "Product department",
    arr: true,
    items: ["new-idea", "exploration", "prd", "roadmap-gate"],
  },
  {
    id: "prepare",
    n: "Prepare",
    c: "#12A594",
    art: "hld",
    mission: "Dev designs the solution.",
    chips: [
      ["HLD in progress", "hld"],
      ["Ready for Dev", "ready-for-dev"],
    ],
    who: "Eng lead and PM",
    arr: true,
    items: ["hld", "ready-for-dev"],
  },
  {
    id: "develop",
    n: "Develop",
    c: "#30A46C",
    art: "dev",
    mission: "The squad builds the feature.",
    chips: [["In Development", "in-development"]],
    who: "Eng lead and squad",
    arr: true,
    items: ["in-development"],
  },
  {
    id: "release",
    n: "Release",
    c: "#E5702A",
    art: "rollout",
    mission: "Launched in stages, then live for everyone.",
    chips: [
      { t: "Commercialization (PMM)", par: true, id: "commercialization" },
      ["Gradual Rollout (beta)", "gradual-rollout"],
      { gate: 2, id: "go-live-gate" },
      ["Done (Live)", "done-live"],
    ],
    note: "Commercialization runs alongside rollout and must be ready before go-live.",
    who: "Eng lead, PM and PMM",
    arr: true,
    items: ["commercialization", "gradual-rollout", "go-live-gate", "done-live"],
  },
  {
    id: "learn",
    n: "Learn",
    c: "#3E63DD",
    art: "monitor",
    mission: "Check what happened, then improve.",
    chips: [
      ["Check KPIs", "monitor"],
      ["Collect feedback", "monitor"],
      ["Improvement ideas", "monitor"],
    ],
    note: "Loops back to goals and new ideas.",
    who: "PM",
    items: ["monitor"],
  },
];

const SID: Record<string, string> = {
  "New Idea": "new-idea",
  Exploration: "exploration",
  "PRD in progress": "prd",
  "HLD in progress": "hld",
  "Ready for Dev": "ready-for-dev",
  "In Development": "in-development",
  "Gradual Rollout": "gradual-rollout",
  "Done (Live)": "done-live",
};

export const ITEMS: Record<string, Item> = {};
export const ORDER: string[] = [];
/** Which phase each item belongs to. */
export const OF: Record<string, string> = {};

function mk(id: string, o: Detail, tag: string, title: string, sum: string) {
  ITEMS[id] = { ...o, id, tag, title, sum };
}
mk(
  "business-goals",
  {
    c: "#E93D82",
    owner: "Leadership",
    mission: "Where the business wants to go. The starting point of the cycle.",
    flabel: "Inputs",
    exit: ["Set in the last month of the previous quarter", "Shared with the Product Leads"],
    fields: ["Business goals", "KPI results and learnings from live work"],
    auto: ["None"],
  },
  "Input",
  "Business goals",
  "Owner: Leadership",
);
mk(
  "product-okrs",
  {
    c: "#E93D82",
    owner: "Product Leads, with their PMs",
    mission: "Business goals turned into product OKRs. Every idea links to one.",
    flabel: "What it takes",
    exit: [
      "Proposed 2 weeks before the quarter starts",
      "Reviewed with leadership for alignment and sign-off (proposed)",
      "Loaded into the OKR field before the first candidates meeting",
      "Each OKR has a named owner",
    ],
    fields: [
      "Navina OKR field options updated each quarter, with a quarter prefix",
      '"No OKR - exempt" option for express lane work',
    ],
    auto: ["Quarter-start reminder to load the OKR options and re-tag open ideas"],
  },
  "Input",
  "Product OKRs",
  "Owner: Product Leads",
);
STAGES.forEach((s, i) => mk(SID[s.n], s, "Step " + (i + 1), s.n, "Owner: " + s.owner + " - To exit: " + s.exit1));
mk("roadmap-gate", GATE, "Gate", "Roadmap gate", "Owner: " + GATE.owner);
mk("go-live-gate", GOLIVE, "Gate", "Go-live gate", "Owner: " + GOLIVE.owner);
mk("commercialization", COMM, "Workstream", "Commercialization (PMM)", "Owner: " + COMM.owner);
mk("monitor", MON, "After live", "Monitor and improve", "Owner: PM - Output: " + MON.out);
PHASES.forEach((p) =>
  p.items.forEach((id) => {
    ORDER.push(id);
    OF[id] = p.id;
  }),
);

export const RHYTHM: Group[] = [
  {
    n: "Goals and OKR setup",
    c: "#F5A524",
    dark: true,
    art: "target",
    when: "Before the quarter",
    mission: "Leadership sets top-down goals. Management turns them into product OKRs, aligned with leadership.",
    rows: [
      ["Input", "Business goals, plus KPI results and learnings from live work"],
      ["Top-down goals", "Leadership sets the business goals in the last month of the previous quarter"],
      ["Product OKRs", "Product Leads, with their PMs, draft the product OKRs from those goals, 2 weeks before the quarter"],
      [
        "Management to leadership",
        "Product Leads review the draft product OKRs with leadership for alignment and sign-off before the quarter starts (proposed)",
      ],
      ["Loading", "Product OKRs loaded into the OKR field before the first candidates meeting, each with a named owner"],
      ["Rollover", "Open ideas are re-tagged at the first candidates meeting"],
    ],
  },
  {
    n: "Quarterly product candidates",
    c: "#8E4EC6",
    art: "cal",
    when: "Weeks 1-2 of the quarter",
    mission: "Pick which ideas get discovery capacity this quarter.",
    rows: [
      ["Who", "Product Leads, PMs, Design"],
      ["Input", "New Idea backlog and Exploration, viewed by OKR"],
      ["Decides", "Which ideas enter Exploration or PRD, capped by PM and design capacity"],
      [
        "Also",
        "Stale ideas are re-confirmed or Cancelled. KPI results of recently live work are reviewed and a decision is confirmed",
      ],
    ],
  },
  {
    n: "Roadmap and dev planning",
    c: "#30A46C",
    art: "board",
    when: "Last 2 weeks of the quarter",
    mission: "Give ready ideas a timeline for the next quarter, then pull build-ready work into it.",
    rows: [
      ["Who", "Product Leads, PMs, Eng leads, Design"],
      ["Input", "PRD-complete ideas and the Ready for Dev queue, viewed by OKR"],
      [
        "Decides",
        "Which ideas get a roadmap timeline and start HLD, and which Ready for Dev items dev pulls into In Development",
      ],
      ["Capacity", "Split between roadmap work and the express lane, set per quarter (proposed start: 70 / 20 / 10 buffer)"],
      ["Output", "Planned Quarter set, draft dev item created"],
      [
        "Between sessions (proposed)",
        "Product Lead and Eng lead can approve a gate or pull a Ready for Dev item mid-quarter when capacity allows, with a reason logged",
      ],
    ],
  },
];

export const RULES: Group[] = [
  {
    n: "Express lane and capacity",
    c: "#E5702A",
    art: "bolt",
    when: "Express lane",
    mission: "Urgent and maintenance work skips the roadmap gate, with limits so it cannot swallow the roadmap.",
    rows: [
      ["Work types", "Bug or incident, KTLO, tech debt, client escalation (set in the Work type field)"],
      [
        "Path",
        "Created on the dev board, with an auto-created lightweight idea in PRODUCT. Skips Exploration, PRD and the roadmap gate",
      ],
      [
        "Still required",
        "Owner, Work type, one-line justification and a PRODUCT link. Quality sign-off still applies before go-live",
      ],
      ["Capacity", "Proposed split per quarter: 70% roadmap, 20% express lane, 10% buffer. Calibrate after two quarters"],
      [
        "Over the cap",
        "Product Lead and Eng lead decide what gives. A P1 incident starts immediately and is reviewed afterwards",
      ],
      [
        "Visibility",
        "Express volume per group is reported at each quarterly planning. Above the cap two quarters in a row triggers a root-cause review",
      ],
    ],
  },
  {
    n: "KPI decision rule",
    c: "#3E63DD",
    art: "kpi",
    when: "After go-live",
    mission: "Every live feature ends the review with a decision, not just a number.",
    rows: [
      ["When", "First review about 30 days after Done (Live), second about 90 days (proposed)"],
      ["Scale", "KPI met: expand the rollout and close the idea"],
      ["Iterate", "Partly met: create an improvement idea linked to the original and send it through the flow"],
      ["Sunset", "Missed or unused: create a retirement task and log the learning"],
      ["Wait", "Not enough data: extend one review, once"],
      [
        "Who and where",
        "PM proposes and Product Lead confirms when the review happens. Improvement ideas enter New Idea and are picked at the next quarterly candidates meeting. Result and learning are logged on the idea, in a new KPI outcome field",
      ],
    ],
  },
  {
    n: "Change control",
    c: "#12A594",
    art: "swap",
    when: "Any time",
    mission: "Plans change. Changes are made visibly, with a reason, and re-confirmed at the next quarterly planning.",
    rows: [
      [
        "Quarter slips",
        "Eng lead flags it as soon as known. PM updates Planned Quarter with a reason. Re-confirmed at the next quarterly planning",
      ],
      [
        "Urgent item bumps a planned one",
        "Product Lead decides with the Eng lead. The bumped item gets a new quarter in the same decision. Never silent",
      ],
      [
        "Idea moves backward",
        "Allowed (for example HLD back to PRD) with a reason. The dev draft is paused and the timeline is re-confirmed",
      ],
      [
        "Cancel after dev started",
        "Epics closed as Will not do, completed work and learnings recorded on the idea, capacity released at the next dev planning",
      ],
      ["Size change after HLD", "Flagged automatically and the timeline is re-confirmed"],
    ],
  },
];
export const RELEASE: Group = {
  n: "Release management",
  c: "#E5702A",
  art: "rollout",
  when: "Release board (REL)",
  mission: "How a built feature reaches clients safely, from first beta to general availability.",
  rows: [
    [
      "Release plan",
      "Drafted by the PM with the Eng lead and PMM when dev pulls the item in: target clients, rollout stages, rollback plan, communication and support needs",
    ],
    [
      "Release board",
      "Rollout is tracked as release events in the REL board, linked to the idea and the epic. The idea status follows",
    ],
    [
      "Rollout stages",
      "Beta with selected clients, gradual expansion, then general availability. Each stage has entry criteria and a go or no-go decision",
    ],
    [
      "Go-live gate",
      "Sits between beta and general availability. PM and Eng lead decide, with Quality sign-off and PMM readiness",
    ],
    ["Rollback", "Every release plan names how to roll back or switch the feature off, and who decides"],
    [
      "Support handoff",
      "Handoff doc, docs and training are ready before general availability. Delivery and Support own the feature from go-live",
    ],
    ["Communication", "PMM owns customer messaging and release notes. Beta clients are informed at each stage"],
    [
      "Closing",
      "General availability closes the release event, the idea moves to Done (Live) and the KPI review reminder starts",
    ],
  ],
};
