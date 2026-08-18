import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { normalizeKey } from "@/lib/labels";
import { logEvent, ACTIONS } from "@/lib/events";
import { insightWhere } from "@/lib/insight-filters";
import { resolveClientForEdit } from "@/lib/accounts-db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where = insightWhere(searchParams);

  const [rows, total, grandTotal] = await Promise.all([
    prisma.insight.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { comments: true } } },
    }),
    prisma.insight.count({ where }),
    prisma.insight.count(),
  ]);

  // Flatten Prisma's _count into a plain commentCount for the client.
  const insights = rows.map(({ _count, ...rest }) => ({
    ...rest,
    commentCount: _count.comments,
  }));

  return NextResponse.json({ insights, total, grandTotal, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();

  if (!body.oneLiner?.trim()) {
    return NextResponse.json({ error: "One-liner is required" }, { status: 400 });
  }
  // Date is required on new entries so every item is placeable on a timeline.
  // Rejected server-side too, not just in the form.
  if (!body.date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  // Normalised here as well as in the form, so a direct API call can't
  // introduce a "Billing"/"billing" split in the charts.
  const productArea = normalizeKey(body.productArea ?? "") || "GENERAL";
  const theme = normalizeKey(body.theme ?? "") || "OTHER";

  // A typed client that isn't on the list used to be stored as null, so the
  // entry saved "fine" and silently lost its client. Say so instead.
  const client = await resolveClientForEdit(body.client, null);
  if (client.kind === "unknown") {
    return NextResponse.json(
      { error: `"${client.raw}" isn't on the client list. Add it on the Clients page, then set it here.` },
      { status: 400 },
    );
  }

  const insight = await prisma.insight.create({
    data: {
      productArea,
      theme,
      persona: body.persona ?? null,
      oneLiner: body.oneLiner,
      content: body.content,
      // Resolved against the canonical list; anything unrecognised is stored
      // as null rather than starting a new one-off client.
      client: client.kind === "set" ? client.value : null,
      clientRaw: body.client?.trim() || null,
      sourceName: body.sourceName ?? null,
      sourceUrl: body.sourceUrl ?? null,
      sourceType: body.sourceType ?? "MANUAL",
      date: new Date(body.date),
      wtp: body.wtp ?? null,
      tags: body.tags ? JSON.stringify(body.tags) : "[]",
      // Reporter is editable in the form: whoever gathered the feedback, which
      // is not always whoever is typing it in. Falls back to the signed-in user
      // when the field is left empty.
      createdBy: body.createdBy?.trim() || session?.user?.email || null,
    },
  });

  void logEvent(ACTIONS.feedbackCreated, { target: insight.id, label: insight.oneLiner });
  return NextResponse.json(insight, { status: 201 });
}
