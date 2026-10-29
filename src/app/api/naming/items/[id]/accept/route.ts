import { NextRequest, NextResponse } from "next/server";
import { requireUser, fail } from "../../../_auth";
import { applyItem } from "@/lib/naming/apply";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;

/** Accepts one idea: renames it in Jira together with its linked Epics and release items. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if ("res" in u) return u.res;
  const { id } = await params;
  const item = await prisma.namingItem.findUnique({ where: { id } });
  if (!item) return fail(new Error("Not found"), 404);
  if (item.state === "applied") return NextResponse.json({ item });
  try {
    return NextResponse.json({ item: await applyItem(id, u.email) });
  } catch (e) {
    return fail(e, e instanceof Error && e.message === "Write a name first." ? 400 : 502);
  }
}
