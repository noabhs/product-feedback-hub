export const dynamic = "force-dynamic";

import { Activity, Users, Sparkles, Eye, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ACTION_LABELS, AI_ACTIONS, ACTIONS } from "@/lib/events";
import { shortName } from "@/lib/people";
import { EventLog, type EventRow } from "@/components/analytics/EventLog";

const WINDOW_DAYS = 30;
const TREND_DAYS = 14;
/** Cap the log query so a very chatty month can't blow up the page. */
const LOG_LIMIT = 600;

const WRITE_ACTIONS = new Set<string>(
  Object.values(ACTIONS).filter((a) => a !== ACTIONS.pageView && !AI_ACTIONS.includes(a))
);

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * All querying and aggregation lives here rather than in the component so that
 * reading the clock isn't a render-time side effect.
 */
async function loadAnalytics() {
  const now = Date.now();
  const since = new Date(now - WINDOW_DAYS * 86400_000);

  const [events, totalEvents, firstEvent, insightCount, questionCount] = await Promise.all([
    prisma.event.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, actor: true, action: true, label: true, target: true, createdAt: true },
    }),
    prisma.event.count(),
    prisma.event.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.insight.count(),
    prisma.discoveryQuestion.count(),
  ]);

  // ── Aggregates, all derived from the one query above.
  const sevenDaysAgo = now - 7 * 86400_000;
  const activePeople = new Set(
    events.filter((e) => e.createdAt.getTime() >= sevenDaysAgo).map((e) => e.actor)
  );
  const aiCalls = events.filter((e) => AI_ACTIONS.includes(e.action));
  const pageViews = events.filter((e) => e.action === ACTIONS.pageView);
  const writes = events.filter((e) => WRITE_ACTIONS.has(e.action));

  // Daily trend, split into views vs everything else so a busy day is legible.
  const trend: { key: string; label: string; views: number; actions: number }[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400_000);
    trend.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: 0,
      actions: 0,
    });
  }
  const trendByKey = new Map(trend.map((t) => [t.key, t]));
  for (const e of events) {
    const bucket = trendByKey.get(dayKey(e.createdAt));
    if (!bucket) continue;
    if (e.action === ACTIONS.pageView) bucket.views++;
    else bucket.actions++;
  }
  const maxDay = Math.max(...trend.map((t) => t.views + t.actions), 1);

  // Per-person rollup.
  type Person = { actor: string; total: number; writes: number; ai: number; views: number; last: Date };
  const peopleMap = new Map<string, Person>();
  for (const e of events) {
    const p =
      peopleMap.get(e.actor) ??
      { actor: e.actor, total: 0, writes: 0, ai: 0, views: 0, last: e.createdAt };
    p.total++;
    if (e.action === ACTIONS.pageView) p.views++;
    else if (AI_ACTIONS.includes(e.action)) p.ai++;
    else p.writes++;
    if (e.createdAt > p.last) p.last = e.createdAt;
    peopleMap.set(e.actor, p);
  }
  const people = [...peopleMap.values()].sort((a, b) => b.total - a.total);
  const contributors = people.filter((p) => p.writes > 0 || p.ai > 0).length;
  const viewersOnly = people.length - contributors;

  // Action breakdown (page views excluded — they'd swamp everything else).
  const actionCounts = new Map<string, number>();
  for (const e of events) {
    if (e.action === ACTIONS.pageView) continue;
    actionCounts.set(e.action, (actionCounts.get(e.action) ?? 0) + 1);
  }
  const topActions = [...actionCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxAction = Math.max(...topActions.map(([, n]) => n), 1);

  // Most-visited pages.
  const pageCounts = new Map<string, number>();
  for (const e of pageViews) {
    const name = e.label ?? e.target ?? "Unknown";
    pageCounts.set(name, (pageCounts.get(name) ?? 0) + 1);
  }
  const topPages = [...pageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxPage = Math.max(...topPages.map(([, n]) => n), 1);

  const logRows: EventRow[] = events.slice(0, LOG_LIMIT).map((e) => ({
    id: e.id,
    actor: e.actor,
    action: e.action,
    label: e.label,
    target: e.target,
    createdAt: e.createdAt.toISOString(),
  }));

  return {
    eventCount: events.length,
    totalEvents,
    firstEvent,
    insightCount,
    questionCount,
    activeCount: activePeople.size,
    aiCount: aiCalls.length,
    viewCount: pageViews.length,
    writeCount: writes.length,
    trend,
    maxDay,
    people,
    contributors,
    viewersOnly,
    topActions,
    maxAction,
    topPages,
    maxPage,
    logRows,
  };
}

export default async function AnalyticsPage() {
  const {
    eventCount,
    totalEvents,
    firstEvent,
    insightCount,
    questionCount,
    activeCount,
    aiCount,
    viewCount,
    writeCount,
    trend,
    maxDay,
    people,
    contributors,
    viewersOnly,
    topActions,
    maxAction,
    topPages,
    maxPage,
    logRows,
  } = await loadAnalytics();

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold text-brand-primary mb-2">Analytics</h1>
          <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
            How the hub is actually being used — who is contributing, what they are doing, and which
            parts of the app earn their keep. Last {WINDOW_DAYS} days.
          </p>
        </div>

        {/* Visibility note — everyone can see everyone's activity, so say so plainly. */}
        <div className="flex items-start gap-2.5 mb-6 rounded-lg border border-[rgba(50,43,95,0.1)] bg-[rgba(93,7,226,0.03)] px-4 py-3">
          <Info className="w-4 h-4 text-brand-secondary-600 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-brand-primary opacity-70 leading-relaxed">
            This page is visible to everyone signed in with a Navina account, and it names
            individuals. It exists to show adoption, not to grade anyone.
            {firstEvent
              ? ` Logging started ${firstEvent.createdAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}, so activity before then isn't here.`
              : " Nothing has been logged yet — numbers will fill in as people use the app."}
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <Kpi value={eventCount} label="Events" sub={`last ${WINDOW_DAYS} days`} Icon={Activity} />
          <Kpi value={activeCount} label="Active people" sub="last 7 days" Icon={Users} />
          <Kpi value={aiCount} label="AI calls" sub="shared credits" Icon={Sparkles} />
          <Kpi value={viewCount} label="Page views" sub={`${writeCount} edits`} Icon={Eye} />
        </div>

        {/* Activity over time */}
        <Card title="Activity" subtitle={`Last ${TREND_DAYS} days · actions vs page views`} className="mb-5">
          <div className="flex items-stretch gap-1.5 h-32 mt-2">
            {trend.map((t) => {
              const total = t.views + t.actions;
              return (
                // h-full matters: the bar's percentage height needs a definite
                // parent height to resolve against.
                <div
                  key={t.key}
                  className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group"
                >
                  <span className="text-[10px] text-brand-primary opacity-0 group-hover:opacity-60 transition-opacity tabular-nums">
                    {total || ""}
                  </span>
                  <div
                    className="w-full flex flex-col justify-end rounded-sm overflow-hidden"
                    style={{ height: `${Math.max((total / maxDay) * 100, total ? 3 : 0)}%` }}
                    title={`${t.label}: ${t.actions} actions, ${t.views} views`}
                  >
                    <div style={{ flex: t.actions || 0, background: "#5d07e2", minHeight: t.actions ? 2 : 0 }} />
                    <div style={{ flex: t.views || 0, background: "#00c2b2", minHeight: t.views ? 2 : 0 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[rgba(50,43,95,0.06)]">
            <Legend color="#5d07e2" label="Actions (adds, edits, AI)" />
            <Legend color="#00c2b2" label="Page views" />
            <span className="text-[11px] text-brand-primary opacity-35 ml-auto">
              {trend[0].label} → {trend[trend.length - 1].label}
            </span>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5 mb-5">
          {/* Who is doing what */}
          <Card
            title="People"
            subtitle={`${contributors} contributing · ${viewersOnly} only looking`}
          >
            {people.length === 0 ? (
              <Empty />
            ) : (
              <table className="w-full mt-1">
                <thead>
                  <tr className="text-[10.5px] uppercase tracking-wide text-brand-primary opacity-40">
                    <th className="text-left font-semibold pb-1.5">Person</th>
                    <th className="text-right font-semibold pb-1.5">Edits</th>
                    <th className="text-right font-semibold pb-1.5">AI</th>
                    <th className="text-right font-semibold pb-1.5">Views</th>
                    <th className="text-right font-semibold pb-1.5">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {people.slice(0, 10).map((p) => (
                    <tr key={p.actor} className="border-t border-[rgba(50,43,95,0.06)]">
                      <td className="py-2 text-[13px] font-medium text-brand-primary" title={p.actor}>
                        {shortName(p.actor)}
                      </td>
                      <td className="py-2 text-[13px] text-right tabular-nums text-brand-primary opacity-70">
                        {p.writes}
                      </td>
                      <td className="py-2 text-[13px] text-right tabular-nums text-brand-primary opacity-70">
                        {p.ai}
                      </td>
                      <td className="py-2 text-[13px] text-right tabular-nums text-brand-primary opacity-70">
                        {p.views}
                      </td>
                      <td className="py-2 text-[11.5px] text-right text-brand-primary opacity-45 whitespace-nowrap">
                        {p.last.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* What gets done */}
          <Card title="What people do" subtitle="Page views excluded">
            {topActions.length === 0 ? (
              <Empty />
            ) : (
              topActions.map(([action, n]) => (
                <Bar
                  key={action}
                  label={ACTION_LABELS[action] ?? action}
                  count={n}
                  pct={n / maxAction}
                  color={AI_ACTIONS.includes(action) ? "#00c2b2" : "#5d07e2"}
                />
              ))
            )}
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-5">
          {/* Where people go */}
          <Card title="Most-visited pages" subtitle={`${viewCount} views`}>
            {topPages.length === 0 ? (
              <Empty />
            ) : (
              topPages.map(([name, n]) => (
                <Bar key={name} label={name} count={n} pct={n / maxPage} color="#00c2b2" />
              ))
            )}
          </Card>

          {/* Library size in context */}
          <Card title="What's in the hub" subtitle="All time, not just this window">
            <div className="grid grid-cols-2 gap-4 mt-1">
              <Stat value={insightCount} label="Feedback entries" />
              <Stat value={questionCount} label="Discovery questions" />
              <Stat value={writeCount} label={`Added or edited in ${WINDOW_DAYS}d`} />
              <Stat value={totalEvents} label="Events logged, all time" />
            </div>
            <p className="text-[11.5px] text-brand-primary opacity-40 mt-4 leading-relaxed">
              AI calls draw on the shared Anthropic organisation credits. Exact spend lives in the
              Anthropic console — this page counts calls, not dollars.
            </p>
          </Card>
        </div>

        <EventLog events={logRows} />
      </div>
    </div>
  );
}

/* ── Presentational helpers, kept local to this page. ─────────────────── */

function Kpi({
  value,
  label,
  sub,
  Icon,
}: {
  value: number;
  label: string;
  sub: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-4">
      <div className="flex items-start justify-between">
        <p className="text-[26px] font-extrabold text-brand-primary leading-none tabular-nums">
          {value.toLocaleString()}
        </p>
        <Icon className="w-4 h-4 text-brand-secondary-500 opacity-60" />
      </div>
      <p className="text-[13px] font-medium text-brand-primary mt-2">{label}</p>
      <p className="text-[11.5px] text-brand-primary opacity-40">{sub}</p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5 ${className ?? ""}`}>
      <div className="mb-3">
        <h2 className="text-[14px] font-semibold text-brand-primary">{title}</h2>
        {subtitle && <p className="text-[11.5px] text-brand-primary opacity-40 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Bar({
  label,
  count,
  pct,
  color,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-[12.5px] text-brand-primary truncate" title={label}>
          {label}
        </span>
        <span className="text-[12px] text-brand-primary opacity-45 tabular-nums shrink-0">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[rgba(50,43,95,0.06)] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(pct * 100, 2)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-[20px] font-bold text-brand-primary leading-none tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="text-[11.5px] text-brand-primary opacity-45 mt-1 leading-snug">{label}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-brand-primary opacity-50">
      <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function Empty() {
  return <p className="text-[12.5px] text-brand-primary opacity-40 py-4">Nothing logged yet.</p>;
}
