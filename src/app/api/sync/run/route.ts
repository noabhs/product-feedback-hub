import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isOwner } from "@/lib/people";
import { prisma } from "@/lib/prisma";
import { isRunning, readSyncRun, type SyncRun } from "@/lib/sync-state";

/**
 * "Sync now": starts the daily feedback-sync routine on Claude's servers.
 *
 * Owner-only, checked here again rather than trusting that the button was
 * hidden. The routine's own API token lives only in these env vars and never
 * reaches the browser:
 *   SYNC_ROUTINE_ID     trig_… id of the cloud routine
 *   SYNC_ROUTINE_TOKEN  the token generated in the routine's API trigger panel
 */
const FIRE_VERSION = "2026-10-21";

async function owner() {
  const session = await auth();
  const email = session?.user?.email ?? null;
  return isOwner(email) ? (email as string) : null;
}

/** Current state, so the button can draw itself on page load. */
export async function GET() {
  if (!(await owner())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const run = await readSyncRun();
  return NextResponse.json({
    configured: Boolean(process.env.SYNC_ROUTINE_ID && process.env.SYNC_ROUTINE_TOKEN),
    running: isRunning(run),
    run,
  });
}

export async function POST() {
  const email = await owner();
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = process.env.SYNC_ROUTINE_ID?.trim();
  const token = process.env.SYNC_ROUTINE_TOKEN?.trim();
  if (!id || !token) {
    return NextResponse.json({ error: "Sync now isn't set up yet (SYNC_ROUTINE_ID / SYNC_ROUTINE_TOKEN)." }, { status: 503 });
  }

  // One run at a time — each click costs a full Claude session.
  const previous = await readSyncRun();
  if (isRunning(previous)) {
    return NextResponse.json({ error: "A sync is already running.", run: previous }, { status: 409 });
  }

  const res = await fetch(`https://api.anthropic.com/v1/claude_code/routines/${encodeURIComponent(id)}/fire`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "anthropic-version": FIRE_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({ text: `Started from the hub by ${email}.` }),
  });
  if (!res.ok) {
    console.error("[sync/run] fire failed", res.status, (await res.text()).slice(0, 300));
    const msg = res.status === 429 ? "Too many syncs started this hour — try again later." : `Claude couldn't start the sync (${res.status}).`;
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const fired = (await res.json()) as { claude_code_session_url?: string };
  const run: SyncRun = { firedAt: new Date().toISOString(), by: email, sessionUrl: fired.claude_code_session_url };
  const data = JSON.stringify(run);
  await prisma.feedbackSyncState.upsert({ where: { source: "run" }, create: { source: "run", data }, update: { data } });
  return NextResponse.json({ running: true, run });
}
