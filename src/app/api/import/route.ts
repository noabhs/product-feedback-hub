import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapProductArea(raw: string): string {
  const map: Record<string, string> = {
    "pop health": "POP_HEALTH",
    "quality": "QUALITY",
    "analytics": "ANALYTICS",
    "agentic": "AGENTIC",
    "risk / dx": "RISK_DX",
    "risk/dx": "RISK_DX",
    "ambient": "AMBIENT",
    "general": "GENERAL",
    "competitive": "COMPETITIVE",
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
    "goals": "GOALS",
    "pricing / wtp": "PRICING_WTP",
    "pricing/wtp": "PRICING_WTP",
    "agentic": "AGENTIC",
    "ui / labels": "UI_LABELS",
    "ui / sections": "UI_SECTIONS",
    "pilot feedback": "PILOT_FEEDBACK",
    "product feedback": "PRODUCT_FEEDBACK",
    "onsite visit": "ONSITE_VISIT",
    "feedback": "FEEDBACK",
    "adoption": "ADOPTION",
    "ongoing feedback": "ONGOING_FEEDBACK",
    "patient-based": "OTHER",
    "general": "OTHER",
  };
  return map[raw.toLowerCase().trim()] ?? "OTHER";
}

function parseDate(raw: string): Date | null {
  if (!raw?.trim()) return null;
  const cleaned = raw.trim();
  const monthYear = cleaned.match(/^(\w{3})\s+(\d{4})$/);
  if (monthYear) return new Date(`${monthYear[1]} 1 ${monthYear[2]}`);
  const yearOnly = cleaned.match(/^(\d{4})$/);
  if (yearOnly) return new Date(`Jan 1 ${yearOnly[1]}`);
  const rangeYear = cleaned.match(/^(\d{4})-\d{4}$/);
  if (rangeYear) return new Date(`Jan 1 ${rangeYear[1]}`);
  try { return new Date(cleaned); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, rows } = body; // type: "questions" | "feedback"

  let imported = 0;
  const errors: string[] = [];

  if (type === "questions") {
    for (const row of rows) {
      const [productAreaRaw, themeRaw, persona, question, notesIntent, source] = row;
      if (!question?.trim()) continue;
      const id = `q-${Buffer.from(question).toString("base64").slice(0, 32)}`;
      try {
        await prisma.discoveryQuestion.upsert({
          where: { id },
          create: { id, productArea: mapProductArea(productAreaRaw ?? ""), theme: mapTheme(themeRaw ?? ""), persona: persona?.trim() || null, question: question.trim(), notesIntent: notesIntent?.trim() || null, source: source?.trim() || null },
          update: {},
        });
        imported++;
      } catch (e) { errors.push((e as Error).message); }
    }
  }

  if (type === "feedback") {
    for (const row of rows) {
      const [productAreaRaw, themeRaw, persona, oneLiner, content, date, wtp, source, client] = row;
      if (!oneLiner?.trim()) continue;
      const id = `ins-${Buffer.from(`${client}${oneLiner}`).toString("base64").slice(0, 32)}`;
      try {
        await prisma.insight.upsert({
          where: { id },
          create: { id, productArea: mapProductArea(productAreaRaw ?? ""), theme: mapTheme(themeRaw ?? ""), persona: persona?.trim() || null, oneLiner: oneLiner.trim(), content: content?.trim() || oneLiner.trim(), client: client?.trim() || null, sourceName: source?.trim() || null, sourceType: "SHEET", date: parseDate(date ?? ""), wtp: wtp?.trim() || null, tags: "[]" },
          update: {},
        });
        imported++;
      } catch (e) { errors.push((e as Error).message); }
    }
  }

  return NextResponse.json({ imported, errors });
}
