import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEvent, ACTIONS, EVENT_LOG_LIMIT } from "@/lib/events";
import { eventFiltersFrom, eventWhere, matchesEventSearch } from "@/lib/event-filters";

const PAGE_NAMES: Record<string, string> = {
  "/home": "Home",
  "/insights": "Feedback",
  "/discovery": "Discovery",
  "/discovery/generate": "Generate discovery doc",
  "/upload": "AI extract",
  "/analytics": "Analytics",
};

/**
 * Page-view beacon for the analytics page. Deliberately accepts only the
 * page-view action — it is not a general-purpose event sink that any client
 * could use to write arbitrary rows into the log.
 */
export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();
    if (typeof path !== "string" || !path.startsWith("/") || path.length > 200) {
      return NextResponse.json({ error: "path required" }, { status: 400 });
    }
    // Detail pages collapse to one label so the page breakdown stays readable.
    const label = PAGE_NAMES[path] ?? (path.startsWith("/insights/") ? "Feedback detail" : path);
    await logEvent(ACTIONS.pageView, { target: path, label });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

/**
 * The event log for a time range. The analytics page server-renders the default
 * 30 days; this serves every other range the user picks, including custom ones
 * reaching further back than that.
 */
export async function GET(req: NextRequest) {
  const filters = eventFiltersFrom(req.nextUrl.searchParams);
  const where = eventWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: EVENT_LOG_LIMIT,
      select: { id: true, actor: true, action: true, label: true, target: true, createdAt: true },
    }),
    prisma.event.count({ where }),
  ]);

  return NextResponse.json({
    events: rows.filter((r) => matchesEventSearch(r, filters.search)),
    // Pre-search, and uncapped: what the range holds, so the UI can say when
    // it's showing only the most recent slice of a bigger set.
    total,
    limit: EVENT_LOG_LIMIT,
  });
}
