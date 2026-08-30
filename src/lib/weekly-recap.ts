import { prisma } from "@/lib/prisma";
import { logEvent, ACTIONS } from "@/lib/events";
import { areaLabel } from "@/lib/labels";
import { summarizeWeek } from "@/lib/claude";
import { matchAccount } from "@/lib/accounts";
import { loadAccounts } from "@/lib/accounts-db";
import { crossClientThemes, themeLabel, type RecapTheme } from "@/lib/themes";
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
  /**
   * Accounts heard from. Only values that resolve to a real account — an entry
   * filed against "All providers (Sep 25)" is not a client, and counting it as
   * one made this disagree with the same figure on the rest of the page.
   */
  clients: string[];
  /** Entries whose client matches no account, so the gap is visible not hidden. */
  unrecognisedClients: number;
  /** Of those, the ones with no feedback on file before this week. */
  newClients: string[];
  topAreas: { area: string; label: string; count: number }[];
  questions: number;
  asks: number;
  /** Claude's read of the period. */
  narrative: string | null;
  /** Why there is no narrative, when one was asked for. Shown to the user. */
  narrativeError: string | null;
  /** What several clients said the same thing about — the real highlight. */
  themes: { label: string; clients: string[]; entries: number; example: RecapPick }[];
  /** Entries worth quoting, used only when no theme spans two accounts. */
  picks: RecapPick[];
  /**
   * True when nearly every client in the period is "new" — which happens on a
   * bulk import and makes the first-ever line noise rather than news.
   */
  mostClientsAreNew: boolean;
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

  const [entries, entriesPrev, questions, asks, accounts] = await Promise.all([
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
    loadAccounts(),
  ]);

  // The stored client may still be raw ("NOMS — Dr. Bower"), so it is resolved
  // here for counting and grouping. Without this a single account shows up as
  // half a dozen "clients" and every theme looks corroborated when it isn't.
  // Null when the value matches no account. Callers decide whether that counts.
  const canonical = (raw: string | null) => (raw ? matchAccount(raw, accounts) : null);

  const clients = [...new Set(entries.map((e) => canonical(e.client)).filter((c): c is string => !!c))].sort();
  const unrecognisedClients = entries.filter((e) => e.client && !canonical(e.client)).length;

  // "First time" means nothing on file before this week — the interesting case,
  // and worth a name-check in the post.
  const priorCounts = await Promise.all(
    clients.map((client) =>
      prisma.insight.count({ where: { client, createdAt: { lt: week.start } } }),
    ),
  );
  const newClients = clients.filter((_, i) => priorCounts[i] === 0);
  // On the first import everything is "first ever", which is true and useless.
  const mostClientsAreNew = clients.length > 6 && newClients.length > clients.length * 0.6;

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

  const themes = crossClientThemes(
    entries.map((e) => ({ id: e.id, oneLiner: e.oneLiner, client: canonical(e.client) })),
    { limit: period === "month" ? 4 : 3 },
  ).map((t: RecapTheme) => ({
    label: themeLabel(t.phrase),
    clients: t.clients,
    entries: t.entries,
    example: (() => {
      const src = entries.find((e) => e.id === t.example.id);
      return {
        id: t.example.id,
        oneLiner: t.example.oneLiner,
        client: canonical(src?.client ?? null),
        areas: src?.productAreas.map(areaLabel) ?? [],
      };
    })(),
  }));

  // Cached per period *and* entry count, so a month still gaining entries gets
  // rewritten while a settled week is written once. Stored on the event log
  // rather than a new table — same reasoning as the already-posted check.
  const cacheKey = `${week.kind}:${week.key}:${entries.length}`;
  let narrative: string | null = null;
  let narrativeError: string | null = null;

  if (withNarrative && entries.length) {
    const cached = await prisma.event.findFirst({
      where: { action: ACTIONS.recapNarrative, target: cacheKey },
      select: { label: true },
      orderBy: { createdAt: "desc" },
    });

    if (cached?.label) {
      narrative = cached.label;
    } else {
      const summary = await summarizeWeek(
        entries.map((e) => ({
          oneLiner: e.oneLiner,
          content: e.content,
          client: e.client,
          areas: e.productAreas.map(areaLabel),
          persona: e.persona,
        })),
      );
      narrative = summary.text;
      narrativeError = summary.error;
      if (summary.text) {
        await logEvent(ACTIONS.recapNarrative, { target: cacheKey, label: summary.text });
      }
    }
  }

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
    narrativeError,
    themes,
    picks,
    mostClientsAreNew,
    unrecognisedClients,
  };
}
