import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { insightWhere } from "@/lib/insight-filters";

function esc(val: string | null | undefined): string {
  if (!val) return "";
  const s = String(val).replace(/"/g, '""');
  return /[",\n\r]/.test(s) ? `"${s}"` : s;
}

export async function GET(req: NextRequest) {
  const where = insightWhere(req.nextUrl.searchParams);

  const rows = await prisma.insight.findMany({ where, orderBy: { date: "desc" } });

  const headers = ["Product area", "Theme", "Client", "Persona", "One-liner", "Feedback", "Date", "Source", "Source URL", "WTP"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        esc(r.productArea),
        esc(r.theme),
        esc(r.client),
        esc(r.persona),
        esc(r.oneLiner),
        esc(r.content),
        r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
        esc(r.sourceName),
        esc(r.sourceUrl),
        esc(r.wtp),
      ].join(",")
    ),
  ];

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="navina-feedback-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
