import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CompetitorDocumentItem } from "@/lib/types";

const iso = (d: Date | null) => d?.toISOString() ?? null;

/**
 * The documents read for one competitor, with their summaries.
 *
 * Separate from /api/competitors because the summaries are the bulk of the
 * payload — a few kilobytes each, a couple of hundred of them across all 36
 * competitors — and the list page needs only the counts. Opening a panel is the
 * moment someone actually wants the text.
 *
 * `text` is deliberately not returned. It's the verbatim copy kept as the audit
 * trail behind each summary; the panel shows the summary, and shipping both
 * would double the response for something nothing on screen reads.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const documents = await prisma.competitorDocument.findMany({
    where: { competitorId: id },
    select: {
      id: true,
      sourceId: true,
      title: true,
      url: true,
      origin: true,
      summary: true,
      sensitivity: true,
      sensitivityReason: true,
      status: true,
      note: true,
      truncated: true,
      sourceUpdatedAt: true,
      fetchedAt: true,
    },
    // Read documents first, then the misses — the panel groups by source link
    // anyway, and within a group the useful ones should lead.
    orderBy: [{ status: "asc" }, { title: "asc" }],
  });

  const items: CompetitorDocumentItem[] = documents.map((d) => ({
    ...d,
    sourceUpdatedAt: iso(d.sourceUpdatedAt),
    fetchedAt: d.fetchedAt.toISOString(),
  }));

  return NextResponse.json({ documents: items });
}
