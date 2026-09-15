import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEvent, ACTIONS } from "@/lib/events";
import type { CompetitorInsightItem } from "@/lib/types";

const iso = (d: Date | null) => d?.toISOString() ?? null;

/**
 * Every competitor claim, for the table on /competitors.
 *
 * Returned whole and filtered in the browser, the same way the feedback table
 * works: a few hundred rows is small enough that server-side filtering would
 * add a round trip to every checkbox for no gain. If this passes a few thousand
 * claims, move the filters into the query.
 *
 * The competitor name is denormalised onto each row so the table can group and
 * filter by it without holding a second list in step.
 */
export async function GET() {
  const insights = await prisma.competitorInsight.findMany({
    include: {
      competitor: { select: { name: true } },
      document: { select: { title: true, url: true } },
    },
    orderBy: [{ competitor: { name: "asc" } }, { createdAt: "asc" }],
  });

  const items: CompetitorInsightItem[] = insights.map((i) => ({
    id: i.id,
    competitorId: i.competitorId,
    competitorName: i.competitor.name,
    documentId: i.documentId,
    documentTitle: i.document?.title ?? null,
    documentUrl: i.document?.url ?? null,
    oneLiner: i.oneLiner,
    content: i.content,
    topics: i.topics,
    productAreas: i.productAreas,
    confidence: i.confidence,
    sensitivity: i.sensitivity,
    sensitivityReason: i.sensitivityReason,
    asOf: iso(i.asOf),
  }));

  return NextResponse.json({ insights: items });
}

/**
 * Saves one hand-reviewed claim — from the "Competition" AI-extract flow, or
 * typed in directly. `documentId` is always null here: that column is only
 * ever set by the automated ingest pipeline (`src/lib/ingest/run.ts`), which
 * links a claim to the `CompetitorDocument` it was read from. A claim posted
 * here has no such document, by definition — a human reviewed and approved
 * it instead.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const competitorId = typeof body.competitorId === "string" ? body.competitorId : "";
  const oneLiner = typeof body.oneLiner === "string" ? body.oneLiner.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!competitorId) return NextResponse.json({ error: "competitorId is required" }, { status: 400 });
  if (!oneLiner) return NextResponse.json({ error: "oneLiner is required" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const insight = await prisma.competitorInsight.create({
    data: {
      competitorId,
      documentId: null,
      oneLiner,
      content,
      topics: Array.isArray(body.topics) ? body.topics : [],
      productAreas: Array.isArray(body.productAreas) ? body.productAreas : [],
      confidence: body.confidence || "REPORTED",
      sensitivity: body.sensitivity === "internal" ? "internal" : "external",
      sensitivityReason: body.sensitivity === "internal" ? (body.sensitivityReason?.trim() || null) : null,
      asOf: body.asOf ? new Date(body.asOf) : null,
    },
  });

  void logEvent(ACTIONS.competitorInsightCreated, { target: insight.id, label: insight.oneLiner });
  return NextResponse.json(insight, { status: 201 });
}
