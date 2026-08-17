import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
      { question: { contains: search, mode: "insensitive" } },
      { notesIntent: { contains: search, mode: "insensitive" } },
      { persona: { contains: search, mode: "insensitive" } },
    ];
  }

  const questions = await prisma.discoveryQuestion.findMany({
    where,
    orderBy: [{ productArea: "asc" }, { theme: "asc" }],
    take: 200,
  });

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  if (!body.question?.trim()) return NextResponse.json({ error: "Question is required" }, { status: 400 });
  const q = await prisma.discoveryQuestion.create({
    data: {
      productArea: body.productArea || "GENERAL",
      theme: body.theme || "WORKFLOW",
      persona: body.persona || null,
      question: body.question.trim(),
      notesIntent: body.notesIntent || null,
      source: body.source || null,
      createdBy: session?.user?.email ?? null,
    },
  });
  return NextResponse.json(q, { status: 201 });
}
