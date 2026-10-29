import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireEditor, canEditNaming, fail } from "../_auth";
import { buildItems } from "@/lib/naming/build";
import { jiraConfigured, parseViewLink } from "@/lib/naming/jira";

export const maxDuration = 300;

export async function GET() {
  const u = await requireUser();
  if ("res" in u) return u.res;
  const reviews = await prisma.namingReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json({ reviews, canEdit: canEditNaming(u.email) });
}

/** Builds a review: reads the chosen ideas from Jira, proposes names, stores the result. */
export async function POST(req: NextRequest) {
  const u = await requireEditor();
  if ("res" in u) return u.res;
  const body = await req.json().catch(() => ({}));
  const parsed = parseViewLink(String(body.url ?? ""));
  const keys: string[] = Array.isArray(body.keys) ? body.keys.filter((k: unknown) => typeof k === "string" && /^[A-Z][A-Z0-9_]+-\d+$/.test(k)) : [];
  if (!parsed || !keys.length) return fail(new Error("Choose at least one idea."), 400);
  if (keys.length > 120) return fail(new Error("Review at most 120 ideas at a time."), 400);
  if (!jiraConfigured()) return fail(new Error("Jira is not connected to the hub yet."), 503);
  try {
    const items = await buildItems(keys);
    const review = await prisma.namingReview.create({
      data: {
        title: String(body.title ?? "").trim().slice(0, 80) || `${parsed.project} review`,
        viewUrl: String(body.url),
        project: parsed.project,
        createdBy: u.email,
        items: { create: items.map((i) => ({ key: i.key, order: i.order, current: i.current, proposed: i.proposed, state: i.state, data: JSON.parse(JSON.stringify(i.data)) })) },
      },
    });
    return NextResponse.json({ id: review.id }, { status: 201 });
  } catch (e) {
    return fail(e, 502);
  }
}
