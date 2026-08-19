import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { insightWhere } from "@/lib/insight-filters";
import { toCsv, csvDownloadHeaders } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const where = insightWhere(req.nextUrl.searchParams);

  const rows = await prisma.insight.findMany({ where, orderBy: { date: "desc" } });

  const csv = toCsv(
    ["Product areas", "Theme", "Client", "Persona", "One-liner", "Feedback", "Date", "Source", "Source URL", "WTP"],
    rows.map((r) => [
      // Semicolons, so a reader can split them and a comma can't break the CSV.
      r.productAreas.join("; "),
      r.theme,
      r.client,
      r.persona,
      r.oneLiner,
      r.content,
      r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
      r.sourceName,
      r.sourceUrl,
      r.wtp,
    ]),
  );

  return new NextResponse(csv, { headers: csvDownloadHeaders("navina-feedback") });
}
