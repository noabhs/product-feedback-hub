import { NextRequest, NextResponse } from "next/server";
import { extractInsights } from "@/lib/claude";

async function fetchUrlText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NavinaBot/1.0)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 14000);
}

export async function POST(req: NextRequest) {
  try {
    const { text, url } = await req.json();

    let content = text?.trim() ?? "";

    if (!content && url?.trim()) {
      try {
        content = await fetchUrlText(url.trim());
      } catch (e) {
        return NextResponse.json(
          { error: `Could not fetch URL: ${(e as Error).message}` },
          { status: 400 }
        );
      }
    }

    if (!content) return NextResponse.json({ error: "No content provided" }, { status: 400 });

    const insights = await extractInsights(content);
    return NextResponse.json({ insights });
  } catch (e) {
    console.error("[ai/extract]", e);
    return NextResponse.json({ error: (e as Error).message ?? "Extraction failed" }, { status: 500 });
  }
}
