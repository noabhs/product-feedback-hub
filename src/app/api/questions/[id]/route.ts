import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeKey } from "@/lib/labels";
import { logEvent, ACTIONS } from "@/lib/events";

/**
 * Reclassifying a question — its product area and theme. Both are normalised
 * the same way the feedback routes do it, so a typed "Billing" can't split from
 * an existing "BILLING" in the filters.
 *
 * Only these two fields: the question text itself is deliberately not editable
 * here, since the id is a hash of it in imported rows.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: { productArea?: string; theme?: string } = {};
  if (body.productArea !== undefined) {
    const productArea = normalizeKey(body.productArea ?? "");
    if (!productArea) return NextResponse.json({ error: "Product area needs at least one letter or number" }, { status: 400 });
    data.productArea = productArea;
  }
  if (body.theme !== undefined) {
    const theme = normalizeKey(body.theme ?? "");
    if (!theme) return NextResponse.json({ error: "Theme needs at least one letter or number" }, { status: 400 });
    data.theme = theme;
  }
  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.discoveryQuestion.update({ where: { id }, data });
  void logEvent(ACTIONS.questionUpdated, { target: id, label: updated.question });
  return NextResponse.json(updated);
}
