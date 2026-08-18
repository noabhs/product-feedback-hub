import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPinnedClients } from "@/lib/clients";
import { auth } from "@/auth";

/**
 * Distinct product areas, themes, and clients currently in use — including
 * any custom ones users have added. Feeds the form dropdowns and the feed
 * filters so a custom value is pickable by the next person instead of being
 * retyped (and misspelled) into a duplicate.
 *
 * Also returns the reporters already on record and `me`, the signed-in address.
 * The reporter field defaults to `me` but can be pointed at whoever actually
 * gathered the feedback, which is often not the person entering it.
 */
export async function GET() {
  const [session, areas, themes, clients, reporters] = await Promise.all([
    auth(),
    prisma.insight.findMany({ select: { productArea: true }, distinct: ["productArea"] }),
    prisma.insight.findMany({ select: { theme: true }, distinct: ["theme"] }),
    prisma.insight.findMany({
      where: { client: { not: null } },
      select: { client: true },
      distinct: ["client"],
      orderBy: { client: "asc" },
    }),
    prisma.insight.findMany({
      where: { createdBy: { not: null } },
      select: { createdBy: true },
      distinct: ["createdBy"],
      orderBy: { createdBy: "asc" },
    }),
  ]);

  return NextResponse.json({
    areas: areas.map((r) => r.productArea).filter(Boolean).sort(),
    themes: themes.map((r) => r.theme).filter(Boolean).sort(),
    clients: withPinnedClients(clients.map((r) => r.client as string).filter(Boolean)),
    reporters: reporters.map((r) => r.createdBy as string).filter(Boolean),
    me: session?.user?.email ?? null,
  });
}
