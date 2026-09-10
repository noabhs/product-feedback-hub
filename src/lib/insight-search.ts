import { prisma } from "@/lib/prisma";
import { matchAccount, type AccountLike } from "@/lib/accounts";
import { tokenize } from "@/lib/tokenize";

/**
 * The feedback retrieval behind every "ask" feature — which insights are
 * relevant enough to hand the model for one question. Shared by /api/ai/qa
 * and /api/ai/ask so the two askers agree on what counts as a match.
 */
export async function searchInsights(question: string, accounts: AccountLike[]) {
  const words = tokenize(question);

  // A question naming a client used to find that client's feedback only if the
  // name also happened to appear in the prose. Resolved through matchAccount
  // rather than a LIKE on the client column: a third of the accounts have
  // "Health" in the name, so `contains` on a stray word would flood the 15 slots
  // with unrelated clients. The matcher is deliberately conservative and returns
  // null when a question names two accounts or none.
  const namedClient = matchAccount(question, accounts);

  const LIMIT = 15;
  const [byClient, wordMatches] = await Promise.all([
    namedClient
      ? prisma.insight.findMany({ where: { client: namedClient }, take: LIMIT, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    words.length
      ? prisma.insight.findMany({
          where: {
            OR: words.map((word) => ({
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
      (score, w) => score + (head.includes(w) ? 3 : 0) + (body.includes(w) ? 1 : 0),
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
  return [...byClient, ...byWords].filter((i) => !seen.has(i.id) && seen.add(i.id)).slice(0, LIMIT);
}
