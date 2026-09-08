/**
 * Canonical status list for feature requests, in workflow order. Kept here as a
 * TS array rather than a Postgres enum, matching how Account.health and
 * Insight.sourceType are validated on the app side (see schema.prisma).
 */
export const FEATURE_REQUEST_STATUSES = [
  "New",
  "Under Review",
  "Planned",
  "In Progress",
  "Done",
  "Rejected",
] as const;

export type FeatureRequestStatus = (typeof FEATURE_REQUEST_STATUSES)[number];

export const DEFAULT_FEATURE_REQUEST_STATUS: FeatureRequestStatus = "New";

export const FEATURE_REQUEST_STATUS_OPTIONS = FEATURE_REQUEST_STATUSES.map((s) => ({
  value: s,
  label: s,
}));

export function isFeatureRequestStatus(value: string): value is FeatureRequestStatus {
  return (FEATURE_REQUEST_STATUSES as readonly string[]).includes(value);
}
