export const dynamic = "force-dynamic";

import { MessageSquare, Users, FileQuestion, Sparkles } from "lucide-react";
import { SectionHeading, KpiCard } from "@/components/home/cards";
import { WeeklyRecapCard } from "@/components/home/WeeklyRecapCard";
import { AskBox } from "@/components/home/AskBox";
import { buildWeeklyRecap } from "@/lib/weekly-recap";
import { recapMarkdown } from "@/lib/slack";
import { prisma } from "@/lib/prisma";
import { ADVISORS, matchAccount } from "@/lib/accounts";
import { loadAccounts } from "@/lib/accounts-db";

export default async function HomePage() {
  const [totalFeedback, totalQuestions, totalAsks, feedbackByClient, accounts, recap, matchable] =
    await Promise.all([
      prisma.insight.count(),
      prisma.discoveryQuestion.count(),
      prisma.askLog.count(),
      prisma.insight.groupBy({
        by: ["client"],
        where: { client: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.account.findMany({ select: { name: true, health: true, arr: true } }),
      // Reads a stored brief, never writes one. Generation belongs to the cron:
      // a page load must not be able to start a model call, which is how this
      // ended up hanging on a spinner nobody could cancel.
      buildWeeklyRecap(new Date(), { narrative: "cached" }),
      loadAccounts(),
    ]);

  // Keyed by the account each stored value resolves to, not by the raw string:
  // entries filed as "NOMS — Dr. Bower" belong to NOMS, and keying on the raw
  // value left those accounts reading as never heard from.
  const entriesByClient = new Map<string, number>();
  for (const row of feedbackByClient) {
    const name = matchAccount(row.client, matchable);
    if (name) entriesByClient.set(name, (entriesByClient.get(name) ?? 0) + row._count.id);
  }

  // Advisors is the internal advisory panel, not a client — it would otherwise
  // inflate every coverage figure below with feedback from our own people.
  const clients = accounts.filter((a) => a.name !== ADVISORS);
  const heardFrom = clients.filter((a) => (entriesByClient.get(a.name) ?? 0) > 0);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-7">
          <p className="text-[12px] font-semibold text-brand-secondary-500 uppercase tracking-wide mb-1.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-[30px] font-extrabold text-brand-primary mb-2 leading-tight">
            Navina Product Insights Hub
          </h1>
          <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
            Connect feedback across every source to uncover the insights that matter — spot patterns
            across clients, sharpen discovery, and turn scattered signals into product decisions.
          </p>
        </div>

        {/* ── Ask (coming soon) ──────────────────────────────────────────── */}
        <div className="mb-8">
          <AskBox />
        </div>

        {/* ── Last week ──────────────────────────────────────────────────── */}
        <WeeklyRecapCard
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

        {/* ── Overview ───────────────────────────────────────────────────── */}
        <SectionHeading title="Overview" />
        <div className="grid grid-cols-4 gap-4">
          <KpiCard value={totalFeedback} label="Feedback entries" sub="across every source" Icon={MessageSquare} href="/insights" />
          <KpiCard value={heardFrom.length} label="Clients heard from" sub={`of ${clients.length} accounts`} Icon={Users} href="/clients" />
          <KpiCard value={totalQuestions} label="Discovery questions" sub="in the library" Icon={FileQuestion} href="/discovery" />
          <KpiCard value={totalAsks} label="Questions asked" sub="of the feedback, by the team" Icon={Sparkles} href="/feedback-insights" />
        </div>
      </div>
    </div>
  );
}
