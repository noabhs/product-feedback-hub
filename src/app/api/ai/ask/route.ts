import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { runQ } from "@/lib/ask-q";

/**
 * "Ask Q" on the home page — the same idea as /api/ai/qa, but reading the
 * whole hub (feedback, competitors, feature requests, the client table)
 * instead of just feedback. Kept as its own route rather than a flag on the
 * existing one: the two write different system prompts and answer shapes, and
 * AskLog.promptVersion already exists to keep their ratings apart.
 *
 * The actual work is in lib/ask-q.ts, shared with the Slack /ask command
 * (api/slack/command) so both surfaces answer from the same logic and log to
 * the same AskLog.
 */
export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });
  // The question as asked, stored in full — Event.label truncates at 200 chars.
  const asked = question.trim();

  const session = await auth();
  const actor = session?.user?.email ?? "anonymous";
  const apiKey = req.headers.get("x-anthropic-key") ?? undefined;

  const { answer, sources, askId, usedWebSearch } = await runQ(asked, actor, apiKey);
  return NextResponse.json({ answer, sources, askId, usedWebSearch });
}
