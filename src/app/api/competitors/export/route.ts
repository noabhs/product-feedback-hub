import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv, csvDownloadHeaders } from "@/lib/csv";

/** The competitor roster — the "Competitors" tab on /competitors. */
export async function GET() {
  const rows = await prisma.competitor.findMany({
    include: {
      sources: true,
      documents: { select: { status: true } },
      _count: { select: { insights: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const csv = toCsv(
    [
      "Name",
      "Category",
      "Subgroup",
      "Positioning",
      "Website",
      "Overview",
      "Key facts",
      "Differentiation",
      "Sources",
      "Claims",
      "Documents read",
      "Documents failed",
      "Last updated",
    ],
    rows.map((c) => [
      c.name,
      c.category,
      c.subgroup,
      c.positioning,
      c.website,
      c.overview,
      c.keyFacts,
      c.differentiation,
      c.sources.length,
      c._count.insights,
      c.documents.filter((d) => d.status === "ok").length,
      c.documents.filter((d) => d.status === "failed").length,
      c.lastUpdated ? new Date(c.lastUpdated).toISOString().slice(0, 10) : "",
    ]),
  );

  return new NextResponse(csv, { headers: csvDownloadHeaders("navina-competitors") });
}
