import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Distinct product areas, themes, and clients currently in use — including
 * any custom ones users have added. Feeds the form dropdowns and the feed
 * filters so a custom value is pickable by the next person instead of being
 * retyped (and misspelled) into a duplicate.
 */
export async function GET() {
  const [areas, themes, clients] = await Promise.all([
    prisma.insight.findMany({ select: { productArea: true }, distinct: ["productArea"] }),
    prisma.insight.findMany({ select: { theme: true }, distinct: ["theme"] }),
    prisma.insight.findMany({
      where: { client: { not: null } },
      select: { client: true },
      distinct: ["client"],
      orderBy: { client: "asc" },
    }),
  ]);

  return NextResponse.json({
    areas: areas.map((r) => r.productArea).filter(Boolean).sort(),
    themes: themes.map((r) => r.theme).filter(Boolean).sort(),
    clients: clients.map((r) => r.client as string).filter(Boolean),
  });
}
