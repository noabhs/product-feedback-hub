import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { answerQuestion, QA_MODEL, QA_PROMPT_VERSION } from "@/lib/claude";
import { logEvent, ACTIONS } from "@/lib/events";

/**
 * Stores the Q&A pair and returns its id so the asker can rate the answer.
 *
 * Awaited rather than fire-and-forget, because the id is the whole point — but a
 * failure returns null instead of throwing: the answer has already been
 * generated and paid for, so it must reach the user either way. Without an id
 * the rating buttons simply don't appear.
 */
async function record(row: {
  actor: string;
  question: string;
  answer: string;
  sourceIds: string[];
  matchedCount: number;
  latencyMs: number | null;
}): Promise<string | null> {
  try {
    const saved = await prisma.askLog.create({
      data: {
        actor: row.actor,
        question: row.question,
        answer: row.answer,
        sourceIds: JSON.stringify(row.sourceIds),
        matchedCount: row.matchedCount,
        model: QA_MODEL,
        promptVersion: QA_PROMPT_VERSION,
        latencyMs: row.latencyMs,
      },
    });
    return saved.id;
  } catch (e) {
    console.error("[askLog]", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });
  // The question as asked, stored in full — Event.label truncates at 200 chars.
  const asked = question.trim();

  const words = asked.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const insights = await prisma.insight.findMany({
    where: {
      OR: words.map((word: string) => ({
        OR: [
          { oneLiner: { contains: word, mode: "insensitive" } },
          { content: { contains: word, mode: "insensitive" } },
        ],
      })),
    },
    take: 15,
    orderBy: { createdAt: "desc" },
  });

  const session = await auth();
  const actor = session?.user?.email ?? "anonymous";

  if (insights.length === 0) {
    // Recorded, not discarded: a question the search couldn't match at all is the
    // clearest possible signal that retrieval — not Claude — needs the work.
    const answer = "No relevant insights found for this question.";
    const askId = await record({ actor, question: asked, answer, sourceIds: [], matchedCount: 0, latencyMs: null });
    return NextResponse.json({ answer, sources: [], askId });
  }

  const apiKey = req.headers.get("x-anthropic-key") ?? undefined;
  const startedAt = Date.now();
  const answer = await answerQuestion(asked, insights, apiKey);
  const latencyMs = Date.now() - startedAt;

  void logEvent(ACTIONS.aiAsk, { label: asked, actor });
  const askId = await record({
    actor,
    question: asked,
    answer,
    sourceIds: insights.map((i) => i.id),
    matchedCount: insights.length,
    latencyMs,
  });

  return NextResponse.json({
    answer,
    sources: insights.map((i) => ({ id: i.id, oneLiner: i.oneLiner, client: i.client })),
    askId,
  });
}
