import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function esc(val: string | null | undefined): string {
  if (!val) return "";
  const s = String(val).replace(/"/g, '""');
  return /[",\n\r]/.test(s) ? `"${s}"` : s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const productArea = searchParams.get("productArea");
  const theme = searchParams.get("theme");
  const client = searchParams.get("client");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (productArea) where.productArea = productArea;
  if (theme) where.theme = theme;
  if (client) where.client = client;
  if (search) {
    where.OR = [
      { oneLiner: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { client: { contains: search, mode: "insensitive" } },
    ];
  }

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
