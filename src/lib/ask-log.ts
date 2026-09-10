import { prisma } from "@/lib/prisma";

/**
 * Stores one Q&A pair and returns its id so the asker can rate the answer.
 * Shared by every "ask" endpoint (/api/ai/qa, /api/ai/ask) so a rating is
 * always traceable to the model and prompt version that produced the answer.
 *
 * Awaited rather than fire-and-forget, because the id is the whole point — but
 * a failure returns null instead of throwing: the answer has already been
 * generated and paid for, so it must reach the user either way. Without an id
 * the rating buttons simply don't appear.
 */
export async function recordAskLog(row: {
  actor: string;
  question: string;
  answer: string;
  sourceIds: string[];
  matchedCount: number;
  model: string;
  promptVersion: string;
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
        model: row.model,
        promptVersion: row.promptVersion,
        latencyMs: row.latencyMs,
      },
    });
    return saved.id;
  } catch (e) {
    console.error("[askLog]", e);
    return null;
  }
}
