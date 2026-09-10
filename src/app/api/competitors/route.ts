import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CompetitorItem } from "@/lib/types";

const iso = (d: Date | null) => d?.toISOString() ?? null;

/**
 * 36 competitors with a handful of links each — small enough to return in
 * full every time, no pagination or detail-vs-list split needed.
 */
export async function GET() {
  const rows = await prisma.competitor.findMany({
    include: {
      sources: { orderBy: { createdAt: "asc" } },
      // Statuses and dates only, plus a claim count. The claims themselves are a
      // few hundred rows of prose across these 36 competitors, so they are
      // fetched per competitor when a panel opens, or in full by the claims
      // table on the same page.
      documents: { select: { status: true, sourceUpdatedAt: true } },
      _count: { select: { insights: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const competitors: CompetitorItem[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    subgroup: c.subgroup,
    positioning: c.positioning,
    website: c.website,
    overview: c.overview,
    keyFacts: c.keyFacts,
    differentiation: c.differentiation,
    lastUpdated: iso(c.lastUpdated),
    sources: c.sources.map((s) => ({ id: s.id, label: s.label, url: s.url, type: s.type })),
    coverage: {
      read: c.documents.filter((d) => d.status === "ok").length,
      empty: c.documents.filter((d) => d.status === "empty").length,
      skipped: c.documents.filter((d) => d.status === "skipped").length,
      failed: c.documents.filter((d) => d.status === "failed").length,
      claims: c._count.insights,
      newestSourceAt: iso(
        c.documents.reduce<Date | null>(
          (newest, d) => (d.sourceUpdatedAt && (!newest || d.sourceUpdatedAt > newest) ? d.sourceUpdatedAt : newest),
          null,
        ),
      ),
    },
  }));

  return NextResponse.json({ competitors });
}
