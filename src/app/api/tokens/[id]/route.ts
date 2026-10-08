import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logEvent, ACTIONS } from "@/lib/events";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // Scoped to the owner, so one person can't revoke another's token.
  const { count } = await prisma.apiToken.updateMany({
    where: { id, owner: email, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await logEvent(ACTIONS.apiTokenRevoked, { target: id });
  return NextResponse.json({ ok: true });
}
