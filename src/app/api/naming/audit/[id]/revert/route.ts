import { NextRequest, NextResponse } from "next/server";
import { requireEditor, fail } from "../../../_auth";
import { revertAudit } from "@/lib/naming/apply";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireEditor();
  if ("res" in u) return u.res;
  try {
    await revertAudit((await params).id, u.email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e, 502);
  }
}
