import { NextRequest, NextResponse } from "next/server";
import { loadForTurn } from "@/lib/ask-conversation";
import { conversationErrorResponse, requireEmail } from "@/lib/ask-route";
import { runQ } from "@/lib/ask-q";

// A follow-up is a rewrite call, retrieval, then an answer that may think and
// search the web — the Slack command gets the same headroom for the same call.
export const maxDuration = 60;
export const runtime = "nodejs";

/**
 * Asks the next question in a chat. If `question` is omitted, the chat's pending
 * first question is sent — which is how the page picks up a chat started from
 * the home box. Only the person who started the chat can add to it.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const who = await requireEmail();
  if ("response" in who) return who.response;
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  try {
    const conv = await loadForTurn(who.email, id);
    const typed = typeof body.question === "string" ? body.question.trim() : "";
    const question = typed || (conv.turns.length === 0 ? conv.pendingQuestion?.trim() : "") || "";
    if (!question) return NextResponse.json({ error: "Question required" }, { status: 400 });

    const apiKey = req.headers.get("x-anthropic-key") ?? undefined;
    const result = await runQ(question, who.email, apiKey, {
      id: conv.id,
      turnIndex: conv.turns.length ? conv.turns[conv.turns.length - 1].turnIndex + 1 : 0,
      history: conv.turns.map((t) => ({ question: t.question, answer: t.answer })),
      pool: conv.pool,
    });
    return NextResponse.json(result);
  } catch (e) {
    return conversationErrorResponse(e);
  }
}
