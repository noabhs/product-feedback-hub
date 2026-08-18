export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, MessageSquare, Users, FileQuestion, Sparkles, Building2 } from "lucide-react";
import { SectionHeading, KpiCard, MeterCard, ChartCard, BarRow } from "@/components/home/cards";
import { prisma } from "@/lib/prisma";
import { areaLabel, themeLabel, areaColor } from "@/lib/labels";
import { shortName } from "@/lib/people";
import { ADVISORS, HEALTH_ORDER, REPORT_AS_OF } from "@/lib/accounts";
import { fmtDay } from "@/lib/format";

/** Health is a traffic light, so it gets traffic-light colours rather than brand ones. */
const HEALTH_COLORS: Record<string, string> = {
  Red: "#dc2626",
  Yellow: "#d97706",
  Green: "#0F6E56",
};

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

export default async function HomePage() {
  const [
    totalFeedback,
    totalQuestions,
    totalAsks,
    byAreaRaw,
    byThemeRaw,
    feedbackByClient,
    recentRaw,
    accounts,
  ] = await Promise.all([
    prisma.insight.count(),
    prisma.discoveryQuestion.count(),
    prisma.askLog.count(),
    prisma.insight.groupBy({
      by: ["productArea"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.insight.groupBy({
      by: ["theme"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.insight.groupBy({
      by: ["client"],
      where: { client: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.insight.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, oneLiner: true, productArea: true, client: true, createdAt: true, createdBy: true },
    }),
    prisma.account.findMany({ select: { name: true, health: true, arr: true } }),
  ]);

  const entriesByClient = new Map(feedbackByClient.map((r) => [r.client as string, r._count.id]));

  // Advisors is the internal advisory panel, not a client — it would otherwise
  // inflate every coverage figure below with feedback from our own people.
  const clients = accounts.filter((a) => a.name !== ADVISORS);
  const heardFrom = clients.filter((a) => (entriesByClient.get(a.name) ?? 0) > 0);

  // ARR is deliberately never shown on this page — it only picks out which
  // accounts are paying, and orders them, without any figure reaching the UI.
  const paying = clients.filter((a) => a.arr !== null);

  const rated = clients.filter((a) => a.health);
  const healthMix = HEALTH_ORDER.map((health) => ({
    health,
    count: rated.filter((a) => a.health === health).length,
  }));

  // The gap worth acting on: paying accounts nobody has captured feedback from.
  const silent = paying
    .filter((a) => !entriesByClient.get(a.name))
    .sort((a, b) => (b.arr ?? 0) - (a.arr ?? 0))
    .slice(0, 6);

  const topClients = feedbackByClient.slice(0, 8);
  const maxArea = Math.max(...byAreaRaw.map((r) => r._count.id), 1);
  const maxTheme = Math.max(...byThemeRaw.map((r) => r._count.id), 1);
  const maxClient = Math.max(...topClients.map((r) => r._count.id), 1);

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

        {/* ── Overview ───────────────────────────────────────────────────── */}
        <SectionHeading title="Overview" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          <KpiCard value={totalFeedback} label="Feedback entries" sub="across every source" Icon={MessageSquare} href="/insights" />
          <KpiCard value={heardFrom.length} label="Clients heard from" sub={`of ${clients.length} accounts`} Icon={Users} href="/clients" />
          <KpiCard value={totalQuestions} label="Discovery questions" sub="in the library" Icon={FileQuestion} href="/discovery" />
          <KpiCard value={totalAsks} label="Questions asked" sub="of the feedback, by the team" Icon={Sparkles} href="/feedback-insights" />
        </div>

        {/* ── Client coverage ────────────────────────────────────────────── */}
        <SectionHeading title="Client coverage" note={`account data as of ${fmtDay(REPORT_AS_OF) ?? REPORT_AS_OF}`} />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <MeterCard
            Icon={Building2}
            value={`${heardFrom.length}/${clients.length}`}
            label="Accounts with feedback"
            sub={`${clients.length - heardFrom.length} have none yet`}
            pct={clients.length ? heardFrom.length / clients.length : 0}
            color="#5d07e2"
            href="/clients"
          />
          <ChartCard
            title="Account health"
            note={`${rated.length} accounts rated in the report`}
            href="/clients"
            linkLabel="Clients"
          >
            {healthMix.map((h) => (
              <BarRow
                key={h.health}
                label={h.health}
                count={h.count}
                pct={rated.length ? h.count / rated.length : 0}
                color={HEALTH_COLORS[h.health]}
                labelWidth="w-14"
              />
            ))}
          </ChartCard>
        </div>

        {silent.length > 0 && (
          <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5 mb-8">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[13px] font-semibold text-brand-primary">No feedback captured yet</h3>
              <Link href="/clients" className="text-[12px] text-brand-secondary-500 hover:underline flex items-center gap-1">
                All clients <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-[11px] text-brand-primary opacity-40 mb-4">
              Paying accounts with nothing on file, largest first
            </p>
            <div className="grid grid-cols-3 gap-x-5 gap-y-2">
              {silent.map((a) => (
                <div key={a.name} className="flex items-center gap-1.5 min-w-0">
                  {a.health && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: HEALTH_COLORS[a.health] }}
                      title={`${a.health} health`}
                    />
                  )}
                  <span className="text-[13px] text-brand-primary truncate" title={a.name}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── What we're hearing ─────────────────────────────────────────── */}
        <SectionHeading title="What we're hearing" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <ChartCard title="By product area" href="/insights">
            {byAreaRaw.map((r) => (
              <BarRow
                key={r.productArea}
                label={areaLabel(r.productArea)}
                count={r._count.id}
                pct={r._count.id / maxArea}
                color={areaColor(r.productArea)}
              />
            ))}
          </ChartCard>

          <ChartCard title="By theme" href="/insights">
            {byThemeRaw.map((r) => (
              <BarRow
                key={r.theme}
                label={themeLabel(r.theme)}
                count={r._count.id}
                pct={r._count.id / maxTheme}
                color="#73F6DB"
                textColor="#0F6E56"
              />
            ))}
          </ChartCard>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ChartCard title="Top clients by entries" href="/clients">
            {topClients.map((r) => (
              <BarRow
                key={r.client}
                label={r.client ?? ""}
                count={r._count.id}
                pct={r._count.id / maxClient}
                color="#5d07e2"
              />
            ))}
          </ChartCard>

          <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-brand-primary">Recently added</h2>
              <Link href="/insights" className="text-[12px] text-brand-secondary-500 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div>
              {recentRaw.map((r, i) => (
                <div
                  key={r.id}
                  className={`flex gap-3 py-2.5 ${i < recentRaw.length - 1 ? "border-b border-[rgba(50,43,95,0.06)]" : ""}`}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-[5px] shrink-0"
                    style={{ background: areaColor(r.productArea) }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link href={`/insights?open=${r.id}`}>
                      <p className="text-[13px] text-brand-primary leading-snug line-clamp-2 hover:text-brand-secondary-500 transition-colors">
                        {r.oneLiner}
                      </p>
                    </Link>
                    <p className="text-[11px] text-brand-primary opacity-40 mt-0.5">
                      {areaLabel(r.productArea)}
                      {r.client ? ` · ${r.client}` : ""}
                      {" · "}{fmtDate(r.createdAt)}
                      {" · "}{shortName(r.createdBy)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
