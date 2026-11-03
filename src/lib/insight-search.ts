import { prisma } from "@/lib/prisma";
import { matchAccount, type AccountLike } from "@/lib/accounts";
import { expandQuestion } from "@/lib/synonyms";
import { hasTerm, phrasesOf } from "@/lib/tokenize";

/** "latest on X", "what's new with Y" — the asker wants the newest rows, not
 *  just the best-matching ones. */
const RECENCY = /\b(latest|recent|recently|lately|newest|what'?s new|this (week|month|quarter)|last (week|month|quarter))\b/i;

/** When a row happened: the feedback's own date, else when it was imported. */
const effectiveTime = (i: { date: Date | null; createdAt: Date }) => (i.date ?? i.createdAt).getTime();


/**
 * The feedback retrieval behind every "ask" feature — which insights are
 * relevant enough to hand the model for one question. Shared by /api/ai/qa
 * and /api/ai/ask so the two askers agree on what counts as a match.
 */
export async function searchInsights(question: string, accounts: AccountLike[]) {
  // Expanded, not just tokenised. A question naming "DxC" has to find feedback
  // written as "risk adjustment", "diagnosis" or "HCC", and has to match rows
  // tagged RISK_DX whose prose never spells any of it out. See lib/synonyms.ts.
  const { terms: words, areas } = expandQuestion(question);

  // A question naming a client used to find that client's feedback only if the
  // name also happened to appear in the prose. Resolved through matchAccount
  // rather than a LIKE on the client column: a third of the accounts have
  // "Health" in the name, so `contains` on a stray word would flood the 15 slots
  // with unrelated clients. The matcher is deliberately conservative and returns
  // null when a question names two accounts or none.
  const namedClient = matchAccount(question, accounts);

  const LIMIT = 15;
  const phrases = phrasesOf(question);
  const wantsRecent = RECENCY.test(question);
  const [byClient, wordMatches] = await Promise.all([
    namedClient
      ? prisma.insight.findMany({ where: { client: namedClient }, take: LIMIT, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    words.length || areas.length
      ? prisma.insight.findMany({
          where: {
            OR: [
              ...words.map((word) => ({
                OR: [
                  { oneLiner: { contains: word, mode: "insensitive" as const } },
                  { content: { contains: word, mode: "insensitive" as const } },
                ],
              })),
              // The product-area tag counts as a match in its own right. This is
              // the half that fixes questions about a product area rather than a
              // phrase: the tag is the only place some entries say what they are
              // about.
              ...(areas.length ? [{ productAreas: { hasSome: areas } }] : []),
            ],
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

  /**
   * Distinct terms hit, one-liners weighted above body text, with the area tag
   * between the two. Deliberately below a one-liner hit: a row that merely
   * shares a product area should never outrank one that names the thing asked
   * about, or a broad area like RISK_DX would bury every specific answer.
   */
  const relevance = (i: { oneLiner: string; content: string; productAreas: string[] }): number => {
    const head = i.oneLiner.toLowerCase();
    const body = i.content.toLowerCase();
    const areaHit = areas.length && i.productAreas.some((a) => areas.includes(a)) ? 2 : 0;
    // A phrase hit outweighs its words (which also score on their own), so a row
    // that names "pop health" beats one that merely mentions "health" twice.
    const phraseScore = phrases.reduce((score, p) => score + (head.includes(p) ? 6 : 0) + (body.includes(p) ? 3 : 0), 0);
    return (
      areaHit +
      phraseScore +
      words.reduce((score, w) => score + (hasTerm(head, w) ? 3 : 0) + (hasTerm(body, w) ? 1 : 0), 0)
    );
  };

  // Relevance first, recency only to break ties — by when it happened, not when
  // it was imported, which for a bulk import is one instant for hundreds of rows.
  // The database matched on substrings; a row whose only hits were letters
  // inside other words ("get" in "target") scores 0 here and is dropped.
  const ranked = wordMatches.filter((i) => relevance(i) > 0).sort(
    (a, b) => relevance(b) - relevance(a) || effectiveTime(b) - effectiveTime(a),
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
  const merged = [...byClient, ...byWords].filter((i) => !seen.has(i.id) && seen.add(i.id));
  if (!wantsRecent) return merged.slice(0, LIMIT);

  // "Latest": keep the best-matching rows, then put the newest of those first.
  // Relevance still decides what is eligible, so recency can't pull in noise.
  // "Best-matching" means at least half the top score, so a row that shares one
  // stray word can't ride in on being new. A named client's rows always stay.
  const floor = ranked.length ? Math.ceil(relevance(ranked[0]) / 2) : 0;
  const named = new Set(byClient.map((i) => i.id));
  return merged
    .filter((i) => named.has(i.id) || relevance(i) >= floor)
    .slice(0, LIMIT * 2)
    .sort((a, b) => effectiveTime(b) - effectiveTime(a))
    .slice(0, LIMIT);
}
