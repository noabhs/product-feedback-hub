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
  // The AI brief is opt-in per request: the page renders immediately without it
  // and asks for it straight after, so a cache miss costs a spinner in one card
  // rather than several seconds of blank page.
  const withNarrative = req.nextUrl.searchParams.get("narrative") === "1";
  const recap = await buildWeeklyRecap(new Date(), { withNarrative, period });

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
