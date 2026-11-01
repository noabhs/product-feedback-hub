/**
 * Daily "new items" counts for the analytics page, split by where each item came from.
 *
 * Days are UTC, matching the usage trend next to it. `createdAt` is used rather
 * than `Insight.date` because the question is when something reached the hub,
 * not when the client said it.
 */

import { sourceCategory, type SourceCategory } from "@/lib/sources";

export const ADDED_WINDOW_DAYS = 30;

/** One colour per source, shared by both charts so "Slack" reads the same in each. */
export const SOURCE_COLORS: Record<SourceCategory, string> = {
  Slack: "#5d07e2",
  Jira: "#2563eb",
  Notion: "#00c2b2",
  Drive: "#d97706",
  "AI extract": "#db2777",
  "Added manually": "#64748b",
  Other: "#cbd5e1",
};

export interface AddedDay {
  key: string;
  label: string;
  total: number;
  bySource: Partial<Record<SourceCategory, number>>;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** An empty bucket for each of the last `days` days, oldest first. */
export function emptyDays(days: number, now: number = Date.now()): AddedDay[] {
  const out: AddedDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    out.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      total: 0,
      bySource: {},
    });
  }
  return out;
}

export function addToDays(days: AddedDay[], createdAt: Date, source: SourceCategory) {
  const bucket = days.find((d) => d.key === dayKey(createdAt));
  if (!bucket) return;
  bucket.total++;
  bucket.bySource[source] = (bucket.bySource[source] ?? 0) + 1;
}

/** Source of a feedback row: the same grouping the Feedback page filters on. */
export function feedbackSource(row: { sourceName: string | null; sourceType: string }): SourceCategory {
  return sourceCategory(row.sourceName, row.sourceType);
}

/**
 * Source of a competitor claim. Document-backed claims take the document's origin
 * ("notion" | "drive"); the rest carry a link and label of their own (a Slack
 * permalink from the sync). No document and no link means it was typed in.
 */
export function claimSourceCategory(row: {
  document: { origin: string } | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
}): SourceCategory {
  if (row.document) return sourceCategory(row.document.origin);
  if (row.sourceUrl || row.sourceLabel) return sourceCategory(`${row.sourceLabel ?? ""} ${row.sourceUrl ?? ""}`);
  return "Added manually";
}
