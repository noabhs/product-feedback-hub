import { prisma } from "@/lib/prisma";
import { areaLabel } from "@/lib/labels";
import { summarizeWeek } from "@/lib/claude";
import {
  lastCompleteWeek, previousWeek, monthToDate, previousMonth,
  type WeekWindow, type PeriodKind,
} from "@/lib/week";

export interface RecapPick {
  id: string;
  oneLiner: string;
  client: string | null;
  areas: string[];
}

export interface WeeklyRecap {
  /** The period the numbers cover — a week, or a month to date. */
  week: WeekWindow;
  previousLabel: string;
  entries: number;
  entriesPrev: number;
  /** Clients heard from during the week. */
  clients: string[];
  /** Of those, the ones with no feedback on file before this week. */
  newClients: string[];
  topAreas: { area: string; label: string; count: number }[];
  questions: number;
  asks: number;
  /**
   * Claude's read of the week. Null when no server-side key is configured or the
   * call failed — the recap still goes out, using `picks` instead.
   */
  narrative: string | null;
  /** Entries worth quoting: commented-on first, then newest. */
  picks: RecapPick[];
}

/**
 * Counted by createdAt, not the feedback's own date: this is a recap of what
 * landed in the hub during the period, not of when the conversations happened.
 *
 * `period` is "week" — the last complete Sunday–Saturday — or "month", the
 * calendar month so far. The month view exists because a weekly cadence started
 * cold reports on one week and ignores everything already in the hub.
 */
export async function buildWeeklyRecap(
  now: Date = new Date(),
  { withNarrative = true, period = "week" }: { withNarrative?: boolean; period?: PeriodKind } = {},
): Promise<WeeklyRecap> {
  const week = period === "month" ? monthToDate(now) : lastCompleteWeek(now);
  const prev = period === "month" ? previousMonth(week) : previousWeek(week);
  const inWeek = { gte: week.start, lt: week.end };

  const [entries, entriesPrev, questions, asks] = await Promise.all([
    prisma.insight.findMany({
      where: { createdAt: inWeek },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        oneLiner: true,
        content: true,
        client: true,
        productAreas: true,
        persona: true,
        _count: { select: { comments: true } },
      },
    }),
    prisma.insight.count({ where: { createdAt: { gte: prev.start, lt: prev.end } } }),
    prisma.discoveryQuestion.count({ where: { createdAt: inWeek } }),
    prisma.askLog.count({ where: { createdAt: inWeek } }),
  ]);

  const clients = [...new Set(entries.map((e) => e.client).filter((c): c is string => !!c))].sort();

  // "First time" means nothing on file before this week — the interesting case,
  // and worth a name-check in the post.
  const priorCounts = await Promise.all(
    clients.map((client) =>
      prisma.insight.count({ where: { client, createdAt: { lt: week.start } } }),
    ),
  );
  const newClients = clients.filter((_, i) => priorCounts[i] === 0);

  const areaCounts = new Map<string, number>();
  for (const e of entries) {
    for (const area of e.productAreas) areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
  }
  const topAreas = [...areaCounts.entries()]
    .map(([area, count]) => ({ area, label: areaLabel(area), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, period === "month" ? 5 : 3);

  const picks: RecapPick[] = [...entries]
    // A comment means somebody engaged with it, which is the closest thing to a
    // signal of importance the data actually holds.
    .sort((a, b) => b._count.comments - a._count.comments)
    .slice(0, period === "month" ? 5 : 3)
    .map((e) => ({ id: e.id, oneLiner: e.oneLiner, client: e.client, areas: e.productAreas.map(areaLabel) }));

  const narrative =
    withNarrative && entries.length
      ? await summarizeWeek(
          entries.map((e) => ({
            oneLiner: e.oneLiner,
            content: e.content,
            client: e.client,
            areas: e.productAreas.map(areaLabel),
            persona: e.persona,
          })),
        )
      : null;

  return {
    week,
    previousLabel: prev.label,
    entries: entries.length,
    entriesPrev,
    clients,
    newClients,
    topAreas,
    questions,
    asks,
    narrative,
    picks,
  };
}
