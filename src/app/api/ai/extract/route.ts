import { NextRequest, NextResponse } from "next/server";
import { extractInsights } from "@/lib/claude";
import { fetchUrlText } from "@/lib/fetch-url";
import { logEvent, ACTIONS } from "@/lib/events";

export async function POST(req: NextRequest) {
  try {
    const { text, url } = await req.json();

    let content = text?.trim() ?? "";

    if (!content && url?.trim()) {
      try {
        content = await fetchUrlText(url.trim());
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
      }
    }

    if (!content) return NextResponse.json({ error: "No content provided" }, { status: 400 });

    const apiKey = req.headers.get("x-anthropic-key") ?? undefined;
    const insights = await extractInsights(content, apiKey);
    void logEvent(ACTIONS.aiExtract, {
      target: url?.trim() || null,
      label: `${Array.isArray(insights) ? insights.length : 0} insights proposed`,
    });
    return NextResponse.json({ insights });
  } catch (e) {
    console.error("[ai/extract]", e);
    return NextResponse.json({ error: (e as Error).message ?? "Extraction failed" }, { status: 500 });
  }
}
