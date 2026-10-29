import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, fail } from "../../_auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const u = await requireUser();
  if ("res" in u) return u.res;
  const { id } = await params;
  const review = await prisma.namingReview.findUnique({ where: { id }, include: { items: { orderBy: { order: "asc" } } } });
  return review ? NextResponse.json({ review }) : fail(new Error("Not found"), 404);
}

/** Clears a review from the page. The audit log keeps its record of what was changed. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const u = await requireUser();
  if ("res" in u) return u.res;
  const { id } = await params;
  const review = await prisma.namingReview.findUnique({ where: { id } });
  if (!review) return fail(new Error("Not found"), 404);
  await prisma.namingAudit.create({ data: { by: u.email, reviewId: null, action: "clear_view", key: id, from: "", to: review.title, result: "ok" } });
  await prisma.namingReview.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
