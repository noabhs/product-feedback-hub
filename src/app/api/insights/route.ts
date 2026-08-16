import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const productArea = searchParams.get("productArea");
  const theme = searchParams.get("theme");
  const client = searchParams.get("client");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

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

  const [insights, total] = await Promise.all([
    prisma.insight.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.insight.count({ where }),
  ]);

  return NextResponse.json({ insights, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const insight = await prisma.insight.create({
    data: {
      productArea: body.productArea,
      theme: body.theme,
      persona: body.persona ?? null,
      oneLiner: body.oneLiner,
      content: body.content,
      client: body.client ?? null,
      sourceName: body.sourceName ?? null,
      sourceUrl: body.sourceUrl ?? null,
      sourceType: body.sourceType ?? "MANUAL",
      date: body.date ? new Date(body.date) : null,
      wtp: body.wtp ?? null,
      tags: body.tags ? JSON.stringify(body.tags) : "[]",
    },
  });

  return NextResponse.json(insight, { status: 201 });
}
