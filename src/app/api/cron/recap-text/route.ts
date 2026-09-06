import { NextRequest, NextResponse } from "next/server";
import { buildWeeklyRecap } from "@/lib/weekly-recap";
import { recapMarkdown, toStandardMarkdown } from "@/lib/slack";

export const maxDuration = 30;

/**
 * The finished recap as Slack-ready text, for a machine that isn't a browser.
 *
 * Lives under /api/cron/* so it sits outside the sign-in gate along with the
 * other machine endpoints, and is guarded by RECAP_READ_TOKEN instead. That is a
 * separate secret from CRON_SECRET on purpose: this one ends up in a scheduled
 * task's definition, which is a looser place than a Vercel environment variable,
 * so it should not also be able to trigger a post.
 *
 * Read-only — it never calls the model. The Sunday cron writes the brief; this
 * hands over whatever is written. If the brief is missing, `hasBrief` says so and
 * the text still carries the numbers and the cross-client themes.
 */
export async function GET(req: NextRequest) {
  const token = process.env.RECAP_READ_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "RECAP_READ_TOKEN isn't set on the server" }, { status: 500 });
  }

  const supplied =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ??
    req.nextUrl.searchParams.get("token")?.trim();
  if (supplied !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get("period") === "month" ? "month" : "week";
  // "slack" is webhook mrkdwn; "standard" is what a client posting through the
  // Slack API's markdown mode needs.
  const standard = req.nextUrl.searchParams.get("format") === "standard";
  const recap = await buildWeeklyRecap(new Date(), { narrative: "cached", period });

  return NextResponse.json({
    period,
    week: recap.week.label,
    entries: recap.entries,
    clients: recap.clients.length,
    hasBrief: Boolean(recap.narrative),
    markdown: standard ? toStandardMarkdown(recapMarkdown(recap)) : recapMarkdown(recap),
  });
}
