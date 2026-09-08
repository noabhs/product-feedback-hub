import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { SectionHeading, MeterCard, ChartCard, BarRow } from "@/components/home/cards";
import { prisma } from "@/lib/prisma";
import { areaLabel, themeLabel, areaColor } from "@/lib/labels";
import { shortName } from "@/lib/people";
import { ADVISORS, HEALTH_ORDER, REPORT_AS_OF, matchAccount } from "@/lib/accounts";
import { loadAccounts } from "@/lib/accounts-db";
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

/**
 * Feedback data — client coverage, what's being said, and what's landed most
 * recently. Split from usage analytics because one answers "what are clients
 * telling us" and the other answers "who is using the hub."
 */
export async function DataAnalyticsTab() {
  const [byAreaRaw, byThemeRaw, feedbackByClient, recentRaw, accounts, matchable] = await Promise.all([
    // groupBy can't group by the elements of an array column, so the areas are
    // counted in memory below. 127 rows makes that a non-question.
    prisma.insight.findMany({ select: { productAreas: true } }),
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
      select: { id: true, oneLiner: true, productAreas: true, client: true, createdAt: true, createdBy: true },
    }),
    prisma.account.findMany({ select: { name: true, health: true, arr: true } }),
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

  // An entry spanning two areas counts once under each, so these total more than
  // the entry count — which is the point of the chart.
  const areaCounts = new Map<string, number>();
  for (const row of byAreaRaw) {
    for (const area of row.productAreas) areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
  }
  const byArea = [...areaCounts.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);

  const topClients = feedbackByClient.slice(0, 8);
  const maxArea = Math.max(...byArea.map((r) => r.count), 1);
  const maxTheme = Math.max(...byThemeRaw.map((r) => r._count.id), 1);
  const maxClient = Math.max(...topClients.map((r) => r._count.id), 1);

  return (
    <div>
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
          {byArea.map((r) => (
            <BarRow
              key={r.area}
              label={areaLabel(r.area)}
              count={r.count}
              pct={r.count / maxArea}
              color={areaColor(r.area)}
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
                  style={{ background: areaColor(r.productAreas[0] ?? "GENERAL") }}
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/insights?open=${r.id}`}>
                    <p className="text-[13px] text-brand-primary leading-snug line-clamp-2 hover:text-brand-secondary-500 transition-colors">
                      {r.oneLiner}
                    </p>
                  </Link>
                  <p className="text-[11px] text-brand-primary opacity-40 mt-0.5">
                    {r.productAreas.map(areaLabel).join(", ") || "No area"}
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
  );
}
