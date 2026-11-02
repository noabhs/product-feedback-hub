import { tokenize } from "@/lib/tokenize";

/**
 * Which competitors and feature requests are worth sending for one question.
 * Both used to go in whole, every time: with a question about pop health the
 * model was handed every rival and every idea in the hub, each numbered as a
 * citable source, and some of them got cited. Pure, so it can be tested with no
 * database (`npm run test:ask`).
 */

/** The question is about the whole set ("which competitors do we track?"), so
 *  filtering would hide rows the asker is asking for. */
const ASKS_ABOUT_COMPETITORS = /\b(competitors?|competition|competitive|compete[sd]?|rivals?|alternatives?|landscape|vs\.?|versus)\b/i;
const ASKS_ABOUT_REQUESTS = /\b(feature requests?|requests?|roadmap|backlog|planned|in progress|under review|ideas?|status)\b/i;

const MAX_COMPETITORS = 6;
const MAX_REQUESTS = 8;

const haystack = (parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" ").toLowerCase();

/** Distinct question terms that appear in the text, whole-word for short terms
 *  so "ehr" doesn't hit "adherence". */
function overlap(terms: string[], text: string): number {
  let hits = 0;
  for (const t of terms) {
    const found = t.length <= 4 ? new RegExp(`(?<![a-z0-9])${t}(?![a-z0-9])`).test(text) : text.includes(t);
    if (found) hits++;
  }
  return hits;
}

export interface Selection<T> {
  items: T[];
  /** How many existed in all, so the prompt can say "3 of 41 matched". */
  total: number;
  /** True when nothing was filtered because the question is about the whole set. */
  all: boolean;
}

export function selectCompetitors<
  T extends { name: string; category?: string | null; subgroup?: string | null; positioning?: string | null; overview?: string | null; keyFacts?: string | null; differentiation?: string | null },
>(question: string, competitors: T[]): Selection<T> {
  const total = competitors.length;
  if (ASKS_ABOUT_COMPETITORS.test(question)) return { items: competitors, total, all: true };

  const q = question.toLowerCase();
  const terms = tokenize(question);
  const scored = competitors
    .map((c) => {
      // A named competitor is always in, whatever else matched.
      const named = new RegExp(`(?<![a-z0-9])${c.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9])`).test(q);
      const score = named
        ? 100
        : overlap(terms, haystack([c.category, c.subgroup, c.positioning, c.overview, c.keyFacts, c.differentiation]));
      return { c, score };
    })
    // Two shared terms, not one: a single stray word ("health") is in nearly every row.
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_COMPETITORS);
  return { items: scored.map((x) => x.c), total, all: false };
}

export function selectFeatureRequests<
  T extends { title: string; description?: string | null; painToSolve?: string | null },
>(question: string, requests: T[]): Selection<T> {
  const total = requests.length;
  if (ASKS_ABOUT_REQUESTS.test(question)) return { items: requests, total, all: true };

  const terms = tokenize(question);
  const scored = requests
    .map((f) => ({ f, score: overlap(terms, haystack([f.title, f.description, f.painToSolve])) }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_REQUESTS);
  return { items: scored.map((x) => x.f), total, all: false };
}
