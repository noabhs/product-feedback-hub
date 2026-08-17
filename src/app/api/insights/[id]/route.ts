import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeKey } from "@/lib/labels";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const insight = await prisma.insight.findUnique({ where: { id } });
  if (!insight) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(insight);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.insight.update({
    where: { id },
    data: {
      oneLiner: body.oneLiner,
      content: body.content,
      productArea: normalizeKey(body.productArea ?? "") || "GENERAL",
      theme: normalizeKey(body.theme ?? "") || "OTHER",
      persona: body.persona ?? null,
      client: body.client ?? null,
      sourceName: body.sourceName ?? null,
      sourceUrl: body.sourceUrl ?? null,
      date: body.date ? new Date(body.date) : null,
      wtp: body.wtp ?? null,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.insight.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
