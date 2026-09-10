import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CompetitorDocumentItem, CompetitorInsightItem } from "@/lib/types";

const iso = (d: Date | null) => d?.toISOString() ?? null;

/**
 * Everything one competitor's panel needs: the documents behind its links, and
 * the claims drawn out of them.
 *
 * Both in one response because the panel shows both at once, and two round trips
 * for one click is a visible stagger. Kept off /api/competitors because that
 * feeds a list of 36 rows which needs only the counts — the claim text is a few
 * hundred rows of prose and belongs behind a click.
 *
 * Document `text` is never returned. It's the verbatim audit copy behind the
 * claims; nothing on screen reads it.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [documents, insights] = await Promise.all([
    prisma.competitorDocument.findMany({
      where: { competitorId: id },
      select: {
        id: true,
        sourceId: true,
        title: true,
        url: true,
        origin: true,
        status: true,
        note: true,
        truncated: true,
        sourceUpdatedAt: true,
        fetchedAt: true,
        _count: { select: { insights: true } },
      },
      // Read documents first, then the misses — within a source group the
      // useful ones should lead.
      orderBy: [{ status: "asc" }, { title: "asc" }],
    }),
    prisma.competitorInsight.findMany({
      where: { competitorId: id },
      include: {
        competitor: { select: { name: true } },
        document: { select: { title: true, url: true } },
      },
      // Verified before reported before claimed happens to be alphabetical in
      // reverse, so sort explicitly rather than relying on that coincidence.
      orderBy: [{ createdAt: "asc" }],
    }),
  ]);

  const documentItems: CompetitorDocumentItem[] = documents.map(({ _count, ...d }) => ({
    ...d,
    sourceUpdatedAt: iso(d.sourceUpdatedAt),
    fetchedAt: d.fetchedAt.toISOString(),
    claimCount: _count.insights,
  }));

  const insightItems: CompetitorInsightItem[] = insights.map((i) => ({
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

  return NextResponse.json({ documents: documentItems, insights: insightItems });
}
