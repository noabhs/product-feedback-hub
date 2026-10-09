export const dynamic = "force-dynamic";

import Link from "next/link";
import { MessageSquare, Users, Swords, Sparkles, ArrowRight } from "lucide-react";
import { SectionHeading, KpiCard } from "@/components/home/cards";
import { QuickActions } from "@/components/home/QuickActions";
import { QAsk } from "@/components/home/QAsk";
import { auth } from "@/auth";
import { isOwner } from "@/lib/people";
import { prisma } from "@/lib/prisma";
import { ADVISORS, matchAccount } from "@/lib/accounts";
import { loadAccounts } from "@/lib/accounts-db";

/** The week the two "this week" figures count back over. */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function HomePage() {
  const session = await auth();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - WEEK_MS);
  const [
    totalFeedback, totalCompetitors, totalAsks, feedbackByClient, accounts, matchable,
    feedbackThisWeek, asksThisWeek, latest,
  ] =
    await Promise.all([
      prisma.insight.count(),
      prisma.competitor.count(),
      prisma.askLog.count(),
      prisma.insight.groupBy({
        by: ["client"],
        where: { client: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.account.findMany({ select: { name: true, health: true, arr: true } }),
      loadAccounts(),
      prisma.insight.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.askLog.count({ where: { createdAt: { gte: weekAgo } } }),
      // Five rows, titles only — enough to show the hub is alive without
      // turning the home page into a second feedback table.
      prisma.insight.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, oneLiner: true, client: true, createdAt: true },
      }),
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
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-7">
          <p className="text-[12px] font-semibold text-brand-secondary-500 uppercase tracking-wide mb-1.5">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-[30px] font-extrabold text-brand-primary mb-2 leading-tight">
            Navina Product Insights Hub
          </h1>
          <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
            Connect feedback across every source to uncover the insights that matter — spot patterns
            across clients, sharpen discovery, and turn scattered signals into product decisions.
          </p>
        </div>

        {/* ── Ask ─────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <QAsk canSendToSlack={isOwner(session?.user?.email)} />
        </div>

        {/* ── Quick actions ──────────────────────────────────────────────── */}
        <SectionHeading title="Quick actions" />
        <div className="mb-8">
          <QuickActions canSendToSlack={isOwner(session?.user?.email)} />
        </div>

        {/* ── Overview ───────────────────────────────────────────────────── */}
        <SectionHeading title="Overview" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            value={totalFeedback}
            label="Feedback entries"
            sub={feedbackThisWeek ? `+${feedbackThisWeek} in the last 7 days` : "across every source"}
            Icon={MessageSquare}
            href="/insights"
          />
          <KpiCard value={heardFrom.length} label="Clients heard from" sub={`of ${clients.length} accounts`} Icon={Users} href="/clients" />
          <KpiCard value={totalCompetitors} label="Competitors" sub="tracked in the hub" Icon={Swords} href="/competitors" />
          <KpiCard
            value={totalAsks}
            label="Questions asked"
            sub={asksThisWeek ? `+${asksThisWeek} in the last 7 days` : "of the feedback, by the team"}
            Icon={Sparkles}
            href="/analytics?tab=asks"
          />
        </div>

        {/* ── Latest feedback ────────────────────────────────────────────── */}
        {latest.length > 0 && (
          <div className="mt-8">
            <SectionHeading title="Latest feedback" />
            <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] divide-y divide-[rgba(50,43,95,0.06)]">
              {latest.map((e) => (
                <Link
                  key={e.id}
                  href={`/insights/${e.id}`}
                  className="group flex items-center gap-3 px-5 py-3 hover:bg-[rgba(93,7,226,0.03)] transition-colors"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] text-brand-primary truncate group-hover:text-brand-secondary-600">
                      {e.oneLiner}
                    </span>
                    {e.client && (
                      <span className="block text-[12px] text-brand-secondary-600/80 truncate">{e.client}</span>
                    )}
                  </span>
                  <span className="text-[11.5px] text-brand-primary/40 whitespace-nowrap">
                    {e.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
              <Link
                href="/insights"
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-[12px] font-medium text-brand-secondary-600 hover:bg-[rgba(93,7,226,0.03)] transition-colors"
              >
                All {totalFeedback.toLocaleString("en-US")} entries
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
