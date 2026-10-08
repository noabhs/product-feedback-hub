import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isOwner } from "@/lib/people";
import { logEvent, ACTIONS } from "@/lib/events";
import { buildWeeklyRecap } from "@/lib/weekly-recap";
import { weeklyRecapBlocks, postToSlack, postDmToUser } from "@/lib/slack";

/** The brief is a model call; the default function limit is too short for it. */
export const maxDuration = 60;

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

async function send(force: boolean, period: "week" | "month" = "week", dmEmail?: string) {
  const recap = await buildWeeklyRecap(new Date(), { period });

  if (!dmEmail && !force && (await alreadyPosted(recap.week.key))) {
    return NextResponse.json({ skipped: "already posted", week: recap.week.key });
  }

  // The month brief has no schedule of its own, and page loads no longer
  // generate anything, so this is the only thing that ever writes it. Awaited,
  // not fired and forgotten: a serverless function stops executing the moment
  // it responds, so a floating promise here would simply never finish.
  if (period === "week") {
    try {
      await buildWeeklyRecap(new Date(), { period: "month" });
    } catch (e) {
      console.error("[recap] month brief failed:", (e as Error).message);
    }
  }

  const fallbackText = `${recap.week.kind === "month" ? "Monthly" : "Weekly"} brief · ${recap.week.label}: ${recap.entries} new feedback entries`;

  // A DM is a personal preview, not the week's official post — it must not
  // satisfy alreadyPosted, or pressing the button once would make the real
  // Sunday cron skip the channel entirely.
  if (dmEmail) {
    const result = await postDmToUser(dmEmail, weeklyRecapBlocks(recap), fallbackText);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          week: recap.week.key,
          narrative: Boolean(recap.narrative),
          narrativeError: recap.narrativeError,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({
      posted: true,
      dm: true,
      week: recap.week.key,
      entries: recap.entries,
      narrative: Boolean(recap.narrative),
      narrativeError: recap.narrativeError,
    });
  }

  // No webhook configured means posting is somebody else's job — a scheduled
  // task reading /api/cron/recap-text, in the current setup. Generation still
  // happened above, so this is a success, not the weekly failure it used to
  // report.
  if (!process.env.SLACK_WEBHOOK_URL?.trim()) {
    void logEvent(ACTIONS.recapPosted, {
      target: recap.week.key,
      label: `${recap.week.label} — brief written, no webhook so nothing posted`,
    });
    return NextResponse.json({
      posted: false,
      reason: "No SLACK_WEBHOOK_URL — brief written and cached; posting is handled elsewhere.",
      week: recap.week.key,
      narrative: Boolean(recap.narrative),
      narrativeError: recap.narrativeError,
    });
  }

  const result = await postToSlack(weeklyRecapBlocks(recap), fallbackText);

  if (!result.ok) {
    // 502, not 500: the hub did its part and Slack (or its config) did not.
    //
    // The brief is written before the post is attempted, so report what
    // happened to it either way. Returning only the Slack error hid the answer
    // to the question this endpoint was being pressed to answer.
    return NextResponse.json(
      {
        error: result.error,
        week: recap.week.key,
        narrative: Boolean(recap.narrative),
        narrativeError: recap.narrativeError,
      },
      { status: 502 },
    );
  }

  void logEvent(ACTIONS.recapPosted, {
    target: recap.week.key,
    label: `${recap.week.kind === "month" ? "Monthly" : "Weekly"} brief · ${recap.week.label} — ${recap.entries} entries`,
  });

  return NextResponse.json({
    posted: true,
    week: recap.week.key,
    entries: recap.entries,
    narrative: Boolean(recap.narrative),
    narrativeError: recap.narrativeError,
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
  // The button is owner-only for now; keep the endpoint in step with it.
  if (!isOwner(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const period = req.nextUrl.searchParams.get("period") === "month" ? "month" : "week";
  // "Send to Slack" now previews to the signed-in user's own DM rather than
  // the shared channel — the real weekly post still only happens from the
  // Sunday cron's GET above.
  return send(true, period, session.user.email);
}
