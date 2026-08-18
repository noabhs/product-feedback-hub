import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** The canonical client list. Superseded by /api/accounts; kept for old links. */
export async function GET() {
  const rows = await prisma.account.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(rows.map((r) => r.name));
}
