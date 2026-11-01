/**
 * The parts of a Q conversation that are plain data shuffling — the shared
 * source pool, what earlier turns look like to the model, titles, the web
 * trigger. Kept free of Prisma and the Anthropic SDK so it can be exercised
 * with `npm run test:ask` and no database.
 */

export type QSource =
  | { id: string; kind: "insight"; label: string; client: string | null }
  | { id: string; kind: "competitor"; label: string; client: null }
  | { id: string; kind: "feature-request"; label: string; client: null }
  /** A glossary term or topic section from Know your domain; `href` is its path in the hub. */
  | { id: string; kind: "domain"; label: string; client: null; href: string }
  | { id: string; kind: "web"; label: string; client: null; url: string };

/** What a conversation's pool holds: the same sources an answer cites. */
export type PoolSource = QSource;

/** Past this many turns a chat is cut off: every turn re-sends the whole client
 *  table and competitor set, so an unbounded one is an unbounded bill. */
export const MAX_TURNS = 20;

/** How many earlier turns the model is shown. Older ones fall off rather than
 *  being summarised — the standalone rewrite carries what a follow-up needs. */
export const HISTORY_TURNS = 6;

/**
 * How an asker opts a question into web search — "search web" or "searchweb"
 * anywhere in the text, either side of it, case-insensitive. A phrase rather
 * than a UI-only toggle so the same convention works from Slack, which has no
 * checkbox to offer. The word boundaries keep it from firing inside "research
 * web" or similar.
 */
const WEB_SEARCH_TRIGGER = /\bsearch\s?web\b/i;

/** Whether a question (as typed, or as logged in AskLog) carries the trigger. */
export function hasWebSearchTrigger(question: string): boolean {
  return WEB_SEARCH_TRIGGER.test(question);
}

/** Strips the trigger phrase back out before the question is used for
 *  retrieval or sent to the model — it's a control signal, not content. */
export function stripWebSearchTrigger(question: string): { question: string; wantsWebSearch: boolean } {
  const wantsWebSearch = hasWebSearchTrigger(question);
  if (!wantsWebSearch) return { question, wantsWebSearch };
  return { question: question.replace(WEB_SEARCH_TRIGGER, " ").replace(/\s{2,}/g, " ").trim(), wantsWebSearch };
}

const poolKey = (s: Pick<PoolSource, "kind" | "id">) => `${s.kind}:${s.id}`;

/**
 * Adds this turn's hub sources to the conversation's pool and says which
 * number each one has. A source already in the pool keeps the number it was
 * first given, which is the whole point: "[7]" in turn 1 and "[7]" in turn 4
 * are the same row. New ones are appended, so no earlier number ever moves.
 *
 * `numbers[i]` is the 1-based citation number of `incoming[i]`.
 */
export function mergeIntoPool(
  pool: PoolSource[],
  incoming: PoolSource[],
): { pool: PoolSource[]; numbers: number[] } {
  const next = [...pool];
  const at = new Map(next.map((s, i) => [poolKey(s), i + 1]));
  const numbers = incoming.map((s) => {
    const known = at.get(poolKey(s));
    if (known) return known;
    next.push(s);
    at.set(poolKey(s), next.length);
    return next.length;
  });
  return { pool: next, numbers };
}

/** An answer as it is stored carries decoration the model should never read
 *  back: the web banner, the "add search web" tip, and [n] markers whose
 *  numbers point at sources this turn's prompt may not list. */
export function answerForHistory(answer: string): string {
  return answer
    .replace(/^🌐 \*\*This answer includes a live web search\.\*\*\n\n/, "")
    .replace(/\n\n💡 \*\*Tip:\*\*[^\n]*$/, "")
    .replace(/ ?\[\d{1,3}\]/g, "")
    .trim();
}

export interface HistoryTurn {
  question: string;
  answer: string;
}

/** The last HISTORY_TURNS turns, oldest first, with answers cleaned for the model. */
export function historyForModel(turns: HistoryTurn[]): HistoryTurn[] {
  return turns.slice(-HISTORY_TURNS).map((t) => ({
    question: stripWebSearchTrigger(t.question).question,
    answer: answerForHistory(t.answer),
  }));
}

/** A chat's title until something better exists: its first question, tidied. */
export function titleFromQuestion(question: string, max = 80): string {
  const clean = stripWebSearchTrigger(question).question.replace(/\s+/g, " ").trim() || "New chat";
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Parses AskConversation.sourcePool, tolerating a corrupt value rather than
 *  taking the whole chat down with it. */
export function parsePool(raw: string): PoolSource[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PoolSource[]) : [];
  } catch {
    return [];
  }
}
