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
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (productArea) where.productArea = productArea;
  if (theme) where.theme = theme;
  if (search) {
    where.OR = [
      { question: { contains: search } },
      { notesIntent: { contains: search } },
      { persona: { contains: search } },
    ];
  }

  const rows = await prisma.discoveryQuestion.findMany({
    where,
    orderBy: [{ productArea: "asc" }, { theme: "asc" }],
  });

  const headers = ["Product area", "Theme", "Persona", "Question", "Intent / Notes", "Source"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [esc(r.productArea), esc(r.theme), esc(r.persona), esc(r.question), esc(r.notesIntent), esc(r.source)].join(",")
    ),
  ];

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="navina-discovery-questions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
