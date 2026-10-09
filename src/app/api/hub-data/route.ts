import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/people";
import { logEvent, ACTIONS } from "@/lib/events";
import { HUB_DATA_SLUG } from "@/lib/hub-data-default";

/** Saves the Hub data page. Owner only — everyone else can read it, not change it. */
export async function PUT(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isOwner(email)) return NextResponse.json({ error: "Only the hub owner can edit this page" }, { status: 403 });

  const { body } = await req.json();
  if (typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "The page can't be empty" }, { status: 400 });
  }

  const saved = await prisma.pageContent.upsert({
    where: { slug: HUB_DATA_SLUG },
    create: { slug: HUB_DATA_SLUG, body, updatedBy: email },
    update: { body, updatedBy: email },
  });

  void logEvent(ACTIONS.hubDataEdited, { target: HUB_DATA_SLUG });
  return NextResponse.json({ body: saved.body, updatedAt: saved.updatedAt });
}
