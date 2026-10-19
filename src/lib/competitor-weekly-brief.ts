import { prisma } from "@/lib/prisma";
import { ACTIONS } from "@/lib/events";
import { competitorWeeklyBrief, type WeeklyBriefSource } from "@/lib/briefs";
import type { WebCitationSource } from "@/lib/claude";
import { lastCompleteWeek } from "@/lib/week";

/** Bumped when the prompt changes, so a new version does not read the old one's cache. */
const VERSION = "cw1";

export interface StoredWeeklyBrief {
  weekKey: string;
  weekLabel: string;
  /** Null for a quiet week: nothing named a competitor and nothing was added. */
  markdown: string | null;
  webSources: WebCitationSource[];
  hubSources: WeeklyBriefSource[];
  usedWebSearch: boolean;
  generatedAt: string;
}

const cacheKey = (weekKey: string) => `${VERSION}:${weekKey}`;

/**
 * The last completed week's brief, as written. Never calls the model: opening
 * the page is not a request to spend credits, so a week nobody has written yet
 * reads as null and the page offers a button.
 */
export async function readCompetitorWeeklyBrief(now = new Date()) {
  const week = lastCompleteWeek(now);
  const row = await prisma.event.findFirst({
    where: { action: ACTIONS.competitorWeeklyBrief, target: cacheKey(week.key) },
    select: { label: true },
    orderBy: { createdAt: "desc" },
  });
  let brief: StoredWeeklyBrief | null = null;
  if (row?.label) {
    try {
      brief = JSON.parse(row.label) as StoredWeeklyBrief;
    } catch {
      // A malformed row reads as not written, and the next write replaces it.
    }
  }
  return { week, brief };
}

/**
 * Writes the last completed week's brief and stores it. A completed week does
 * not change, so the Sunday job writes it once; pressing the button again
 * stores a newer row, and the newest wins.
 */
export async function writeCompetitorWeeklyBrief(now = new Date(), apiKey?: string): Promise<StoredWeeklyBrief> {
  const week = lastCompleteWeek(now);
  const result = await competitorWeeklyBrief(week, apiKey);

  const stored: StoredWeeklyBrief = {
    weekKey: week.key,
    weekLabel: week.label,
    markdown: result?.brief.markdown ?? null,
    webSources: result?.brief.webSources ?? [],
    hubSources: result?.hubSources ?? [],
    usedWebSearch: result?.brief.usedWebSearch ?? false,
    generatedAt: new Date().toISOString(),
  };

  // Written directly rather than through logEvent, which cuts its label to 200
  // characters — the same reason the feedback recap stores its paragraph this way.
  await prisma.event.create({
    data: {
      actor: "system",
      action: ACTIONS.competitorWeeklyBrief,
      target: cacheKey(week.key),
      label: JSON.stringify(stored),
    },
  });
  return stored;
}
