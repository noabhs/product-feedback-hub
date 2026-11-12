import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logEvent, ACTIONS } from "@/lib/events";
import { notifyMentions } from "@/lib/comment-notify";
import { cleanPagePath, pageLabel } from "@/lib/page-comments";

/** Comments on a whole page. Anyone signed in may read and write; ?path=/clients picks the page. */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const path = cleanPagePath(req.nextUrl.searchParams.get("path"));
  if (!path) return NextResponse.json({ error: "Missing page path" }, { status: 400 });

  const comments = await prisma.pageComment.findMany({ where: { path }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const author = session?.user?.email;
  if (!author) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { body, path: rawPath } = await req.json();
  const path = cleanPagePath(rawPath);
  if (!path) return NextResponse.json({ error: "Missing page path" }, { status: 400 });
  if (!body?.trim()) return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });

  const comment = await prisma.pageComment.create({ data: { path, author, body: body.trim() } });
  void logEvent(ACTIONS.commentCreated, { target: path, label: comment.body, actor: author });
  after(() =>
    notifyMentions({
      body: comment.body,
      author,
      target: { noun: "the page", title: pageLabel(path), url: path },
    }),
  );
  return NextResponse.json(comment, { status: 201 });
}
