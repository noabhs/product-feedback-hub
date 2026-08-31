import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Usage logging. Every call is fire-and-forget: analytics must never break or
 * slow the action being recorded, so failures are swallowed after a log line.
 */

/** Cap on rows the log will render, so a very chatty month can't blow up the page. */
export const EVENT_LOG_LIMIT = 600;

export const ACTIONS = {
  feedbackCreated: "feedback.created",
  feedbackUpdated: "feedback.updated",
  feedbackDeleted: "feedback.deleted",
  questionCreated: "question.created",
  questionUpdated: "question.updated",
  sourceCreated: "source.created",
  sourceDeleted: "source.deleted",
  commentCreated: "comment.created",
  commentUpdated: "comment.updated",
  commentDeleted: "comment.deleted",
  csvImported: "csv.imported",
  clientAdded: "client.added",
  clientsRemapped: "clients.remapped",
  recapPosted: "recap.posted",
  recapNarrative: "recap.narrative",
  clientUpdated: "client.updated",
  aiExtract: "ai.extract",
  aiExtractQuestions: "ai.extract_questions",
  aiAsk: "ai.ask",
  askRated: "ask.rated",
  askDeleted: "ask.deleted",
  aiGenerateDoc: "ai.generate_doc",
  pageView: "page.view",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

/** Friendly labels for the analytics UI, keyed by action. */
export const ACTION_LABELS: Record<string, string> = {
  "feedback.created": "Added feedback",
  "feedback.updated": "Edited feedback",
  "feedback.deleted": "Deleted feedback",
  "client.added": "Added a client",
  "clients.remapped": "Remapped clients",
  "recap.posted": "Posted the weekly recap",
  "recap.narrative": "Wrote a recap brief",
  "client.updated": "Edited a client",
  "question.created": "Added discovery question",
  "question.updated": "Reclassified a question",
  "source.created": "Added source",
  "source.deleted": "Deleted source",
  "comment.created": "Commented",
  "comment.updated": "Edited a comment",
  "comment.deleted": "Deleted a comment",
  "csv.imported": "Imported CSV",
  "ai.extract": "Ran AI extract",
  "ai.extract_questions": "Extracted questions from a doc",
  "ai.ask": "Asked the feedback a question",
  "ask.rated": "Rated an AI answer",
  "ask.deleted": "Deleted a logged answer",
  "ai.generate_doc": "Generated a discovery doc",
  "page.view": "Viewed a page",
};

/** Actions that consume Anthropic credits — used for the AI usage panel. */
export const AI_ACTIONS: string[] = [
  ACTIONS.aiExtract,
  ACTIONS.aiExtractQuestions,
  ACTIONS.aiAsk,
  ACTIONS.aiGenerateDoc,
];

export async function logEvent(
  action: Action,
  opts: { target?: string | null; label?: string | null; actor?: string | null } = {}
): Promise<void> {
  try {
    let actor = opts.actor ?? null;
    if (!actor) {
      const session = await auth();
      actor = session?.user?.email ?? null;
    }
    await prisma.event.create({
      data: {
        actor: actor ?? "anonymous",
        action,
        target: opts.target ?? null,
        label: opts.label?.slice(0, 200) ?? null,
      },
    });
  } catch (e) {
    // Never surface this: losing an analytics row is far better than failing
    // the user's actual request.
    console.error("[logEvent]", action, e);
  }
}
