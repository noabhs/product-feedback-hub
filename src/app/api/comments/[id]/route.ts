import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/** Only the comment's author may modify it — checked server-side, not just in the UI. */
async function authorize(id: string) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return { error: NextResponse.json({ error: "Comment not found" }, { status: 404 }) };
  if (comment.author !== email) {
    return { error: NextResponse.json({ error: "You can only change your own comments" }, { status: 403 }) };
  }
  return { comment };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await authorize(id);
  if (error) return error;

  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });

  const updated = await prisma.comment.update({
    where: { id },
    data: { body: body.trim() },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await authorize(id);
  if (error) return error;

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
