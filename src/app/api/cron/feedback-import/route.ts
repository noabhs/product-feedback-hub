import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEvent, ACTIONS } from "@/lib/events";
import { importFeedbackRows } from "@/lib/csv-import";

/**
 * Unattended push for the weekly Slack/Jira feedback sync.
 *
 * Same shape as /api/cron/weekly-recap: `/api/cron/*` is excluded from the
 * SSO proxy (src/proxy.ts), so a bearer secret is the only gate here — there
 * is no session to check. Deliberately a separate secret from CRON_SECRET
 * (which guards the recap) rather than reusing it, so the two can be
 * rotated independently.
 *
 * Row shape and upsert semantics are identical to POST /api/import with
 * `type: "feedback"` — same helper, same dedupe-by-(client, oneLiner)
 * upsert, same "won't overwrite an existing row" caveat.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.FEEDBACK_IMPORT_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "FEEDBACK_IMPORT_SECRET isn't set" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await req.json();
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
    }

    const before = await prisma.insight.count();
    const { imported, errors } = await importFeedbackRows(rows);
    const after = await prisma.insight.count();

    void logEvent(ACTIONS.csvImported, { label: `${imported} feedback rows via cron sync` });
    return NextResponse.json({ imported, errors, before, after, created: after - before });
  } catch (e) {
    console.error("[cron/feedback-import]", e);
    return NextResponse.json({ error: (e as Error).message ?? "Import failed" }, { status: 500 });
  }
}
