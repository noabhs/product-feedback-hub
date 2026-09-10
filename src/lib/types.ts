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
   * How much of this competitor's material the hub has actually read. A rollup
   * rather than the documents themselves: the summaries run to a few kilobytes
   * each and there are a couple of hundred of them, which is far too much to
   * ship with a list of 36 rows. The panel fetches the real text on open.
   */
  coverage: CompetitorCoverage;
}

export interface CompetitorCoverage {
  read: number;
  empty: number;
  skipped: number;
  failed: number;
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
  summary: string | null;
  /** "internal" | "external" | null */
  sensitivity: string | null;
  sensitivityReason: string | null;
  /** "ok" | "empty" | "skipped" | "failed" */
  status: string;
  note: string | null;
  truncated: boolean;
  sourceUpdatedAt: string | null;
  fetchedAt: string;
}
