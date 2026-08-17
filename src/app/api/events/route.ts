import { NextRequest, NextResponse } from "next/server";
import { logEvent, ACTIONS } from "@/lib/events";

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
