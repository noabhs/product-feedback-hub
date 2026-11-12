import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logEvent, ACTIONS } from "@/lib/events";
import { notifyMentions } from "@/lib/comment-notify";
import { listPeople } from "@/lib/people-directory";
import { resolveMentions } from "@/lib/mentions";
import { pageLabel } from "@/lib/page-comments";

async function load(id: string) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  const comment = await prisma.pageComment.findUnique({ where: { id } });
  if (!comment) return { error: NextResponse.json({ error: "Comment not found" }, { status: 404 }) };
  return { email, comment };
}

/**
 * Two kinds of change. Editing the text is the author's alone, checked here and
 * not just in the UI. Resolving or reopening a thread is open to anyone signed in.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, email, comment } = await load(id);
  if (error) return error;

  const { body, resolved } = await req.json();

  if (typeof resolved === "boolean") {
    if (comment!.parentId) return NextResponse.json({ error: "Resolve the thread, not a reply" }, { status: 400 });
    const updated = await prisma.pageComment.update({
      where: { id },
      data: resolved ? { resolvedAt: new Date(), resolvedBy: email } : { resolvedAt: null, resolvedBy: null },
    });
    return NextResponse.json(updated);
  }

  if (comment!.author !== email) {
    return NextResponse.json({ error: "You can only change your own comments" }, { status: 403 });
  }
  if (!body?.trim()) return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });

  const updated = await prisma.pageComment.update({ where: { id }, data: { body: body.trim() } });
  void logEvent(ACTIONS.commentUpdated, { target: id, label: updated.body });
  // Only people the edit newly adds get a DM.
  after(async () => {
    const before = resolveMentions(comment!.body, await listPeople());
    await notifyMentions({
      body: updated.body,
      author: updated.author,
      target: { noun: "the page", title: pageLabel(updated.path), url: updated.path },
      alreadyNotified: before,
    });
  });
  return NextResponse.json(updated);
}

/** Deleting a thread's first comment takes its replies with it (cascade). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error, email, comment } = await load(id);
  if (error) return error;
  if (comment!.author !== email) {
    return NextResponse.json({ error: "You can only change your own comments" }, { status: 403 });
  }
  await prisma.pageComment.delete({ where: { id } });
  void logEvent(ACTIONS.commentDeleted, { target: id });
  return NextResponse.json({ ok: true });
}
