import Anthropic from "@anthropic-ai/sdk";
import { cleanKey, extractText, jsonFormat } from "@/lib/claude";

/**
 * Rewrites one fetched document into prose the ask can safely quote, and records
 * whether it is fit to leave the hub.
 *
 * This step is not polish. The competitor material is working documents, not
 * reference: the Innovaccer talk track has unrelated paragraphs about Nuance
 * halfway through, a sentence repeated three times in different draft states, a
 * typo in its own title, and bullet lists that stop mid-thought. Handing that to
 * the ask verbatim would have it quoting abandoned drafts and half-sentences in
 * the same confident voice it uses for a client quote — the exact failure Navina's
 * own users complained about in the CSAT data.
 *
 * The sensitivity call is the other half. That same document carries competitor
 * PMPM pricing, a named account where Navina runs alongside Innovaccer, and a
 * note about which employees were hired from them. All fine inside the hub, none
 * of it fine in a file sitting in someone's downloads. Classifying on the way in
 * means the briefing pack can honour the distinction later without re-reading
 * ninety-nine documents to find out which was which.
 */

export const CONDENSE_MODEL = "claude-sonnet-5";
/** Bump when the prompt or schema changes, so a re-read is traceable to it. */
export const CONDENSE_VERSION = "ingest-1";

/** How much of one document is sent. Past this it is an archive, not a document. */
const MAX_CHARS = 120_000;

export type Sensitivity = "internal" | "external";

export interface Condensed {
  summary: string;
  sensitivity: Sensitivity;
  /** Why it was classified internal. Empty string when external. */
  sensitivityReason: string;
  /** True when the document held nothing about the competitor worth keeping. */
  empty: boolean;
}

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    sensitivity: { type: "string", enum: ["internal", "external"] },
    sensitivityReason: { type: "string" },
    empty: { type: "boolean" },
  },
  required: ["summary", "sensitivity", "sensitivityReason", "empty"],
  additionalProperties: false,
};

const SYSTEM = `You are preparing competitor documents for Navina's internal insights hub, where a question-answering feature will read and quote them.

Navina sells AI clinical intelligence to physician groups, health systems and payers. These documents are internal working files about competitors — battlecards, call notes, sales talk tracks, evaluation decks, meeting summaries.

Rewrite the document into clean prose that can be quoted safely.

Rules for the summary:
- Keep every concrete fact about the competitor: products and what they do, pricing and packaging, funding, headcount, customers, EHR integrations, named strengths and weaknesses. Figures matter — carry them exactly.
- Drop the mess: duplicated sentences, half-finished bullets, abandoned drafts, formatting artefacts, and any passage about a different company than the one named. These files are working documents and contain all of it.
- Write plainly in Markdown. Short paragraphs, or bullets where the source is a list. No preamble, no "this document describes".
- Never add anything the document does not say. If it makes a claim, attribute it in the text ("the deck claims", "the call notes say") rather than restating it as established fact.
- If a passage is too fragmentary to understand, leave it out rather than guessing what it meant.

Set "empty" to true when the document holds nothing substantive about the competitor — a cover page, a link dump, a stub. Give a one-line summary anyway.

Classify sensitivity:
- "internal" if it contains Navina's own sales strategy or talk tracks, competitor pricing gathered privately, named Navina clients or deals, hiring or personnel notes, or any third party's confidential material. When in doubt, choose internal.
- "external" if it only describes the competitor from public or observable information — their products, positioning, published pricing, funding.
Put the reason in "sensitivityReason" for internal, one short phrase naming what triggered it. Empty string for external.`;

function client(): Anthropic {
  return new Anthropic({ apiKey: cleanKey(process.env.ANTHROPIC_API_KEY) });
}

export interface CondenseInput {
  competitor: string;
  title: string;
  /** Plain text, for everything but PDFs. */
  text?: string;
  /** Base64 PDF, read natively by the model rather than parsed here. */
  pdfBase64?: string;
}

export async function condense(input: CondenseInput): Promise<Condensed> {
  const header = `Competitor: ${input.competitor}\nDocument title: ${input.title}`;

  const content: Anthropic.ContentBlockParam[] = input.pdfBase64
    ? [
        // The document block goes before the text block — the model reads the
        // source first, then the instruction about it.
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: input.pdfBase64 },
        },
        { type: "text", text: `${header}\n\nRewrite this document as instructed.` },
      ]
    : [
        {
          type: "text",
          text: `${header}\n\nDocument:\n${(input.text ?? "").slice(0, MAX_CHARS)}`,
        },
      ];

  const stream = client().messages.stream({
    model: CONDENSE_MODEL,
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    output_config: { format: jsonFormat(SCHEMA) },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  const message = await stream.finalMessage();
  const parsed = JSON.parse(extractText(message.content)) as Condensed;
  return {
    summary: parsed.summary.trim(),
    sensitivity: parsed.sensitivity === "internal" ? "internal" : "external",
    sensitivityReason: parsed.sensitivityReason?.trim() ?? "",
    empty: Boolean(parsed.empty),
  };
}
