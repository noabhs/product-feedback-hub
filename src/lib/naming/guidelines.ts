/**
 * The ticket naming convention. One source for the page that explains it and the
 * prompt that proposes names, so the two cannot drift apart.
 */

export const READER_TEST =
  "Someone outside the team should understand what changes, and for whom, from the title alone. If they would need to open the ticket to find out what the work is, rewrite the title.";

export const WHY_IT_MATTERS =
  "People review, prioritise and release from titles, so a title that needs the ticket open to be understood slows every one of those decisions.";

export const KEY_RULE = "Write Area | what changes, so the title explains the work without opening the ticket.";

export const NAMING_RULES: { rule: string; detail: string }[] = [
  { rule: "Separate the Area from the rest with a pipe", detail: "Write File Manager | Upload several files at once, with a space on each side of the pipe. Never a colon." },
  { rule: "Name the action and the object", detail: "A bare noun like \"Internal users\" does not say what the work is." },
  { rule: "Keep the words that change the scope", detail: "Do not cut a qualifier just to make the title shorter. \"Export reports\" and \"Export reports, including the admin UI\" describe different amounts of work, and the reader should be able to tell which one this is." },
  { rule: "Spell out jargon", detail: "Write patient-based, not PB. Terms the whole company uses stay as they are: HCC, EHR, SFTP, HIE." },
  { rule: "Say what, not how", detail: "Reasoning, technology choices and detail go in the description." },
  { rule: "Leave out ticket IDs, names, dates and sprint numbers", detail: "Lists of client names go in the description too." },
  { rule: "Use sentence case", detail: "Product terms keep their capitals: File Manager, QuickSight, Epic." },
  { rule: "Check the level", detail: "An outcome across quarters is an Initiative, a capability is an Epic, a slice of work inside an Epic is a Story or Task." },
];

export const NAMING_LEVELS = [
  { type: "Initiative", format: "A noun phrase that names the business outcome.", length: "Up to 90 characters", example: "Patient registry | One central record of each patient's status and product enrollment" },
  { type: "Epic, or an idea at Epic level", format: "Area | what changes, in plain words. A verb is fine if it makes the title clearer.", length: "Up to 90 characters", example: "File Manager | Upload several files at once" },
  { type: "Story / Task", format: "User-facing: [Persona] can [action]. Technical, with no persona: [Verb] [object].", length: "Up to 80 characters", example: "Admin can bulk upload users" },
];

export const LINKED_RULES = [
  { name: "Same name", body: "An idea and its linked dev Epic carry the same title. When one is renamed, rename the other." },
  { name: "Team at the end", body: "Delivery work split by team gets the team in parentheses at the end: Patient registry | Audit log (Analytics). If the team's work has no component name of its own, use <Area> | <Team> tasks." },
  { name: "Release items follow the Epic", body: "A Release Event linked to an Epic carries the Epic's name. The steps under it keep their suffix: Patient registry | Audit log (Analytics) - GA Rollout." },
  { name: "Missing context", body: "If the title can't pass the reader test and nobody knows the meaning yet, keep the current title and write NEED TO UPDATE TICKET NAME in capitals at the top of the description. Don't guess." },
];

/** Every rule on the page, in one numbered list: the title rules, then the rules for linked items. */
export const ALL_RULES: { rule: string; detail: string }[] = [
  ...NAMING_RULES,
  ...LINKED_RULES.map((l) => ({ rule: l.name, detail: l.body })),
];

/** use === null means the right title can't be written until someone supplies the context. */
export const NAMING_EXAMPLES: { avoid: string; use: string | null; why: string }[] = [
  { avoid: "User management | Internal users", use: null, why: "A bare noun that doesn't say what the work is." },
  { avoid: "Delete users", use: "Admin can delete users", why: "It names who does what." },
  { avoid: "File Manager | Failed file visibility", use: "File Manager | Show every file, including failed ones, with a status and failure reason", why: "The longer title says what changes." },
  { avoid: "Analytics | Patient Registry - Service & DB", use: "Patient registry | Merge patient configurations and cohorts into one service (Analytics)", why: "Area first, then what is built, then the team." },
  { avoid: "Patients insurance logic change for PB", use: null, why: "It uses undefined jargon and doesn't say what changes." },
  { avoid: "Epic for Q1 File Manager work", use: "File Manager | Upload several files at once", why: "It carries a date and doesn't say what the work is." },
];

/** The rules as plain text for the model that proposes names. */
export function conventionPrompt(): string {
  return [
    "You rename Jira product ideas so a reviewer understands the work from the title alone.",
    "READER TEST: " + READER_TEST,
    "RULES:",
    ...NAMING_RULES.map((r) => `- ${r.rule}. ${r.detail}`),
    "FORMAT: " + NAMING_LEVELS.map((l) => `${l.type}: ${l.format} (${l.length})`).join(" | "),
    "Ideas default to the Epic format. Delivery work split by team ends with the team in parentheses.",
    "NEVER GUESS: if the title, description and linked tickets do not say what the work is, return proposed as an empty string and put the one question that would unblock it in `question`.",
    "Keep names within 90 characters (80 for a Story). If an idea is already compliant, return its current title unchanged.",
  ].join("\n");
}
