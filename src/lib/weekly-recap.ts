import { prisma } from "@/lib/prisma";
import { ACTIONS } from "@/lib/events";
import { areaLabel } from "@/lib/labels";
import { summarizeWeek, BRIEF_VERSION } from "@/lib/claude";
import { matchAccount } from "@/lib/accounts";
import { loadAccounts } from "@/lib/accounts-db";
import { crossClientThemes, themeLabel, type RecapTheme } from "@/lib/themes";
import {
  lastCompleteWeek, previousWeek, monthToDate, previousMonth,
  type WeekWindow, type PeriodKind,
} from "@/lib/week";

/** How many entries the model reads. Sampled evenly across the period. */
const MODEL_SAMPLE = 120;

function spread<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  const step = items.length / max;
  return Array.from({ length: max }, (_, i) => items[Math.floor(i * step)]);
}

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
  {
    narrative: narrativeMode = "generate",
    period = "week",
  }: {
    /**
     * "generate" writes one if there isn't a cached one — the cron and the
     * period toggle. "regenerate" ignores the cache and rewrites, which is what
     * the explicit button does: pressing "write it now" and being handed
     * yesterday's copy is not what the words say. "cached" reads without ever
     * calling the model, which is what every page render uses. "off" skips it.
     */
    narrative?: "generate" | "regenerate" | "cached" | "off";
    period?: PeriodKind;
  } = {},
): Promise<WeeklyRecap> {
  const week = period === "month" ? monthToDate(now) : lastCompleteWeek(now);
  const prev = period === "month" ? previousMonth(week) : previousWeek(week);
  const inWeek = { gte: week.start, lt: week.end };

  const [entries, entriesPrev, questions, asks, accounts, seenBefore] = await Promise.all([
    prisma.insight.findMany({
      where: { createdAt: inWeek },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        oneLiner: true,
        client: true,
        productAreas: true,
        persona: true,
      },
    }),
    prisma.insight.count({ where: { createdAt: { gte: prev.start, lt: prev.end } } }),
    prisma.discoveryQuestion.count({ where: { createdAt: inWeek } }),
    prisma.askLog.count({ where: { createdAt: inWeek } }),
    loadAccounts(),
    // One query for "which clients did we already know about", instead of a
    // count per client — that was 55 round trips on the current data.
    prisma.insight.groupBy({
      by: ["client"],
      where: { client: { not: null }, createdAt: { lt: week.start } },
    }),
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
  const known = new Set(
    seenBefore.map((r) => canonical(r.client)).filter((c): c is string => !!c),
  );
  const newClients = clients.filter((c) => !known.has(c));
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

  // Newest first, which they already are. This is the last-resort fallback —
  // shown only when nothing was corroborated across clients — so it does not
  // justify a comments count over every row.
  const picks: RecapPick[] = entries
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

  // A completed week never changes, so it is written once, ever. A month is
  // still gaining entries, so it refreshes — but at most once a day rather than
  // on every entry added, which bounds the spend at roughly one call a day
  // instead of one per entry.
  const cacheKey =
    week.kind === "week"
      ? `${BRIEF_VERSION}:week:${week.key}`
      : `${BRIEF_VERSION}:month:${week.key}:${new Date().toISOString().slice(0, 10)}`;

  let narrative: string | null = null;
  let narrativeError: string | null = null;

  if (narrativeMode !== "off" && entries.length) {
    const cached =
      narrativeMode === "regenerate"
        ? null
        : await prisma.event.findFirst({
            where: { action: ACTIONS.recapNarrative, target: cacheKey },
            select: { label: true },
            orderBy: { createdAt: "desc" },
          });

    if (cached?.label) {
      narrative = cached.label;
    } else if (narrativeMode === "cached") {
      narrativeError = "Not written yet — the brief is generated by the Sunday job.";
    } else {
      // Bodies are fetched only for the entries the model will actually read.
      // Selecting content on the main query pulled every body in the period —
      // about a megabyte at current volume — before the call even started.
      const sample = spread(entries, MODEL_SAMPLE);
      const bodies = new Map(
        (
          await prisma.insight.findMany({
            where: { id: { in: sample.map((e) => e.id) } },
            select: { id: true, content: true },
          })
        ).map((r) => [r.id, r.content]),
      );

      const summary = await summarizeWeek(
        sample.map((e) => ({
          oneLiner: e.oneLiner,
          content: bodies.get(e.id) ?? "",
          client: e.client,
          areas: e.productAreas.map(areaLabel),
          persona: e.persona,
        })),
        entries.length,
        week.kind === "month" ? `${week.label} (this month so far)` : `the week of ${week.label}`,
      );
      narrative = summary.text;
      narrativeError = summary.error;
      if (summary.text) {
        // Written directly rather than through logEvent, which truncates its
        // label to 200 characters for the analytics feed. A brief is two or
        // three sentences — every cached one would have come back cut off
        // mid-word, and it would have looked like the model's fault.
        await prisma.event.create({
          data: {
            actor: "system",
            action: ACTIONS.recapNarrative,
            target: cacheKey,
            label: summary.text,
          },
        });
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
