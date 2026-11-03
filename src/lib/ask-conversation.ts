import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/people";
import { logEvent, ACTIONS } from "@/lib/events";
import type { AskDocumentView } from "@/lib/ask-documents";
import { MAX_TURNS, parsePool, titleFromQuestion, type PoolSource } from "@/lib/ask-history";

/** An error the route handlers can turn straight into a response. */
export class ConversationError extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

export interface ConversationTurn {
  /** AskLog id — what a rating or comment attaches to. */
  id: string;
  turnIndex: number;
  question: string;
  answer: string;
  standaloneQuestion: string | null;
  rating: string | null;
  ratingNote: string | null;
  createdAt: string;
}

export interface ConversationView {
  id: string;
  title: string;
  pendingQuestion: string | null;
  /** citation [n] is pool[n - 1], for every turn of this conversation. */
  pool: PoolSource[];
  turns: ConversationTurn[];
  /** Files attached as context; every turn of the chat reads them. */
  documents: AskDocumentView[];
  createdAt: string;
  updatedAt: string;
  /** Only the person who started it can add to it; the hub owner reads. */
  canWrite: boolean;
  /** Set only for the hub owner reading someone else's chat. */
  actor: string | null;
}

/**
 * The one place conversation privacy is decided. A conversation is visible to
 * whoever started it and to the hub owner, and to nobody else. Everything else
 * — a missing id, someone else's chat — is the same "not found", so an id can't
 * be used to find out whether a conversation exists.
 */
export async function getConversationFor(email: string, id: string): Promise<ConversationView | null> {
  const row = await prisma.askConversation.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, kind: true, size: true } },
      turns: {
        orderBy: { turnIndex: "asc" },
        select: {
          id: true,
          turnIndex: true,
          question: true,
          answer: true,
          standaloneQuestion: true,
          rating: true,
          ratingNote: true,
          createdAt: true,
        },
      },
    },
  });
  const mine = row?.actor.toLowerCase() === email.toLowerCase();
  if (!row || !(mine || isOwner(email))) return null;
  return {
    id: row.id,
    title: row.title,
    pendingQuestion: row.pendingQuestion,
    pool: parsePool(row.sourcePool),
    turns: row.turns.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
    documents: row.documents,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    canWrite: mine,
    // The owner already sees asker names in the Asks log; nobody else gets here.
    actor: mine ? null : row.actor,
  };
}

/** Starts an empty chat. With a question, it is held as pending until answered. */
export async function createConversation(actor: string, question?: string): Promise<{ id: string }> {
  const asked = question?.trim();
  const row = await prisma.askConversation.create({
    data: { actor, title: asked ? titleFromQuestion(asked) : "New chat", pendingQuestion: asked || null },
    select: { id: true },
  });
  void logEvent(ACTIONS.askConversationStarted, { target: row.id, label: asked ?? null, actor });
  return row;
}

export interface ConversationListItem {
  id: string;
  title: string;
  updatedAt: string;
  turnCount: number;
}

/** Only ever the caller's own chats — the hub owner's access is by id, not by list. */
export async function listConversations(actor: string, limit = 100): Promise<ConversationListItem[]> {
  const rows = await prisma.askConversation.findMany({
    where: { actor },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, title: true, updatedAt: true, _count: { select: { turns: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    updatedAt: r.updatedAt.toISOString(),
    turnCount: r._count.turns,
  }));
}

export async function renameConversation(actor: string, id: string, title: string): Promise<void> {
  const clean = title.replace(/\s+/g, " ").trim().slice(0, 120);
  if (!clean) throw new ConversationError(400, "Title can't be empty");
  const { count } = await prisma.askConversation.updateMany({ where: { id, actor }, data: { title: clean } });
  if (!count) throw new ConversationError(404, "Conversation not found");
}

/**
 * Deletes the chat and its follow-ups. The first question and answer stay in
 * the team's Asks log (detached from the chat by the SetNull foreign key): that
 * log exists to trace a bad answer back to its prompt, and the first turn is
 * the part it shows. Follow-ups are removed outright — a "deleted" chat whose
 * messages still sat in the table would not be deleted. Only the owner of the
 * chat can do this; the hub owner reads but does not delete.
 */
export async function deleteConversation(actor: string, id: string): Promise<void> {
  const mine = await prisma.askConversation.findFirst({ where: { id, actor }, select: { id: true } });
  if (!mine) throw new ConversationError(404, "Conversation not found");
  await prisma.$transaction([
    prisma.askLog.deleteMany({ where: { conversationId: id, turnIndex: { gt: 0 } } }),
    prisma.askConversation.delete({ where: { id } }),
  ]);
  void logEvent(ACTIONS.askConversationDeleted, { target: id, actor });
}

/** The state a turn needs before it runs, or the reason it can't. */
export async function loadForTurn(actor: string, id: string) {
  const conv = await getConversationFor(actor, id);
  if (!conv || !conv.canWrite) throw new ConversationError(404, "Conversation not found");
  if (conv.turns.length >= MAX_TURNS) {
    throw new ConversationError(409, `This chat has reached ${MAX_TURNS} questions — start a new one to keep going.`);
  }
  return conv;
}

/**
 * Saves an answered turn and the grown source pool together. Unlike
 * recordAskLog this throws: in a chat the AskLog row is the message itself, and
 * an answer that reached the screen but not the table would vanish on reload
 * and be missing from the next turn's history.
 *
 * (conversationId, turnIndex) is unique, so a second tab that answered the same
 * slot first makes this fail with a 409 instead of forking the history.
 */
export async function recordConversationTurn(row: {
  actor: string;
  conversationId: string;
  turnIndex: number;
  question: string;
  standaloneQuestion: string | null;
  answer: string;
  pool: PoolSource[];
  matchedCount: number;
  model: string;
  promptVersion: string;
  latencyMs: number;
}): Promise<string> {
  try {
    const [saved] = await prisma.$transaction([
      prisma.askLog.create({
        data: {
          actor: row.actor,
          question: row.question,
          answer: row.answer,
          // The whole pool, not just what this turn retrieved: position is the
          // citation number, and the Asks log and Slack replay read it that way.
          sourceIds: JSON.stringify(row.pool.map((s) => s.id)),
          matchedCount: row.matchedCount,
          model: row.model,
          promptVersion: row.promptVersion,
          latencyMs: row.latencyMs,
          conversationId: row.conversationId,
          turnIndex: row.turnIndex,
          standaloneQuestion: row.standaloneQuestion,
        },
        select: { id: true },
      }),
      prisma.askConversation.update({
        where: { id: row.conversationId },
        data: { sourcePool: JSON.stringify(row.pool), pendingQuestion: null },
      }),
    ]);
    return saved.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ConversationError(409, "Another answer was saved to this chat first — reload to see it.");
    }
    throw e;
  }
}
