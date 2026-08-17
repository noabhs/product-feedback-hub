import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

// Kept deliberately in sync with prisma/seed.ts so that importing via this
// route and running `npm run seed` produce identical ids and categories.
function hashId(prefix: string, content: string): string {
  return `${prefix}-${createHash("md5").update(content).digest("hex").slice(0, 24)}`;
}

const KNOWN_AREAS = new Set([
  "POP_HEALTH", "QUALITY", "ANALYTICS", "AGENTIC", "RISK_DX", "AMBIENT", "GENERAL", "COMPETITIVE",
]);

function mapProductArea(raw: string): string {
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

function mapTheme(raw: string): string {
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

function parseDate(raw: string): Date | null {
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

export async function POST(req: NextRequest) {
  try {
    const { type, rows } = await req.json(); // type: "questions" | "feedback"
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
    }

    let imported = 0;
    const errors: string[] = [];

    if (type === "questions") {
      for (const row of rows) {
        const [productAreaRaw, themeRaw, persona, question, notesIntent, source] = row;
        if (!question?.trim()) continue;
        const id = hashId("q", question);
        try {
          await prisma.discoveryQuestion.upsert({
            where: { id },
            create: {
              id,
              productArea: mapProductArea(productAreaRaw ?? ""),
              theme: mapTheme(themeRaw ?? ""),
              persona: persona?.trim() || null,
              question: question.trim(),
              notesIntent: notesIntent?.trim() || null,
              source: source?.trim() || null,
            },
            update: {},
          });
          imported++;
        } catch (e) { errors.push((e as Error).message); }
      }
    }

    if (type === "feedback") {
      for (const row of rows) {
        // Columns 10 and 11 are optional, so older exports still import fine.
        const [productAreaRaw, themeRaw, persona, oneLiner, content, date, wtp, source, client, sourceUrl, reporter] = row;
        if (!oneLiner?.trim()) continue;
        const id = hashId("ins", `${client}${oneLiner}`);
        try {
          await prisma.insight.upsert({
            where: { id },
            create: {
              id,
              productArea: mapProductArea(productAreaRaw ?? ""),
              theme: mapTheme(themeRaw ?? ""),
              persona: persona?.trim() || null,
              oneLiner: oneLiner.trim(),
              content: content?.trim() || oneLiner.trim(),
              client: client?.trim() || null,
              sourceName: source?.trim() || null,
              sourceUrl: sourceUrl?.trim() || null,
              sourceType: "SHEET",
              date: parseDate(date ?? ""),
              wtp: wtp?.trim() || null,
              tags: "[]",
              // Whoever raised it upstream (a Jira reporter, say) rather than
              // whoever ran the import — that's the useful attribution here.
              createdBy: reporter?.trim() || null,
            },
            update: {},
          });
          imported++;
        } catch (e) { errors.push((e as Error).message); }
      }
    }

    if (type === "sources") {
      for (const row of rows) {
        const [name, productAreaRaw, date, format, topics, link, notes] = row;
        if (!name?.trim()) continue;
        const id = hashId("src", name);
        try {
          await prisma.sourceDocument.upsert({
            where: { id },
            create: {
              id,
              name: name.trim(),
              productArea: mapProductArea(productAreaRaw ?? ""),
              date: parseDate(date ?? ""),
              format: format?.trim() || null,
              topics: topics?.trim() || null,
              link: link?.trim() || null,
              notes: notes?.trim() || null,
            },
            update: {},
          });
          imported++;
        } catch (e) { errors.push((e as Error).message); }
      }
    }

    return NextResponse.json({ imported, errors });
  } catch (e) {
    console.error("[import]", e);
    return NextResponse.json({ error: (e as Error).message ?? "Import failed" }, { status: 500 });
  }
}
