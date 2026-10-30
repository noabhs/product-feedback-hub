import { NextRequest, NextResponse } from "next/server";

/**
 * Bearer gate for the unattended feedback sync's routes under /api/cron/*.
 * Those paths skip the SSO proxy, so this is the only check — same secret as
 * /api/cron/feedback-import, which the routine already holds.
 * Returns a response to send back when the request is not allowed, else null.
 */
export function requireSyncSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.FEEDBACK_IMPORT_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "FEEDBACK_IMPORT_SECRET isn't set" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
