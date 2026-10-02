import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv, csvDownloadHeaders } from "@/lib/csv";

/** Every competitor claim — the "What we know" tab on /competitors. */
export async function GET() {
  const insights = await prisma.competitorInsight.findMany({
    include: {
      competitor: { select: { name: true } },
      document: { select: { title: true, url: true } },
    },
    orderBy: [{ competitor: { name: "asc" } }, { createdAt: "asc" }],
  });

  const csv = toCsv(
    [
      "Competitor",
      "One-liner",
      "Claim",
      "Topics",
      "Product areas",
      "Confidence",
      "Sensitivity",
      "Sensitivity reason",
      "As of",
      "Source document",
      "Source URL",
    ],
    insights.map((i) => [
      i.competitor.name,
      i.oneLiner,
      i.content,
      i.topics.join("; "),
      i.productAreas.join("; "),
      i.confidence,
      i.sensitivity,
      i.sensitivityReason,
      i.asOf ? new Date(i.asOf).toISOString().slice(0, 10) : "",
      i.document?.title,
      i.document?.url,
    ]),
  );

  return new NextResponse(csv, { headers: csvDownloadHeaders("navina-competitor-claims") });
}
