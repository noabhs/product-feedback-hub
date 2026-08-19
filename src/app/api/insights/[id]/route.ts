import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeKey, normalizeAreas } from "@/lib/labels";
import { logEvent, ACTIONS } from "@/lib/events";
import { resolveClientForEdit } from "@/lib/accounts-db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const insight = await prisma.insight.findUnique({ where: { id } });
  if (!insight) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(insight);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // The row's current client decides whether an unrecognised value is the one
  // already stored (leave it) or something newly typed (tell the user).
  const existing = await prisma.insight.findUnique({ where: { id }, select: { client: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const productAreas = normalizeAreas(body.productAreas ?? body.productArea);
  if (!productAreas.length) {
    return NextResponse.json({ error: "At least one product area is required" }, { status: 400 });
  }

  const client = await resolveClientForEdit(body.client, existing.client);
  if (client.kind === "unknown") {
    return NextResponse.json(
      { error: `"${client.raw}" isn't on the client list. Add it on the Clients page, then set it here.` },
      { status: 400 },
    );
  }

  const updated = await prisma.insight.update({
    where: { id },
    data: {
      oneLiner: body.oneLiner,
      content: body.content,
      productAreas,
      theme: normalizeKey(body.theme ?? "") || "OTHER",
      persona: body.persona ?? null,
      client: client.kind === "set" ? client.value : undefined,
      sourceName: body.sourceName ?? null,
      sourceUrl: body.sourceUrl ?? null,
      date: body.date ? new Date(body.date) : null,
      wtp: body.wtp ?? null,
      // undefined leaves the column alone — a caller that doesn't send a
      // reporter must not silently drop the existing attribution.
      createdBy: body.createdBy === undefined ? undefined : (body.createdBy?.trim() || null),
    },
  });
  void logEvent(ACTIONS.feedbackUpdated, { target: id, label: updated.oneLiner });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doomed = await prisma.insight.findUnique({ where: { id }, select: { oneLiner: true } });
  await prisma.insight.delete({ where: { id } });
  void logEvent(ACTIONS.feedbackDeleted, { target: id, label: doomed?.oneLiner });
  return NextResponse.json({ ok: true });
}
