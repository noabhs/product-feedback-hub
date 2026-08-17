import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logEvent, ACTIONS } from "@/lib/events";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = await prisma.comment.findMany({
    where: { insightId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const author = session?.user?.email;
  if (!author) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });

  // Guard against commenting on an entry that was deleted in another tab.
  const insight = await prisma.insight.findUnique({ where: { id }, select: { id: true } });
  if (!insight) return NextResponse.json({ error: "Feedback entry not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { insightId: id, author, body: body.trim() },
  });
  void logEvent(ACTIONS.commentCreated, { target: id, label: comment.body, actor: author });
  return NextResponse.json(comment, { status: 201 });
}
