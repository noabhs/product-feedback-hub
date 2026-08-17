export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, MessageSquare, Users, FileQuestion, Layers } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { areaLabel, themeLabel, areaColor } from "@/lib/labels";
import { shortName } from "@/lib/people";


function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

export default async function HomePage() {
  const [
    totalFeedback,
    totalQuestions,
    byAreaRaw,
    byThemeRaw,
    topClientsRaw,
    recentRaw,
    clientRows,
  ] = await Promise.all([
    prisma.insight.count(),
    prisma.discoveryQuestion.count(),
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
      take: 8,
    }),
    prisma.insight.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, oneLiner: true, productArea: true, client: true, createdAt: true, createdBy: true },
    }),
    prisma.insight.findMany({
      where: { client: { not: null } },
      select: { client: true },
      distinct: ["client"],
    }),
  ]);

  const totalClients = clientRows.length;
  const maxArea = Math.max(...byAreaRaw.map((r) => r._count.id), 1);
  const maxTheme = Math.max(...byThemeRaw.map((r) => r._count.id), 1);
  const maxClient = Math.max(...topClientsRaw.map((r) => r._count.id), 1);

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold text-brand-primary mb-2">Navina Product Insights Hub</h1>
          <p className="text-[15px] text-brand-primary leading-relaxed max-w-2xl" style={{ opacity: 0.65 }}>
            A single source of truth for all product feedback — aggregated from Drive, Notion, Jira, call notes, onsites, and more.
            Use it to surface patterns across clients, prepare for discovery calls, and get the most out of every feedback session.
          </p>
          <p className="text-[13px] text-brand-primary opacity-35 mt-2">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard value={totalFeedback} label="Feedback entries" sub="from client sessions" Icon={MessageSquare} href="/insights" />
          <KpiCard value={totalClients} label="Clients covered" sub="unique organizations" Icon={Users} href="/insights" />
          <KpiCard value={totalQuestions} label="Discovery questions" sub="in the library" Icon={FileQuestion} href="/discovery" />
          <KpiCard value={byAreaRaw.length} label="Product areas" sub="with coverage" Icon={Layers} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <ChartCard title="Feedback by product area">
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

          <ChartCard title="Top clients by entries">
            {topClientsRaw.map((r) => (
              <BarRow
                key={r.client}
                label={r.client ?? ""}
                count={r._count.id}
                pct={r._count.id / maxClient}
                color="#5d07e2"
              />
            ))}
          </ChartCard>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-5">
          {/* Recent activity */}
          <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-semibold text-brand-primary">Recently added</h2>
              <Link
                href="/insights"
                className="text-[12px] text-brand-secondary-500 hover:underline flex items-center gap-1"
              >
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
                    <Link href={`/insights/${r.id}`}>
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

          {/* By theme */}
          <ChartCard title="Feedback by theme">
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
      </div>
    </div>
  );
}

function KpiCard({
  value, label, sub, Icon, href,
}: {
  value: number;
  label: string;
  sub: string;
  Icon: React.FC<{ className?: string }>;
  href?: string;
}) {
  const inner = (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5 h-full group hover:border-brand-secondary-500/30 hover:shadow-sm transition-all">
      <Icon className="w-5 h-5 text-brand-primary opacity-30 mb-3 group-hover:opacity-60 transition-opacity" />
      <div className="text-[32px] font-extrabold text-brand-primary leading-none mb-1">{value}</div>
      <div className="text-[13px] font-medium text-brand-primary">{label}</div>
      <div className="text-[11px] text-brand-primary opacity-40 mt-0.5">{sub}</div>
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : <div>{inner}</div>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5">
      <h2 className="text-[14px] font-semibold text-brand-primary mb-4">{title}</h2>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function BarRow({
  label, count, pct, color, textColor,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
  textColor?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-brand-primary opacity-60 w-28 shrink-0 text-right truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 h-2 bg-[rgba(50,43,95,0.06)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(Math.round(pct * 100), 3)}%`, background: color }}
        />
      </div>
      <span className="text-[12px] w-6 text-right shrink-0" style={{ color: textColor ?? "rgba(50,43,95,0.4)" }}>
        {count}
      </span>
    </div>
  );
}
