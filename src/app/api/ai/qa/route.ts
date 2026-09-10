import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { answerQuestion, QA_MODEL, QA_PROMPT_VERSION } from "@/lib/claude";
import { loadAccountDetails, loadAccounts } from "@/lib/accounts-db";
import { searchInsights } from "@/lib/insight-search";
import { recordAskLog } from "@/lib/ask-log";
import { logEvent, ACTIONS } from "@/lib/events";

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });
  // The question as asked, stored in full — Event.label truncates at 200 chars.
  const asked = question.trim();

  const insights = await searchInsights(asked, await loadAccounts());

  const session = await auth();
  const actor = session?.user?.email ?? "anonymous";

  // The whole client table goes with every question, so a question about the
  // accounts — "how many clients run HIE" — is answerable on its own terms.
  const accounts = await loadAccountDetails();

  // No early return on zero matches any more. It used to answer "No relevant
  // insights found", which was right when feedback was the only context and
  // wrong the moment the account table arrived: a counting question about
  // clients matches no feedback by nature, and refusing it was the bug.
  // matchedCount still records 0, so retrieval misses stay visible in the log.
  const apiKey = req.headers.get("x-anthropic-key") ?? undefined;
  const startedAt = Date.now();
  const answer = await answerQuestion(asked, insights, accounts, apiKey);
  const latencyMs = Date.now() - startedAt;

  void logEvent(ACTIONS.aiAsk, { label: asked, actor });
  const askId = await recordAskLog({
    actor,
    question: asked,
    answer,
    sourceIds: insights.map((i) => i.id),
    matchedCount: insights.length,
    model: QA_MODEL,
    promptVersion: QA_PROMPT_VERSION,
    latencyMs,
  });

  return NextResponse.json({
    answer,
    sources: insights.map((i) => ({ id: i.id, oneLiner: i.oneLiner, client: i.client })),
    askId,
  });
}
