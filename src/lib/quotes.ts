/**
 * Pulling verbatim client quotes out of feedback text.
 *
 * The weekly "voice of the client" quote is shown in quotation marks, so it has
 * to be something a client actually said. Letting the model write the quote
 * would make that a hope; instead the quotes are lifted out of the entries here
 * and the model only chooses between them.
 */

export interface QuoteCandidate {
  entryId: string;
  client: string | null;
  /** The quoted words, without the surrounding quotation marks. */
  quote: string;
  /** The sentence that introduces it — usually names the speaker and role. */
  lead: string;
}

const MIN_CHARS = 45;
const MAX_CHARS = 320;

// “curly” or "straight" pairs. Straight quotes can't be nested-matched, so the
// span runs to the next straight quote, which is right for flat prose.
const QUOTED = /[“"]([^“”"\n]{20,600}?)[”"]/g;

/** Text that opens with one of these is a title or a label, not speech. */
const NOT_SPEECH = /^(https?:|www\.|[A-Z][A-Za-z]+ ?:)/;

export function extractQuotes(entryId: string, client: string | null, content: string): QuoteCandidate[] {
  const out: QuoteCandidate[] = [];
  for (const m of content.matchAll(QUOTED)) {
    const quote = m[1].trim().replace(/\s+/g, " ");
    if (quote.length < MIN_CHARS || quote.length > MAX_CHARS) continue;
    // A sentence has at least a few words; this drops quoted field names and IDs.
    if (quote.split(" ").length < 8 || NOT_SPEECH.test(quote)) continue;

    // The lead is the text before the quote back to the previous sentence break.
    const before = content.slice(Math.max(0, (m.index ?? 0) - 160), m.index ?? 0);
    const lead = before.split(/(?<=[.!?])\s+|\n/).pop()?.trim() ?? "";
    out.push({ entryId, client, quote, lead });
  }
  return out;
}
