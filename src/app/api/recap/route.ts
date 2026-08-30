import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildWeeklyRecap } from "@/lib/weekly-recap";
import { recapMarkdown } from "@/lib/slack";

/** The brief is a model call; the default function limit is too short for it. */
export const maxDuration = 60;

/**
 * The recap for a period, for the home page. Session-guarded: this is hub data,
 * and the page it feeds is already behind sign-in.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = req.nextUrl.searchParams.get("period") === "month" ? "month" : "week";
  // Read-only where the brief is concerned. This endpoint serves the home
  // page's period toggle, and no page request may start a model call.
  const recap = await buildWeeklyRecap(new Date(), { narrative: "cached", period });

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
    narrativeError: recap.narrativeError,
    themes: recap.themes,
    picks: recap.picks,
    mostClientsAreNew: recap.mostClientsAreNew,
    unrecognisedClients: recap.unrecognisedClients,
    markdown: recapMarkdown(recap),
  });
}
