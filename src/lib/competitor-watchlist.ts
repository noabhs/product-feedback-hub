/** Valid values for Competitor.tier / watchStatus, as the Notion watchlist spells them. */
export const COMPETITOR_TIERS = ["A", "B", "C"] as const;
export type CompetitorTier = (typeof COMPETITOR_TIERS)[number];

export const WATCH_STATUSES = ["Active competitor", "Watch", "Proposed", "Adjacent", "Dead / archived"] as const;
export type WatchStatus = (typeof WATCH_STATUSES)[number];

/** "A — head to head" → "A". Null for anything unrecognised. */
export function parseTier(raw: string | null | undefined): CompetitorTier | null {
  const letter = raw?.trim().charAt(0);
  return COMPETITOR_TIERS.find((t) => t === letter) ?? null;
}

/** Name matching is forgiving: "Nuance DAX" and "nuance dax " are one company. */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Watchlist category → the hub's CI Launcher-derived categories. */
export const WATCHLIST_CATEGORY_MAP: Record<string, string> = {
  "Pop health platforms": "Pop Health",
  "HCC / risk adjustment": "HCC / Risk Adj.",
  "Ambient scribes": "Ambient Scribes",
  EHRs: "EHRs",
  "Autonomous coding / RCM": "HCC / Risk Adj.",
  "Payer / health plan solutions": "Payer Solutions",
  "Data & interoperability": "Other",
  "AI-native / new entrant": "Other",
  "Adjacent — not a competitor": "Other",
};

/**
 * Watchlist names that differ from the hub's, normalized. Without these a
 * rename would create a duplicate instead of updating the existing competitor.
 */
export const WATCHLIST_ALIASES: Record<string, string> = {
  [normalizeName("Stanson Health (Premier)")]: "Stanson Health",
  [normalizeName("Eclat Health / Evaire")]: "Eclat / Evarie",
  [normalizeName("The Garage (Bridge)")]: "The Garage",
  [normalizeName("Pelica Health")]: "Pelica",
  [normalizeName("Microsoft Dragon Copilot (formerly Nuance DAX)")]: "Nuance DAX",
  [normalizeName("CorroHealth")]: "Corro Health",
  [normalizeName("DoctusTech")]: "Doctus",
  [normalizeName("Heidi Health")]: "Heidi",
  [normalizeName("Lightbeam Health Solutions")]: "Lightbeam Health",
  [normalizeName("athenahealth")]: "Athenahealth",
  [normalizeName("RAAPID")]: "Raapid",
  [normalizeName("Epic")]: "Epic",
};

export interface WatchlistRow {
  ref: number | null;
  company: string;
  tier: CompetitorTier | null;
  status: string | null;
  category: string | null;
  website: string | null;
  verified: Date | null;
  changed: Date | null;
}

/** Notion exports dates as "September 28, 2026"; ISO also works. Anything else is null. */
function exportDate(raw: string | undefined): Date | null {
  const d = raw?.trim() ? new Date(`${raw.trim()}${/\d{4}-\d{2}-\d{2}$/.test(raw.trim()) ? "" : " 12:00 UTC"}`) : null;
  return d && !isNaN(d.getTime()) ? d : null;
}

/**
 * Reads a Notion CSV export of the watchlist. Columns are found by header name,
 * so reordering or adding columns in Notion doesn't break the import; a missing
 * "Company" column is the one thing that does, and throws.
 */
export function watchlistRowsFromCsv(table: string[][]): WatchlistRow[] {
  const [header, ...body] = table;
  if (!header) return [];
  const col = (name: string) => header.findIndex((h) => h.replace(/^﻿/, "").trim().toLowerCase() === name.toLowerCase());
  const at = Object.fromEntries(
    ["Company", "Ref", "Tier", "Status", "Category", "Website", "Last verified", "Last material change"].map((n) => [n, col(n)]),
  );
  if (at["Company"] === -1) throw new Error('No "Company" column — is this the watchlist export?');
  const cell = (r: string[], name: string) => (at[name] === -1 ? undefined : r[at[name]]?.trim() || undefined);

  return body
    .filter((r) => cell(r, "Company"))
    .map((r) => {
      const ref = cell(r, "Ref")?.match(/\d+/)?.[0];
      return {
        ref: ref ? Number(ref) : null,
        company: cell(r, "Company")!,
        tier: parseTier(cell(r, "Tier")),
        status: cell(r, "Status") ?? null,
        category: cell(r, "Category") ?? null,
        website: cell(r, "Website") ?? null,
        verified: exportDate(cell(r, "Last verified")),
        changed: exportDate(cell(r, "Last material change")),
      };
    });
}
