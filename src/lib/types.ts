/**
 * Shared shapes for discovery records. These were previously duplicated in the
 * discovery page and each Add modal, which meant adding a field to one left the
 * others structurally incompatible.
 */

export interface InsightItem {
  id: string;
  /** One entry can touch several areas. Empty when none were picked. */
  productAreas: string[];
  theme: string;
  persona?: string | null;
  oneLiner: string;
  content?: string | null;
  client?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceType?: string | null;
  date?: string | null;
  wtp?: string | null;
  /** The free-text client this arrived with, when a remap replaced it. */
  clientRaw?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  commentCount?: number;
}

export interface Question {
  id: string;
  productArea: string;
  theme: string;
  persona: string | null;
  question: string;
  notesIntent: string | null;
  source: string | null;
  createdBy: string | null;
}

export interface Source {
  id: string;
  name: string;
  productArea: string;
  format: string | null;
  date: string | null;
  topics: string | null;
  link: string | null;
  notes: string | null;
  createdBy: string | null;
}

export interface FeatureRequestItem {
  id: string;
  title: string;
  /** Markdown — may contain [text](url) links and ![alt](url) images. */
  description: string;
  painToSolve: string;
  reporter: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A client row on /clients: the canonical account plus its Salesforce report
 * snapshot. Every report field is nullable — the report covered active direct
 * accounts only, so 21 of the 95 accounts legitimately have none of it.
 */
export interface AccountDetail {
  id: string;
  name: string;
  health: string | null;
  products: string[];
  ehr: string | null;
  segment: string | null;
  billingState: string | null;
  accountOwner: string | null;
  csmName: string | null;
  hieMembers: number | null;
  qualityMembers: number | null;
  riskMembers: number | null;
  arr: number | null;
  carr: number | null;
  renewalDate: string | null;
  lastActivityAt: string | null;
  firstClosedWon: string | null;
  liveDate: string | null;
  /** Feedback entries filed against this account. */
  feedbackCount: number;
}

export interface CompetitorSourceItem {
  id: string;
  label: string;
  url: string;
  type: string;
}

/** A tracked competitor, sourced from the CI Launcher tool (see schema.prisma). */
export interface CompetitorItem {
  id: string;
  name: string;
  category: string;
  subgroup: string | null;
  positioning: string | null;
  website: string | null;
  overview: string | null;
  keyFacts: string | null;
  differentiation: string | null;
  lastUpdated: string | null;
  sources: CompetitorSourceItem[];
  /**
   * How much of this competitor's material the hub has read, and how many claims
   * came out of it. A rollup rather than the content itself: the claims run to a
   * few hundred rows of prose, far too much to ship with a list of 36. The panel
   * fetches them on open.
   */
  coverage: CompetitorCoverage;
}

export interface CompetitorCoverage {
  read: number;
  empty: number;
  skipped: number;
  failed: number;
  /** Claims drawn out of those documents — what the hub actually knows. */
  claims: number;
  /**
   * The newest "last modified" any source reported, which is the honest
   * freshness date. Competitor.lastUpdated is CI Launcher's own and can lag it
   * by a year.
   */
  newestSourceAt: string | null;
}

/** One document read out of a source link. See prisma CompetitorDocument. */
export interface CompetitorDocumentItem {
  id: string;
  /** The source link it was reached through, for nesting under it. */
  sourceId: string | null;
  title: string;
  url: string;
  /** "notion" | "drive" */
  origin: string;
  /** "ok" | "empty" | "skipped" | "failed" */
  status: string;
  note: string | null;
  truncated: boolean;
  sourceUpdatedAt: string | null;
  fetchedAt: string;
  /** How many claims were drawn from it. Zero for a miss. */
  claimCount: number;
}

/** One discrete claim about a competitor. See prisma CompetitorInsight. */
export interface CompetitorInsightItem {
  id: string;
  competitorId: string;
  /** Denormalised so the cross-competitor table can show it without a join. */
  competitorName: string;
  documentId: string | null;
  /** Title and link of the document it came from, for provenance in one hop. */
  documentTitle: string | null;
  documentUrl: string | null;
  oneLiner: string;
  content: string;
  topics: string[];
  productAreas: string[];
  /** "VERIFIED" | "REPORTED" | "CLAIMED" */
  confidence: string;
  /** "internal" | "external" */
  sensitivity: string;
  sensitivityReason: string | null;
  asOf: string | null;
}
