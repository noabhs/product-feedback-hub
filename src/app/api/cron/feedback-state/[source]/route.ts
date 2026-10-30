import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSyncSecret } from "@/lib/sync-auth";
import { isSyncSource } from "@/lib/sync-state";

/**
 * The feedback sync's memory (slack.json, jira.json) and its "Sync now" run
 * marker, kept in the database so the sync can run in the cloud instead of
 * on one Mac. GET returns the stored JSON (or `null` if nothing is stored yet);
 * PUT replaces it. The sync only PUTs after a successful import, so a failed
 * run leaves the old state in place and the next run re-reads the same posts.
 */
const MAX_BYTES = 4_000_000; // Vercel rejects request bodies over 4.5 MB

type Ctx = { params: Promise<{ source: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = requireSyncSecret(req);
  if (denied) return denied;
  const { source } = await params;
  if (!isSyncSource(source)) return NextResponse.json({ error: "Unknown source" }, { status: 404 });

  const row = await prisma.feedbackSyncState.findUnique({ where: { source } });
  return new NextResponse(row?.data ?? "null", { headers: { "content-type": "application/json" } });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = requireSyncSecret(req);
  if (denied) return denied;
  const { source } = await params;
  if (!isSyncSource(source)) return NextResponse.json({ error: "Unknown source" }, { status: 404 });

  const text = await req.text();
  if (text.length > MAX_BYTES) {
    return NextResponse.json({ error: "State is too large to store" }, { status: 413 });
  }
  try {
    JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  await prisma.feedbackSyncState.upsert({
    where: { source },
    create: { source, data: text },
    update: { data: text },
  });
  return NextResponse.json({ ok: true, bytes: text.length });
}
