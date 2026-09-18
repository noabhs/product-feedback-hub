import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { AREA_LABELS } from "@/lib/labels";
import { matchAccount } from "@/lib/accounts";
import { loadAccounts } from "@/lib/accounts-db";

/**
 * Row-mapping helpers shared by every CSV/API import path: the signed-in
 * `/api/import` route and the secret-authenticated `/api/cron/feedback-import`
 * route both need identical mapping so the same input produces the same
 * upsert id and fields regardless of which door it came through.
 *
 * Kept deliberately in sync with prisma/seed.ts so that importing via either
 * route and running `npm run seed` produce identical ids and categories.
 */
export function hashId(prefix: string, content: string): string {
  return `${prefix}-${createHash("md5").update(content).digest("hex").slice(0, 24)}`;
}

const KNOWN_AREAS = new Set(Object.keys(AREA_LABELS));

export function mapProductArea(raw: string): string {
  // Values that are already canonical enums (e.g. from seed-sources.ts) pass through.
  const canonical = raw.trim().toUpperCase().replace(/[\s/-]+/g, "_");
  if (KNOWN_AREAS.has(canonical)) return canonical;

  const map: Record<string, string> = {
    "pop health": "POP_HEALTH",
    "quality": "QUALITY",
    "analytics": "ANALYTICS",
    "agentic": "AGENTIC",
    "agentic / pop health": "AGENTIC",
    "risk / dx": "RISK_DX",
    "risk/dx": "RISK_DX",
    "risk adjustment": "RISK_DX",
    "cost and utilization": "COST_AND_UTILIZATION",
    "cost & utilization": "COST_AND_UTILIZATION",
    "hospitalization": "HOSPITALIZATION",
    "point of care": "POINT_OF_CARE",
    "payers": "PAYERS",
    "care management": "CARE_MANAGEMENT",
    "coders": "CODERS",
    "ambient": "AMBIENT",
    "general": "GENERAL",
    "competitive": "COMPETITIVE",
    "general / payer": "GENERAL",
    "general / onboarding": "GENERAL",
    "quality / data": "QUALITY",
    "copilot / ambient": "AMBIENT",
    "pop health / analytics": "POP_HEALTH",
    "analytics / pop health": "ANALYTICS",
  };
  return map[raw.toLowerCase().trim()] ?? "GENERAL";
}

/**
 * A feedback row's area cell, which may name several: "RISK_DX; CODERS", or the
 * single value older sheets carry. Falls back to one GENERAL rather than none,
 * because a bulk import shouldn't reject rows over a blank column.
 */
export function mapProductAreas(raw: string): string[] {
  const areas = raw
    .split(/[;|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(mapProductArea);
  return areas.length ? [...new Set(areas)] : ["GENERAL"];
}

export function mapTheme(raw: string): string {
  const map: Record<string, string> = {
    "workflow": "WORKFLOW",
    "data / integration": "DATA_INTEGRATION",
    "data/integration": "DATA_INTEGRATION",
    "trust": "TRUST",
    "pain points": "PAIN_POINTS",
    "other pain points": "PAIN_POINTS",
    "goals": "GOALS",
    "pricing / wtp": "PRICING_WTP",
    "pricing/wtp": "PRICING_WTP",
    "agentic": "AGENTIC",
    "ui / labels": "OTHER",
    "ui / sections": "OTHER",
    "pilot feedback": "PILOT_FEEDBACK",
    "product feedback": "PRODUCT_FEEDBACK",
    "onsite visit": "ONSITE_VISIT",
    "feedback": "FEEDBACK",
    "adoption": "ADOPTION",
    "ongoing feedback": "ONGOING_FEEDBACK",
    "patient-based": "OTHER",
    "general": "OTHER",
    "companion codes": "OTHER",
    "grouping": "OTHER",
    "auto-doc": "OTHER",
    "auto-doc style": "OTHER",
    "clinical summary tab": "OTHER",
    "suggesting logic": "OTHER",
    "condition-based vs task-based": "OTHER",
    "hcc / risk": "OTHER",
    "icd / dropdown": "OTHER",
    "bulk actions / icd": "OTHER",
    "bulk actions": "OTHER",
    "analytics": "OTHER",
  };
  return map[raw.toLowerCase().trim()] ?? "OTHER";
}

export function parseDate(raw: string): Date | null {
  if (!raw?.trim()) return null;
  const cleaned = raw.trim();
  // Full ISO dates must be parsed directly — the year fallback below would
  // otherwise collapse "2026-05-01" to Jan 1 2026 and lose the month.
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    const iso = new Date(cleaned);
    if (!isNaN(iso.getTime())) return iso;
  }
  const monthYear = cleaned.match(/^(\w{3})\s+(\d{4})$/);
  if (monthYear) return new Date(`${monthYear[1]} 1 ${monthYear[2]}`);
  const yearOnly = cleaned.match(/^(\d{4})$/);
  if (yearOnly) return new Date(`Jan 1 ${yearOnly[1]}`);
  const anyYear = cleaned.match(/(\d{4})/);
  if (anyYear) return new Date(`Jan 1 ${anyYear[1]}`);
  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export interface ImportResult {
  imported: number;
  errors: string[];
}

/**
 * Upserts `feedback`-type rows (the `/api/import` column order: productArea,
 * theme, persona, oneLiner, content, date, wtp, source, client, sourceUrl,
 * reporter) into the Insight table. Shared by `/api/import` (signed-in) and
 * `/api/cron/feedback-import` (bearer-secret, for unattended syncs) so both
 * doors produce identical ids and fields for the same input.
 */
export async function importFeedbackRows(rows: unknown[][]): Promise<ImportResult> {
  // Loaded once for the whole batch rather than per row.
  const accounts = await loadAccounts();
  let imported = 0;
  const errors: string[] = [];

  for (const row of rows) {
    // Columns 10 and 11 are optional, so older exports still import fine.
    const [productAreaRaw, themeRaw, persona, oneLiner, content, date, wtp, source, client, sourceUrl, reporter] =
      row as string[];
    if (!oneLiner?.trim()) continue;
    const id = hashId("ins", `${client}${oneLiner}`);
    try {
      await prisma.insight.upsert({
        where: { id },
        create: {
          id,
          // The export writes several areas into one cell as "A; B", so the
          // column is split before mapping — otherwise a round trip through
          // CSV collapses a two-area entry into one junk area.
          productAreas: mapProductAreas(productAreaRaw ?? ""),
          theme: mapTheme(themeRaw ?? ""),
          persona: persona?.trim() || null,
          oneLiner: oneLiner.trim(),
          content: content?.trim() || oneLiner.trim(),
          // Unmatched clients import as null — see lib/accounts.ts.
          client: matchAccount(client, accounts),
          clientRaw: client?.trim() || null,
          sourceName: source?.trim() || null,
          sourceUrl: sourceUrl?.trim() || null,
          sourceType: "SHEET",
          date: parseDate(date ?? ""),
          wtp: wtp?.trim() || null,
          tags: "[]",
          // Whoever raised it upstream (a Slack poster or Jira reporter,
          // say) rather than whoever ran the import — that's the useful
          // attribution here.
          createdBy: reporter?.trim() || null,
        },
        update: {},
      });
      imported++;
    } catch (e) {
      errors.push((e as Error).message);
    }
  }

  return { imported, errors };
}
