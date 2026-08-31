import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { answerQuestion, QA_MODEL, QA_PROMPT_VERSION } from "@/lib/claude";
import { loadAccountDetails, loadAccounts } from "@/lib/accounts-db";
import { matchAccount } from "@/lib/accounts";
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

/**
 * Question scaffolding and generic verbs, which match almost every row and so
 * drown the signal rather than adding to it. Deliberately no domain words —
 * "risk", "coding" and "quality" are the subject matter here, however common.
 */
const STOPWORDS = new Set([
  "the", "and", "are", "for", "but", "not", "you", "our", "ours", "this", "that", "these", "those",
  "with", "from", "into", "have", "has", "had", "was", "were", "been", "being", "does", "did",
  "what", "when", "where", "which", "who", "whom", "why", "how", "any", "all", "can", "could",
  "should", "would", "will", "shall", "may", "might", "must", "need", "needs", "know", "about",
  "there", "their", "them", "they", "then", "than", "some", "such", "only", "also", "very", "just",
  "more", "most", "much", "many", "each", "both", "same", "other", "another", "over", "under",
  "got", "make", "makes", "made", "give", "gives", "take", "takes", "want", "wants", "tell",
  "says", "see", "look", "using", "use", "used", "providing", "provide", "provides",
  "ensure", "endure", "powerful", "winning", "good", "best", "better", "great",
]);

/**
 * Punctuation is stripped before splitting, because "(admissions," and
 * "product?" can never match clean text — a question typed with ordinary
 * punctuation was searching on its own brackets.
 *
 * The length floor is 3, not 4. At 4 the acronyms this product exists for —
 * ADT, HCC, HIE, RAF, CMS, CDI, API — were silently never searched, which is
 * how a question explicitly about ADT came back having retrieved on "what",
 * "about" and "providing".
 */
function tokenize(question: string): string[] {
  return [
    ...new Set(
      question
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !STOPWORDS.has(w)),
    ),
  ];
}

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });
  // The question as asked, stored in full — Event.label truncates at 200 chars.
  const asked = question.trim();

  const words = tokenize(asked);

  // A question naming a client used to find that client's feedback only if the
  // name also happened to appear in the prose. Resolved through matchAccount
  // rather than a LIKE on the client column: a third of the accounts have
  // "Health" in the name, so `contains` on a stray word would flood the 15 slots
  // with unrelated clients. The matcher is deliberately conservative and returns
  // null when a question names two accounts or none.
  const namedClient = matchAccount(asked, await loadAccounts());

  const LIMIT = 15;
  const [byClient, wordMatches] = await Promise.all([
    namedClient
      ? prisma.insight.findMany({ where: { client: namedClient }, take: LIMIT, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    words.length
      ? prisma.insight.findMany({
          where: {
            OR: words.map((word: string) => ({
              OR: [
                { oneLiner: { contains: word, mode: "insensitive" } },
                { content: { contains: word, mode: "insensitive" } },
              ],
            })),
          },
          // Every match, not the newest 15. Truncating the candidates by
          // createdAt meant one bulk import could own the whole context window:
          // after 109 competitive-intelligence rows landed in one go, four
          // unrelated product questions each came back 15/15 from that client
          // out of 463-980 genuine matches. Scoring needs to see the field.
          // At a few thousand rows this is cheap; past ~10k it wants a real
          // full-text index instead.
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  /** Distinct question words hit, one-liners weighted above body text. */
  const relevance = (i: { oneLiner: string; content: string }): number => {
    const head = i.oneLiner.toLowerCase();
    const body = i.content.toLowerCase();
    return words.reduce(
      (score: number, w: string) => score + (head.includes(w) ? 3 : 0) + (body.includes(w) ? 1 : 0),
      0,
    );
  };

  // Relevance first, recency only to break ties.
  const ranked = [...wordMatches].sort(
    (a, b) => relevance(b) - relevance(a) || b.createdAt.getTime() - a.createdAt.getTime(),
  );

  // No single client may fill the window. Whichever client happens to have been
  // imported most recently is not the answer to every question, and a spread of
  // accounts is what makes "is this one account or a pattern?" answerable.
  const PER_CLIENT = 3;
  const perClient = new Map<string, number>();
  const byWords: typeof ranked = [];
  const overflow: typeof ranked = [];
  for (const row of ranked) {
    const key = row.client ?? "(unmatched)";
    const used = perClient.get(key) ?? 0;
    if (used < PER_CLIENT) {
      perClient.set(key, used + 1);
      byWords.push(row);
    } else {
      overflow.push(row);
    }
  }
  // Only if too few clients matched to fill the window does the cap relax.
  byWords.push(...overflow);

  // The named client's own feedback goes first, so asking about one account can't
  // have its answer crowded out by keyword hits from everywhere else.
  const seen = new Set<string>();
  const insights = [...byClient, ...byWords]
    .filter((i) => !seen.has(i.id) && seen.add(i.id))
    .slice(0, LIMIT);

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
