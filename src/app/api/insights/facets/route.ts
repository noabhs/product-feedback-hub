import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Distinct product areas and themes currently in use — including any custom
 * ones users have added — so a custom value is pickable by the next person
 * instead of being retyped (and misspelled) into a duplicate.
 *
 * Clients are different: they come from the canonical Account list, not from
 * whatever happens to be stored, so the feed can't offer a half-spelled client
 * as though it were real.
 *
 * Also returns the reporters already on record and `me`, the signed-in address.
 * The reporter field defaults to `me` but can be pointed at whoever actually
 * gathered the feedback, which is often not the person entering it.
 */
export async function GET() {
  const [session, areas, themes, clients, reporters] = await Promise.all([
    auth(),
    // No `distinct` on an array column — the areas in use are flattened below.
    prisma.insight.findMany({ select: { productAreas: true } }),
    prisma.insight.findMany({ select: { theme: true }, distinct: ["theme"] }),
    prisma.account.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.insight.findMany({
      where: { createdBy: { not: null } },
      select: { createdBy: true },
      distinct: ["createdBy"],
      orderBy: { createdBy: "asc" },
    }),
  ]);

  return NextResponse.json({
    areas: [...new Set(areas.flatMap((r) => r.productAreas))].filter(Boolean).sort(),
    themes: themes.map((r) => r.theme).filter(Boolean).sort(),
    clients: clients.map((r) => r.name),
    reporters: reporters.map((r) => r.createdBy as string).filter(Boolean),
    me: session?.user?.email ?? null,
  });
}
