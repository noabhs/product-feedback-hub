import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logEvent, ACTIONS } from "@/lib/events";
import { notifyMentions } from "@/lib/comment-notify";

/** Comments on a logged question. Same rules as insight comments: anyone signed in may read and write. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const comments = await prisma.askLogComment.findMany({
    where: { askLogId: id },
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

  const ask = await prisma.askLog.findUnique({ where: { id }, select: { id: true, question: true } });
  if (!ask) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const comment = await prisma.askLogComment.create({
    data: { askLogId: id, author, body: body.trim() },
  });
  void logEvent(ACTIONS.commentCreated, { target: id, label: comment.body, actor: author });
  // The DM names the question but never the asker, whose name only the owner may see.
  after(() =>
    notifyMentions({
      body: comment.body,
      author,
      target: { noun: "the question", title: ask.question, url: `/analytics?tab=asks&open=${ask.id}` },
    }),
  );
  return NextResponse.json(comment, { status: 201 });
}
