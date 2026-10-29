import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "../_auth";

export async function GET() {
  const u = await requireUser();
  if ("res" in u) return u.res;
  return NextResponse.json({ audit: await prisma.namingAudit.findMany({ orderBy: { at: "desc" }, take: 400 }) });
}
