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
  // Recency words describe the ask, not the subject; they are handled as ordering
  // in insight-search.ts, and as search terms they only match stray prose.
  "latest", "recent", "recently", "lately", "newest",
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
export function tokenize(question: string): string[] {
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

/**
 * Adjacent word pairs of the question ("pop health", "risk adjustment"). A row
 * containing the pair says far more than one that has each word somewhere —
 * "health" alone is in a third of the client names.
 */
export function phrasesOf(question: string): string[] {
  const kept = new Set(tokenize(question));
  const words = question.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
  const pairs: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (kept.has(words[i]) && kept.has(words[i + 1])) pairs.push(`${words[i]} ${words[i + 1]}`);
  }
  return pairs;
}
