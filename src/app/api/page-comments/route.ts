import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logEvent, ACTIONS } from "@/lib/events";
import { notifyMentions } from "@/lib/comment-notify";
import { cleanPagePath, pageLabel, cleanAnchor } from "@/lib/page-comments";

/**
 * Pinned comments on a page. Everyone signed in sees all of them (resolved ones
 * included, the client decides what to show) and may post, reply and resolve;
 * only the author may edit or delete. ?path=/clients picks the page.
 */
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

  const { body, path: rawPath, parentId, anchor } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Comment can't be empty" }, { status: 400 });

  let path: string | null;
  let data;
  if (parentId) {
    // A reply inherits the page from the root it answers; replies to replies attach to the root.
    const parent = await prisma.pageComment.findUnique({ where: { id: String(parentId) } });
    if (!parent) return NextResponse.json({ error: "That thread was deleted" }, { status: 404 });
    path = parent.path;
    data = { path, author, body: body.trim(), parentId: parent.parentId ?? parent.id };
  } else {
    path = cleanPagePath(rawPath);
    const a = cleanAnchor(anchor);
    if (!path || !a) return NextResponse.json({ error: "Missing page position" }, { status: 400 });
    data = { path, author, body: body.trim(), ...a };
  }

  const comment = await prisma.pageComment.create({ data });
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
