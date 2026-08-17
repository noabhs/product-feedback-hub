import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

  const [rows, total] = await Promise.all([
    prisma.insight.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { comments: true } } },
    }),
    prisma.insight.count({ where }),
  ]);

  // Flatten Prisma's _count into a plain commentCount for the client.
  const insights = rows.map(({ _count, ...rest }) => ({
    ...rest,
    commentCount: _count.comments,
  }));

  return NextResponse.json({ insights, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();

  if (!body.oneLiner?.trim()) {
    return NextResponse.json({ error: "One-liner is required" }, { status: 400 });
  }
  // Date is required on new entries so every item is placeable on a timeline.
  // Rejected server-side too, not just in the form.
  if (!body.date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

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
      date: new Date(body.date),
      wtp: body.wtp ?? null,
      tags: body.tags ? JSON.stringify(body.tags) : "[]",
      createdBy: session?.user?.email ?? null,
    },
  });

  return NextResponse.json(insight, { status: 201 });
}
