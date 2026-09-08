/**
 * Categories mirror CI Launcher's own sidebar grouping, kept here as a TS
 * array rather than a Postgres enum — same convention as
 * FEATURE_REQUEST_STATUSES (see feature-request-status.ts).
 */
export const COMPETITOR_CATEGORIES = [
  "HCC / Risk Adj.",
  "EHRs",
  "Payer Solutions",
  "Other",
] as const;

export type CompetitorCategory = (typeof COMPETITOR_CATEGORIES)[number];

export function isCompetitorCategory(value: string): value is CompetitorCategory {
  return (COMPETITOR_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Sub-groupings that exist inside one category only, in display order.
 * Every other category has no entry here (subgroup is always null for them).
 */
export const COMPETITOR_SUBGROUPS: Partial<Record<CompetitorCategory, readonly string[]>> = {
  "HCC / Risk Adj.": ["Pop Health", "Ambient Scribes"],
};
