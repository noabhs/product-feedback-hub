import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logEvent, ACTIONS } from "@/lib/events";
import { isOwner } from "@/lib/people";

const RATINGS = ["up", "down"];

/**
 * Rate a stored answer. Unlike comments, this isn't restricted to the person who
 * asked: anyone signed in may judge any answer, because a wrong answer is wrong
 * no matter who received it, and the reviewer is usually not the asker. The most
 * recent judgment wins, and ratedBy records whose it was.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { rating, note } = await req.json();
  const clearing = rating === null || rating === undefined || rating === "";
  if (!clearing && !RATINGS.includes(rating)) {
    return NextResponse.json({ error: "Rating must be 'up', 'down' or null" }, { status: 400 });
  }

  const existing = await prisma.askLog.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Answer not found" }, { status: 404 });

  const updated = await prisma.askLog.update({
    where: { id },
    // Clearing a rating clears the note with it: a reason with no verdict
    // attached would sit on the page as an unexplained complaint.
    data: clearing
      ? { rating: null, ratingNote: null, ratedBy: null, ratedAt: null }
      : {
          rating,
          ratingNote: typeof note === "string" && note.trim() ? note.trim() : null,
          ratedBy: email,
          ratedAt: new Date(),
        },
  });

  void logEvent(ACTIONS.askRated, {
    target: id,
    label: `${updated.rating ?? "cleared"} — ${updated.question}`,
  });

  // Deliberately no actor: this response reaches every signed-in user.
  return NextResponse.json({
    id: updated.id,
    rating: updated.rating,
    ratingNote: updated.ratingNote,
  });
}

/**
 * Remove a logged question and answer.
 *
 * Owner only, and checked here rather than only in the UI: hiding a button is
 * not authorisation, and this page is shared with the whole team. Deleting is
 * for entries that shouldn't be on a shared page at all — a question with a
 * client name in it, a duplicate, a test.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!isOwner(email)) {
    return NextResponse.json({ error: "Only the hub owner can delete logged answers" }, { status: 403 });
  }

  const existing = await prisma.askLog.findUnique({ where: { id }, select: { question: true } });
  if (!existing) return NextResponse.json({ error: "Answer not found" }, { status: 404 });

  await prisma.askLog.delete({ where: { id } });
  void logEvent(ACTIONS.askDeleted, { target: id, label: existing.question });

  return NextResponse.json({ deleted: id });
}
