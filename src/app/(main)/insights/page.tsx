export const dynamic = "force-dynamic";

import { WeeklyRecapCard } from "@/components/home/WeeklyRecapCard";
import { buildWeeklyRecap } from "@/lib/weekly-recap";
import { recapMarkdown } from "@/lib/slack";
import { auth } from "@/auth";
import { isOwner } from "@/lib/people";
import FeedbackView from "./FeedbackView";

export default async function FeedbackPage() {
  // Reads a stored brief, never writes one. Generation belongs to the cron:
  // a page load must not be able to start a model call.
  const session = await auth();
  const recap = await buildWeeklyRecap(new Date(), { narrative: "cached" });

  return (
    <FeedbackView
      recap={
        <WeeklyRecapCard
          canSendToSlack={isOwner(session?.user?.email)}
          recap={{
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
          }}
        />
      }
    />
  );
}
