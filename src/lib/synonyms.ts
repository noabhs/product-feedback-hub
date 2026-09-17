import { tokenize } from "@/lib/tokenize";

/**
 * Navina's own vocabulary, so a question can name a thing the way people
 * actually name it.
 *
 * "What are the main problems in the DxC engine?" came back "Not found in
 * available sources" and three unrelated accounts. Nothing was broken: the
 * question tokenises to main / problems / dxc / engine, the string "dxc"
 * appears nowhere in the data, so retrieval fell back to "main" and "problems".
 * Meanwhile the feedback it wanted was sitting there under "risk adjustment",
 * "diagnosis", "HCC" and "suspecting".
 *
 * One product, many names — DxC, Dx, RA, risk adjustment, diagnosis insights —
 * and the hub is written in whichever one the person filing the feedback used.
 * Matching on the literal words the asker happened to pick is the bug.
 *
 * Two things each concept carries, and the second matters more than the first:
 *
 * - `terms`: extra strings to search the prose for. Only distinctive ones. A
 *   two-letter expansion like "ra" would match "operational" and "strategy" and
 *   drown everything.
 * - `areas`: the AREA_LABELS keys this concept means. Retrieval used to read
 *   only oneLiner and content, so an entry tagged RISK_DX whose prose never
 *   spells out "risk adjustment" was invisible to a question about it. Matching
 *   the tag is what makes a question about a product area actually work.
 */

export interface Concept {
  /** Shown to the model when the question is rewritten, e.g. "Risk Adjustment". */
  label: string;
  /**
   * What someone might type. Matched whole-word against the lowercased
   * question, so "dx" does not fire on "dxc" and "ra" does not fire on "raise".
   * Multi-word aliases are matched as phrases.
   */
  aliases: string[];
  /** Extra search strings. Must be distinctive enough not to match everything. */
  terms: string[];
  /** AREA_LABELS keys. Empty where the concept maps to no single area. */
  areas: string[];
}

export const CONCEPTS: Concept[] = [
  {
    label: "Risk Adjustment",
    // The one this file was written for. "dxc" is the product's internal name,
    // and it appears nowhere in any piece of feedback.
    aliases: [
      "dxc", "dx", "dxs", "ra", "risk adjustment", "risk adj", "risk-adjustment",
      "diagnosis insights", "diagnosis insight", "diagnoses insights", "dx insights",
      "risk suspecting", "suspecting engine", "hcc coding", "hcc capture", "raf",
    ],
    terms: [
      "risk adjustment", "risk adj", "diagnos", "hcc", "suspect", "risk suggestion", "raf", "dxc",
    ],
    areas: ["RISK_DX"],
  },
  {
    label: "Quality",
    aliases: [
      "quality", "hedis", "care gaps", "care gap", "gap closure", "star ratings", "stars",
      "quality measures", "quality measure",
    ],
    terms: ["hedis", "care gap", "gap closure", "star rating", "quality measure"],
    areas: ["QUALITY"],
  },
  {
    label: "Ambient",
    aliases: ["ambient", "scribe", "scribes", "ambient listener", "note taker", "dictation"],
    terms: ["ambient", "scribe", "dictation", "transcri"],
    areas: ["AMBIENT"],
  },
  {
    label: "Care Management",
    // No "cm" alias on purpose — two letters, and it collides with units and
    // initials often enough to be worse than nothing.
    aliases: ["care management", "care mgmt", "care coordination", "care coordinator", "care manager"],
    terms: ["care management", "care coordination", "care manager"],
    areas: ["CARE_MANAGEMENT"],
  },
  {
    label: "Point of care",
    aliases: ["point of care", "poc", "pre-visit", "previsit", "in-visit", "at the visit", "encounter"],
    terms: ["point of care", "pre-visit", "previsit", "encounter"],
    areas: ["POINT_OF_CARE"],
  },
  {
    label: "Coders",
    aliases: ["coder", "coders", "coding team", "cdi", "medical coding"],
    terms: ["coder", "cdi"],
    areas: ["CODERS"],
  },
  {
    label: "Data exchange",
    // Maps to no single product area — HIE and ADT cut across several — so this
    // one earns its place on term expansion alone.
    aliases: [
      "hie", "adt", "health information exchange", "admission discharge", "interoperability",
      "admissions", "discharges",
    ],
    terms: ["hie", "adt", "admission", "discharge", "interoperab"],
    areas: [],
  },
];

export interface Expansion {
  /** Everything to search the prose for: the question's own words plus concept terms. */
  terms: string[];
  /** Product areas to match on, from the concepts recognised. */
  areas: string[];
  /** Concepts recognised, for telling the model how the question was read. */
  matched: Concept[];
}

/** Whole-word (or whole-phrase) test, so "dx" does not fire inside "dxc". */
function mentions(question: string, alias: string): boolean {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i").test(question);
}

export function expandQuestion(question: string): Expansion {
  const lower = question.toLowerCase();
  const matched = CONCEPTS.filter((c) => c.aliases.some((a) => mentions(lower, a)));

  const terms = new Set(tokenize(question));
  const areas = new Set<string>();
  for (const concept of matched) {
    for (const t of concept.terms) terms.add(t);
    for (const a of concept.areas) areas.add(a);
  }

  return { terms: [...terms], areas: [...areas], matched };
}

/**
 * Substitutes Navina's own name into the question, keeping the asker's word
 * alongside it: "problems in the DxC engine" becomes "problems in the Risk
 * Adjustment (DxC) engine".
 *
 * Belt and braces next to readAsNote, and the more reliable of the two. Telling
 * the model that DxC means Risk Adjustment depends on it following an
 * instruction, against a hard rule to refuse anything not in the sources — and
 * on the first attempt it kept refusing. Rewriting the term removes the thing it
 * was refusing over, so compliance stops being a factor.
 *
 * The original question is what gets logged and shown; this is only what the
 * model reads.
 */
export function rewriteQuestion(question: string, matched: Concept[]): string {
  let out = question;
  for (const concept of matched) {
    const lower = out.toLowerCase();
    // Already uses the hub's own word — nothing to clarify.
    if (mentions(lower, concept.label.toLowerCase())) continue;
    // Longest alias first, so "risk adj" can't pre-empt "risk adjustment".
    const alias = [...concept.aliases]
      .sort((a, b) => b.length - a.length)
      .find((a) => mentions(lower, a));
    if (!alias) continue;
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(
      new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i"),
      (m) => `${concept.label} (${m})`,
    );
  }
  return out;
}

/**
 * A one-line note for the prompt when the question used a name the data does
 * not. Without it the model either answers with no idea why unasked-for
 * material arrived, or — as happened with DxC — refuses while the answer sits
 * in front of it under another name.
 *
 * Only returned when an alias genuinely differs from the concept's own label:
 * someone who typed "quality" needs no explanation that it was read as Quality.
 */
export function readAsNote(question: string, matched: Concept[]): string | null {
  const lower = question.toLowerCase();
  const renamed = matched.filter((c) => !mentions(lower, c.label.toLowerCase()));
  if (!renamed.length) return null;
  return renamed.map((c) => c.label).join(", ");
}
