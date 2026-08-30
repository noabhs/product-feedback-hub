import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logEvent, ACTIONS } from "@/lib/events";
import { buildWeeklyRecap } from "@/lib/weekly-recap";
import { weeklyRecapBlocks, postToSlack } from "@/lib/slack";

/**
 * The Sunday recap.
 *
 * GET is for Vercel Cron, which sends `Authorization: Bearer $CRON_SECRET`. This
 * path is excluded from the auth proxy — the secret is what guards it, since a
 * cron request carries no session and would otherwise be bounced to sign-in.
 *
 * POST is the "Send to Slack now" button, guarded by a signed-in session
 * instead. It skips the already-posted check on purpose: if you press it, you
 * meant it.
 */

async function alreadyPosted(weekKey: string): Promise<boolean> {
  // Idempotency without a new table: cron can retry, and two identical recaps in
  // the channel is the failure everyone notices.
  const seen = await prisma.event.findFirst({
    where: { action: ACTIONS.recapPosted, target: weekKey },
    select: { id: true },
  });
  return Boolean(seen);
}

async function send(force: boolean, period: "week" | "month" = "week") {
  const recap = await buildWeeklyRecap(new Date(), { period });

  if (!force && (await alreadyPosted(recap.week.key))) {
    return NextResponse.json({ skipped: "already posted", week: recap.week.key });
  }

  const result = await postToSlack(
    weeklyRecapBlocks(recap),
    `${recap.week.kind === "month" ? "Month" : "Week"} of ${recap.week.label}: ${recap.entries} new feedback entries`,
  );

  if (!result.ok) {
    // 502, not 500: the hub did its part and Slack (or its config) did not.
    return NextResponse.json({ error: result.error, week: recap.week.key }, { status: 502 });
  }

  // Warm the month brief while we are here. Nothing else schedules it, so
  // without this the first person to open the month view pays for the call.
  if (period === "week") {
    void buildWeeklyRecap(new Date(), { period: "month" }).catch(() => {});
  }

  void logEvent(ACTIONS.recapPosted, {
    target: recap.week.key,
    label: `${recap.week.kind === "month" ? "Month" : "Week"} of ${recap.week.label} — ${recap.entries} entries`,
  });

  return NextResponse.json({
    posted: true,
    week: recap.week.key,
    entries: recap.entries,
    narrative: Boolean(recap.narrative),
  });
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET isn't set" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return send(false);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const period = req.nextUrl.searchParams.get("period") === "month" ? "month" : "week";
  return send(true, period);
}
