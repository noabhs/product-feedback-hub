import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
