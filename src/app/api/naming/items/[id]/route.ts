import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, fail } from "../../_auth";
import type { ItemData } from "@/lib/naming/types";

type Ctx = { params: Promise<{ id: string }> };

/**
 * One edit to an item before it is applied: a new proposed name, reject or reopen,
 * or flipping whether a linked Epic or release item takes the new name.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const u = await requireUser();
  if ("res" in u) return u.res;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const item = await prisma.namingItem.findUnique({ where: { id } });
  if (!item) return fail(new Error("Not found"), 404);
  if (item.state === "applied") return fail(new Error("Already applied."), 409);
  const data = structuredClone(item.data as unknown as ItemData);

  switch (body.op) {
    case "edit": {
      const name = String(body.proposed ?? "").trim();
      if (!name || name.length > 255) return fail(new Error("Write a name first."), 400);
      data.edited = true; data.inferred = false; data.question = null; data.error = null;
      const row = await prisma.namingItem.update({ where: { id }, data: { proposed: name, state: "pending", data: { ...data } } });
      return NextResponse.json({ item: row });
    }
    case "reject":
      return NextResponse.json({ item: await prisma.namingItem.update({ where: { id }, data: { state: "rejected" } }) });
    case "reopen":
      return NextResponse.json({ item: await prisma.namingItem.update({ where: { id }, data: { state: item.proposed ? "pending" : "needs_context" } }) });
    case "delivery": case "release": {
      const list = body.op === "delivery" ? data.delivery : data.releases;
      const row = list[Number(body.index)];
      if (!row) return fail(new Error("Not found"), 404);
      row.action = body.on ? "rename" : "leave";
      return NextResponse.json({ item: await prisma.namingItem.update({ where: { id }, data: { data: { ...data } } }) });
    }
    default:
      return fail(new Error("Unknown edit"), 400);
  }
}
