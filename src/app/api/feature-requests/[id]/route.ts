import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isOwner } from "@/lib/people";
import { logEvent, ACTIONS } from "@/lib/events";
import { isFeatureRequestStatus } from "@/lib/feature-request-status";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await prisma.featureRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(request);
}

/**
 * Only the reporter or the hub owner may edit or delete a request — enforced
 * here, not just hidden in the UI, since the API is reachable directly.
 */
async function assertCanModify(id: string) {
  const session = await auth();
  const email = session?.user?.email;
  const existing = await prisma.featureRequest.findUnique({ where: { id }, select: { reporter: true } });
  if (!existing) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (!email || (email !== existing.reporter && !isOwner(email))) {
    return { error: NextResponse.json({ error: "Only the reporter or the hub owner can do that" }, { status: 403 }) };
  }
  return { existing };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await assertCanModify(id);
  if (error) return error;

  const body = await req.json();
  if (body.title !== undefined && !body.title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (body.description !== undefined && !body.description.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (body.painToSolve !== undefined && !body.painToSolve.trim()) {
    return NextResponse.json({ error: "Pain to solve is required" }, { status: 400 });
  }
  if (body.status !== undefined && !isFeatureRequestStatus(body.status)) {
    return NextResponse.json({ error: "Not a valid status" }, { status: 400 });
  }

  const updated = await prisma.featureRequest.update({
    where: { id },
    data: {
      title: body.title?.trim(),
      description: body.description?.trim(),
      painToSolve: body.painToSolve?.trim(),
      status: body.status,
    },
  });

  void logEvent(ACTIONS.featureRequestUpdated, { target: id, label: updated.title });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await assertCanModify(id);
  if (error) return error;

  const doomed = await prisma.featureRequest.findUnique({ where: { id }, select: { title: true } });
  await prisma.featureRequest.delete({ where: { id } });
  void logEvent(ACTIONS.featureRequestDeleted, { target: id, label: doomed?.title });
  return NextResponse.json({ ok: true });
}
