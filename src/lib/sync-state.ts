import { prisma } from "@/lib/prisma";

/** The three rows of FeedbackSyncState. */
export const SYNC_SOURCES = ["slack", "jira", "run"] as const;
export type SyncSource = (typeof SYNC_SOURCES)[number];

export function isSyncSource(s: string): s is SyncSource {
  return (SYNC_SOURCES as readonly string[]).includes(s);
}

/** State of the last "Sync now" click, stored under source "run". */
export type SyncRun = {
  firedAt: string;
  by: string;
  sessionUrl?: string;
  /** Set by the routine as its last step; absent while a run is in flight or if it died. */
  finishedAt?: string;
};

/** A run that never reports back (crashed, cancelled) stops blocking the button after this. */
const STALE_AFTER_MS = 45 * 60_000;

export async function readSyncRun(): Promise<SyncRun | null> {
  const row = await prisma.feedbackSyncState.findUnique({ where: { source: "run" } });
  if (!row) return null;
  try {
    return JSON.parse(row.data) as SyncRun;
  } catch {
    return null;
  }
}

export function isRunning(run: SyncRun | null, now = Date.now()): boolean {
  if (!run) return false;
  const fired = Date.parse(run.firedAt);
  if (Number.isNaN(fired) || now - fired > STALE_AFTER_MS) return false;
  return !run.finishedAt || Date.parse(run.finishedAt) < fired;
}
