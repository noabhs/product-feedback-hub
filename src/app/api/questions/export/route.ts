import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv, csvDownloadHeaders } from "@/lib/csv";

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

  const csv = toCsv(
    ["Product area", "Theme", "Persona", "Question", "Intent / Notes", "Source"],
    rows.map((r) => [r.productArea, r.theme, r.persona, r.question, r.notesIntent, r.source]),
  );

  return new NextResponse(csv, { headers: csvDownloadHeaders("navina-discovery-questions") });
}
