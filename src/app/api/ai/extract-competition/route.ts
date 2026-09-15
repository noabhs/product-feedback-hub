import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractClaims } from "@/lib/ingest/extract";
import { fetchUrlText } from "@/lib/fetch-url";
import { logEvent, ACTIONS } from "@/lib/events";

export async function POST(req: NextRequest) {
  try {
    const { competitorId, text, url, title } = await req.json();

    if (!competitorId) {
      return NextResponse.json({ error: "Pick a competitor first" }, { status: 400 });
    }
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      select: { name: true },
    });
    if (!competitor) {
      return NextResponse.json({ error: "That competitor no longer exists" }, { status: 404 });
    }

    let content = text?.trim() ?? "";
    if (!content && url?.trim()) {
      try {
        content = await fetchUrlText(url.trim());
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
      }
    }
    if (!content) {
      return NextResponse.json({ error: "Paste a link or the document text" }, { status: 400 });
    }

    const { claims } = await extractClaims({
      competitor: competitor.name,
      title: title?.trim() || "Pasted document",
      text: content,
    });

    void logEvent(ACTIONS.aiExtractCompetition, {
      target: competitorId,
      label: `${claims.length} claim${claims.length === 1 ? "" : "s"} proposed for ${competitor.name}`,
    });
    return NextResponse.json({ claims });
  } catch (e) {
    console.error("[ai/extract-competition]", e);
    return NextResponse.json({ error: (e as Error).message ?? "Extraction failed" }, { status: 500 });
  }
}
