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
    include: { sources: { orderBy: { createdAt: "asc" } } },
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
  }));

  return NextResponse.json({ competitors });
}
