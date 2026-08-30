import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildWeeklyRecap } from "@/lib/weekly-recap";
import { recapMarkdown } from "@/lib/slack";

/**
 * The recap for a period, for the home page's toggle. Session-guarded: this is
 * hub data, and the page it feeds is already behind sign-in.
 *
 * withNarrative is off — the toggle would otherwise pay for a model call every
 * time someone flips between week and month.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = req.nextUrl.searchParams.get("period") === "month" ? "month" : "week";
  const recap = await buildWeeklyRecap(new Date(), { withNarrative: false, period });

  return NextResponse.json({
    weekLabel: recap.week.label,
    kind: recap.week.kind,
    entries: recap.entries,
    entriesPrev: recap.entriesPrev,
    clients: recap.clients,
    newClients: recap.newClients,
    topAreas: recap.topAreas,
    questions: recap.questions,
    asks: recap.asks,
    narrative: recap.narrative,
    themes: recap.themes,
    picks: recap.picks,
    mostClientsAreNew: recap.mostClientsAreNew,
    unrecognisedClients: recap.unrecognisedClients,
    markdown: recapMarkdown(recap),
  });
}
