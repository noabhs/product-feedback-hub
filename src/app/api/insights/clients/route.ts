import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPinnedClients } from "@/lib/clients";

export async function GET() {
  const rows = await prisma.insight.findMany({
    where: { client: { not: null } },
    select: { client: true },
    distinct: ["client"],
    orderBy: { client: "asc" },
  });
  const clients = withPinnedClients(rows.map((r) => r.client as string).filter(Boolean));
  return NextResponse.json(clients);
}
