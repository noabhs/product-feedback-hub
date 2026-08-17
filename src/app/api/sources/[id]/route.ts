import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEvent, ACTIONS } from "@/lib/events";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doomed = await prisma.sourceDocument.findUnique({ where: { id }, select: { name: true } });
  await prisma.sourceDocument.delete({ where: { id } });
  void logEvent(ACTIONS.sourceDeleted, { target: id, label: doomed?.name });
  return NextResponse.json({ ok: true });
}
