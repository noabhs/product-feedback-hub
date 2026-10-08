/**
 * Know Your Domain: shape of the education content.
 *
 * The content lives in code (topics.ts, glossary.ts) rather than the database,
 * so every definition goes through a pull request and shows up in a diff. If
 * editing from the UI becomes a need, these types are the shape to migrate.
 */

export type ResourceKind = "internal" | "external";

export interface Resource {
  title: string;
  url: string;
  kind: ResourceKind;
  /** Who publishes it, e.g. "CMS", "KFF", "Notion". Shown next to the link. */
  source: string;
  /** One line on why it is worth opening. */
  note?: string;
}

export interface Concept {
  title: string;
  /** Two or three plain sentences. */
  body: string;
}

export interface DeepDiveSection {
  heading: string;
  /** Markdown. */
  body: string;
}

export interface Topic {
  slug: string;
  title: string;
  /** One line for the landing card. */
  tagline: string;
  /** The high-level description shown at the top of the topic page. */
  summary: string;
  /** "ready" topics have concepts and a deep dive; "planned" ones show only the summary. */
  status: "ready" | "planned";
  concepts: Concept[];
  deepDive: DeepDiveSection[];
  resources: Resource[];
  /** Slugs of related topics. */
  related: string[];
}

export interface GlossaryTerm {
  term: string;
  /** Spelled-out form for acronyms. */
  expansion?: string;
  /** One line. Shown in the list. */
  short: string;
  /** Plain-language explanation, a short paragraph. Shown when the term is opened. */
  explanation: string;
  /** Topic slugs. The first one is the term's home. */
  topics: string[];
  /** Other glossary terms, by `term`. */
  seeAlso?: string[];
  sources: Resource[];
}
