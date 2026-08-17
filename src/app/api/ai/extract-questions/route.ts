import { NextRequest, NextResponse } from "next/server";
import { extractQuestions } from "@/lib/claude";
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

    if (!content) {
      return NextResponse.json({ error: "Paste a link or the document text" }, { status: 400 });
    }

    const apiKey = req.headers.get("x-anthropic-key") ?? undefined;
    const questions = await extractQuestions(content, apiKey);
    void logEvent(ACTIONS.aiExtractQuestions, {
      target: url?.trim() || null,
      label: `${Array.isArray(questions) ? questions.length : 0} questions proposed`,
    });
    return NextResponse.json({ questions });
  } catch (e) {
    console.error("[ai/extract-questions]", e);
    return NextResponse.json({ error: (e as Error).message ?? "Extraction failed" }, { status: 500 });
  }
}
