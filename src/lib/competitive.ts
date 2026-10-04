/**
 * Competitive intelligence lives under Competitors ("What we know"), not in
 * client feedback. "Competitive Intelligence" used to be a pseudo-client that
 * those entries were filed under; the entries were moved to competitor claims
 * and the account removed, and the write paths use this to keep it that way.
 */
const PSEUDO_CLIENT = "competitive intelligence";

export const COMPETITIVE_INTEL_MESSAGE =
  "Competitive intelligence belongs under Competitors, not Product Feedback. Add it as a competitor claim instead (POST /api/competitors/insights).";

export function isCompetitiveIntelClient(client: string | null | undefined): boolean {
  return client?.trim().toLowerCase() === PSEUDO_CLIENT;
}
