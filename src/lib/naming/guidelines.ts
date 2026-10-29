/**
 * The ticket naming convention. One source for the page that explains it and the
 * prompt that proposes names, so the two cannot drift apart.
 */

export const READER_TEST =
  "Someone outside the team should understand what changes, and for whom, from the title alone. If they would need to open the ticket to find out what the work is, rewrite the title.";

export const WHY_IT_MATTERS =
  "People review, prioritise and release from titles, so a title that needs the ticket open to be understood slows every one of those decisions.";

export const KEY_RULE = "Write Product | Topic - what changes, so the title explains the work without opening the ticket.";

export type Rule = { rule: string; detail: string; example?: { avoid?: string; use: string } };

export const NAMING_RULES: Rule[] = [
  { rule: "Start every title with Product | Topic -", detail: "Product is the ticket's Product field, or its Team if that is empty. Topic is the feature inside it. Never a colon.", example: { use: "Analytics | Patient registry - Add an audit log of enrollment changes" } },
  { rule: "Name the action and the object", detail: "A bare noun like \"Internal users\" does not say what the work is.", example: { avoid: "Internal users", use: "Quality | User management - Admin can invite internal users" } },
  { rule: "Say what, not how", detail: "Reasoning, technology choices and detail go in the description.", example: { avoid: "Reports API - Use REST with URL versioning", use: "Analytics | Reports API - Versioned API so data pipelines don't break" } },
  { rule: "Keep the words that change the scope", detail: "Do not cut a qualifier just to make the title shorter. \"Export reports\" and \"Export reports, including the admin UI\" describe different amounts of work, and the reader should be able to tell which one this is." },
  { rule: "Spell out jargon", detail: "Write patient-based, not PB. Terms the whole company uses stay as they are: HCC, EHR, SFTP, HIE." },
  { rule: "Leave out ticket IDs, names, dates and sprint numbers", detail: "Lists of client names go in the description too." },
  { rule: "Use sentence case", detail: "Product terms keep their capitals: Analytics, QuickSight, Epic." },
  { rule: "Check the level", detail: "An outcome across quarters is an Initiative, a capability is an Epic, a slice of work inside an Epic is a Story or Task." },
];

export const NAMING_LEVELS = [
  { type: "Initiative", format: "Product | Topic - the business outcome, as a noun phrase.", length: "Up to 90 characters", example: "Analytics | Patient registry - One central record of each patient's status and product enrollment" },
  { type: "Epic, or an idea at Epic level", format: "Product | Topic - what changes, in plain words. A verb is fine if it makes the title clearer.", length: "Up to 90 characters", example: "Analytics | Reports API - Versioned API so data pipelines don't break on changes" },
  { type: "Story / Task", format: "Product | Topic - [Persona] can [action], or [Verb] [object] for technical work with no persona.", length: "Up to 80 characters", example: "Quality | Task management - Admin can bulk assign tasks" },
];

export const LINKED_RULES = [
  { name: "An idea and its Epic share one title", body: "The idea on the Product board and the Epic on the Dev board that delivers it carry exactly the same title. If you rename one, rename the other." },
  { name: "Release items follow the Epic", body: "A Release Event linked to an Epic carries the Epic's name. The steps under it keep their suffix: Analytics | Patient registry - Add an audit log - GA Rollout." },
  { name: "Missing context", body: "If the title can't pass the reader test and nobody knows the meaning yet, keep the current title and write NEED TO UPDATE TICKET NAME in capitals at the top of the description. Don't guess." },
];

/** Every rule on the page, in one numbered list: the title rules, then the rules for linked items. */
export const ALL_RULES: Rule[] = [
  ...NAMING_RULES,
  ...LINKED_RULES.map((l) => ({ rule: l.name, detail: l.body })),
];

/** The three rules shown as cards, and the rest shown as a list. */
export const TOP_RULES = ALL_RULES.slice(0, 3);
export const OTHER_RULES = ALL_RULES.slice(3);

/** use === null means the right title can't be written until someone supplies the context. */
export const NAMING_EXAMPLES: { avoid: string; use: string | null; why: string }[] = [
  { avoid: "Quality | Task management | Internal users", use: null, why: "A bare noun that doesn't say what the work is." },
  { avoid: "Delete users", use: "Quality | User management - Admin can delete users", why: "It starts with Product | Topic and names who does what." },
  { avoid: "Analytics: Patient registry audit log", use: "Analytics | Patient registry - Add an audit log of enrollment changes", why: "A pipe and a hyphen, not a colon, and it says what changes." },
  { avoid: "Analytics | Patient Registry - Service & DB", use: "Analytics | Patient registry - Merge patient configurations and cohorts into one service", why: "Says what is built, not the technology." },
  { avoid: "Patients insurance logic change for PB", use: null, why: "It uses undefined jargon and doesn't say what changes." },
  { avoid: "Epic for Q1 Analytics work", use: "Analytics | Reports API - Versioned API so data pipelines don't break on changes", why: "It carries a date and doesn't say what the work is." },
];

/** The rules as plain text for the model that proposes names. */
export function conventionPrompt(): string {
  return [
    "You rename Jira product ideas so a reviewer understands the work from the title alone.",
    "READER TEST: " + READER_TEST,
    "RULES:",
    ...NAMING_RULES.map((r) => `- ${r.rule}. ${r.detail}`),
    "FORMAT: " + NAMING_LEVELS.map((l) => `${l.type}: ${l.format} (${l.length})`).join(" | "),
    "Ideas default to the Epic format. Every title starts with `Product | Topic - `, where Product is the idea's Product field and Topic is the feature or area inside it. The `product` you are given is already the Product field, or the Team name when the Product field is empty, so use it as the first part as it is. Only if it is empty too, infer it from the title and set inferred: true.",
    "NEVER GUESS: if the title, description and linked tickets do not say what the work is, return proposed as an empty string and put the one question that would unblock it in `question`.",
    "Keep names within 90 characters (80 for a Story). If an idea is already compliant, return its current title unchanged.",
  ].join("\n");
}
