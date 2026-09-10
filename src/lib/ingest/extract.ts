import Anthropic from "@anthropic-ai/sdk";
import { cleanKey, extractText, jsonFormat } from "@/lib/claude";
import { AREA_LABELS, COMPETITOR_TOPIC_LABELS, CONFIDENCE_LABELS } from "@/lib/labels";

/**
 * Pulls discrete claims out of one competitor document.
 *
 * This replaced a step that wrote a prose summary per document. The summary was
 * unfilterable, could not be cited to a single statement, and forced one
 * sensitivity tag onto documents that mix freely shareable product facts with
 * pricing that must not leave the building. Claims fix all three, and they make
 * disagreement visible: two documents putting InNote at different PMPM figures
 * become two rows on the same topic rather than two blobs that never meet.
 *
 * The source material is working documents, not reference. The Innovaccer talk
 * track has paragraphs about a different company halfway through, one sentence
 * in three draft states, and bullets that stop mid-thought. So the extractor is
 * told to skip fragments rather than guess at them — a claim it cannot state
 * cleanly is worse than a claim it leaves out.
 */

export const EXTRACT_MODEL = "claude-sonnet-5";
/** Bump when the prompt or schema changes; stored per document for traceability. */
export const EXTRACT_VERSION = "extract-1";

/** Past this a document is an archive, not a document. */
const MAX_CHARS = 120_000;

export type Confidence = keyof typeof CONFIDENCE_LABELS;
export type Sensitivity = "internal" | "external";

export interface ExtractedClaim {
  oneLiner: string;
  content: string;
  topics: string[];
  productAreas: string[];
  confidence: string;
  sensitivity: Sensitivity;
  sensitivityReason: string;
}

export interface Extraction {
  claims: ExtractedClaim[];
  /** True when the document held nothing substantive about the competitor. */
  empty: boolean;
}

const TOPICS = Object.keys(COMPETITOR_TOPIC_LABELS);
const AREAS = Object.keys(AREA_LABELS);
const CONFIDENCES = Object.keys(CONFIDENCE_LABELS);

const SCHEMA = {
  type: "object",
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          oneLiner: { type: "string" },
          content: { type: "string" },
          topics: { type: "array", items: { type: "string", enum: TOPICS }, minItems: 1 },
          // May legitimately be empty: a claim about funding or headcount bears
          // on no part of Navina's product, and forcing an area would file it
          // somewhere misleading.
          productAreas: { type: "array", items: { type: "string", enum: AREAS } },
          confidence: { type: "string", enum: CONFIDENCES },
          sensitivity: { type: "string", enum: ["internal", "external"] },
          sensitivityReason: { type: "string" },
        },
        required: ["oneLiner", "content", "topics", "productAreas", "confidence", "sensitivity", "sensitivityReason"],
        additionalProperties: false,
      },
    },
    empty: { type: "boolean" },
  },
  required: ["claims", "empty"],
  additionalProperties: false,
};

const SYSTEM = `You are building Navina's competitive intelligence hub. Navina sells AI clinical intelligence to physician groups, health systems and payers.

You are given one internal document about a competitor — a battlecard, dossier, call note, sales talk track, evaluation deck or meeting summary. Break it into discrete claims, one per fact or judgement worth keeping.

**What makes one claim**
- One statement a person could agree or disagree with. "Gravity is a mandatory base layer for every customer" is a claim. "Innovaccer has products" is not.
- \`oneLiner\`: the claim stated plainly, under 100 characters, sentence case, no trailing period.
- \`content\`: the supporting detail. Carry every figure exactly as the document gives it — PMPM rates, funding amounts, headcounts, dates, percentages. Never round, never convert, never average two figures into one.
- Prefer several precise claims to one broad one. A pricing section with five module rates is five claims if the rates differ in kind, or one claim listing them if they only make sense together.
- Skip the mess: duplicated sentences, abandoned drafts, formatting artefacts, and any passage about a different company than the one named. These are working documents and contain all of it. A fragment too broken to state cleanly is left out, not guessed at.
- Never add anything the document does not say.

**topics** — one or more of: ${TOPICS.join(", ")}. Use several where a claim genuinely spans them: a modular PMPM pricing model is both PRICING and PACKAGING. VS_NAVINA is for explicit comparison, displacement or win/loss reasoning, not for anything merely competitive.

**productAreas** — which parts of Navina's own product the claim bears on, from: ${AREAS.join(", ")}. Leave the array empty when it bears on none — funding, headcount and corporate structure usually do.

**confidence** — the document's own standing for this claim, not your view of it:
- VERIFIED: multiple independent sources, or the document explicitly tags it verified.
- REPORTED: a single credible source — a named publication, an internal colleague, one deal.
- CLAIMED: the competitor's own marketing, website or self-reported figures, or anything the document flags as unverified.
If the document uses these words itself, honour them. Otherwise judge from the sourcing it names. When there is no sourcing at all, use REPORTED.

**sensitivity** — decide per claim, which is the point of doing this claim by claim:
- "internal": Navina's own pricing, strategy or talk track; competitor pricing gathered privately rather than published; named Navina clients or deals; hiring, personnel or attrition notes about identifiable people; any third party's confidential material.
- "external": describes the competitor from public or observable information — their published products, positioning, funding rounds, public pricing, press coverage.
A single document routinely contains both. Do not tag every claim from an internal file as internal — a product capability described in a sales deck is still a public fact about the competitor.
\`sensitivityReason\`: one short phrase naming what triggered internal. Empty string for external.

Set "empty" to true only when the document holds no substantive claims at all — a cover page, a link dump, a stub. Return an empty claims array in that case.`;

function client(): Anthropic {
  return new Anthropic({ apiKey: cleanKey(process.env.ANTHROPIC_API_KEY) });
}

export interface ExtractInput {
  competitor: string;
  title: string;
  /** Plain text, for everything but PDFs. */
  text?: string;
  /** Base64 PDF, read natively by the model rather than parsed here. */
  pdfBase64?: string;
}

export async function extractClaims(input: ExtractInput): Promise<Extraction> {
  const header = `Competitor: ${input.competitor}\nDocument title: ${input.title}`;

  const content: Anthropic.ContentBlockParam[] = input.pdfBase64
    ? [
        // Document first, instruction second — the model reads the source, then
        // what to do with it.
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: input.pdfBase64 },
        },
        { type: "text", text: `${header}\n\nExtract the claims from this document.` },
      ]
    : [{ type: "text", text: `${header}\n\nDocument:\n${(input.text ?? "").slice(0, MAX_CHARS)}` }];

  const stream = client().messages.stream({
    model: EXTRACT_MODEL,
    max_tokens: 32_000,
    thinking: { type: "adaptive" },
    output_config: { format: jsonFormat(SCHEMA) },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  const message = await stream.finalMessage();
  const parsed = JSON.parse(extractText(message.content)) as Extraction;

  return {
    empty: Boolean(parsed.empty),
    claims: (parsed.claims ?? []).map((c) => ({
      oneLiner: c.oneLiner.trim(),
      content: c.content.trim(),
      topics: c.topics?.length ? c.topics : ["CAPABILITIES"],
      productAreas: c.productAreas ?? [],
      confidence: CONFIDENCES.includes(c.confidence) ? c.confidence : "REPORTED",
      sensitivity: c.sensitivity === "internal" ? "internal" : "external",
      sensitivityReason: c.sensitivity === "internal" ? (c.sensitivityReason?.trim() ?? "") : "",
    })),
  };
}
