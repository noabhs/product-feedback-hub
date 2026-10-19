import { NextRequest, NextResponse } from "next/server";
import { readCompetitorWeeklyBrief, writeCompetitorWeeklyBrief } from "@/lib/competitor-weekly-brief";

/** Web search is several model turns; the default limit is too short. */
export const maxDuration = 120;

/**
 * The Sunday competitor brief, written half an hour after the feedback recap.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; /api/cron/* skips the
 * sign-in proxy, so the secret is the only guard. Nothing is posted anywhere —
 * the brief is stored and shown on /competitors.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "CRON_SECRET isn't set" }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cron can retry; a completed week is final, so an existing brief is kept.
  const { week, brief: existing } = await readCompetitorWeeklyBrief();
  if (existing) return NextResponse.json({ skipped: "already written", week: week.key });

  try {
    const brief = await writeCompetitorWeeklyBrief();
    return NextResponse.json({ written: true, week: brief.weekKey, quiet: brief.markdown === null });
  } catch (e) {
    console.error("[cron/competitor-weekly-brief]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
