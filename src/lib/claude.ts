import Anthropic from "@anthropic-ai/sdk";
import { AREA_LABELS, THEME_LABELS } from "@/lib/labels";

function getClient(apiKey?: string) {
  return new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
}

function parseJSON(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(stripped);
}

/**
 * Structured outputs: the model is constrained to this schema server-side, so
 * the response is always parseable. Replaces asking for JSON in prose, which
 * broke whenever the source text contained quotes the model didn't escape.
 *
 * Schema rules: every object needs additionalProperties: false, and nullable
 * fields use anyOf rather than a type array.
 */
const AREAS = Object.keys(AREA_LABELS);
/** The enum spelled out for the prompt, so it can never drift from the schema. */
const AREAS_FOR_PROMPT = AREAS.map((a) => `"${a}"`).join(" | ");
const THEMES = Object.keys(THEME_LABELS);
const THEMES_FOR_PROMPT = THEMES.map((t) => `"${t}"`).join(" | ");

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };

function jsonFormat(schema: Record<string, unknown>): Anthropic.JSONOutputFormat {
  return { type: "json_schema", schema };
}

function extractText(content: Anthropic.ContentBlock[]): string {
  const block = content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!block) throw new Error("No text block in Claude response");
  return block.text;
}

export async function answerQuestion(question: string, insights: { oneLiner: string; content: string; client?: string | null; productArea: string; id: string }[], apiKey?: string) {
  const context = insights
    .map((i, idx) => `[${idx + 1}] Client: ${i.client ?? "Unknown"} | Area: ${i.productArea}\n${i.oneLiner}\n${i.content}`)
    .join("\n\n---\n\n");

  const stream = getClient(apiKey).messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: `You are an expert product researcher for Navina, an AI-powered clinical intelligence platform.
You answer questions about client feedback and product insights based only on the provided context.
Be concise (2–5 sentences), synthesize across multiple sources, and always cite your sources with [number] references.
If the context doesn't contain enough information, say so clearly.`,
    messages: [
      {
        role: "user",
        content: `Context (${insights.length} insights):\n\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  const message = await stream.finalMessage();
  return extractText(message.content);
}

const INSIGHTS_SCHEMA = {
  type: "object",
  properties: {
    insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          oneLiner: { type: "string" },
          content: { type: "string" },
          productArea: { type: "string", enum: AREAS },
          theme: { type: "string", enum: THEMES },
          persona: nullableString,
          client: nullableString,
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["oneLiner", "content", "productArea", "theme", "persona", "client", "tags"],
        additionalProperties: false,
      },
    },
  },
  required: ["insights"],
  additionalProperties: false,
};

export async function extractInsights(text: string, apiKey?: string) {
  const stream = getClient(apiKey).messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    output_config: { format: jsonFormat(INSIGHTS_SCHEMA) },
    system: `You are a product research analyst for Navina. Extract discrete client insights from the provided text.
Return an object with an "insights" array. Each insight has:
- oneLiner: string (max 100 chars, sentence case)
- content: string (full detail)
- productArea: one of ${AREAS_FOR_PROMPT}
- theme: one of ${THEMES_FOR_PROMPT}
- persona: string or null
- client: string or null
- tags: string[] (3–5 keywords)`,
    messages: [{ role: "user", content: text }],
  });

  const message = await stream.finalMessage();
  const raw = extractText(message.content).trim();
  // The schema guarantees the wrapper object; hand callers the bare array.
  return (parseJSON(raw) as { insights: unknown[] }).insights;
}

const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          productArea: { type: "string", enum: AREAS },
          theme: { type: "string", enum: THEMES },
          persona: nullableString,
          notesIntent: nullableString,
        },
        required: ["question", "productArea", "theme", "persona", "notesIntent"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

export async function extractQuestions(text: string, apiKey?: string) {
  const stream = getClient(apiKey).messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    output_config: { format: jsonFormat(QUESTIONS_SCHEMA) },
    system: `You are a product discovery facilitator for Navina, an AI clinical intelligence platform.
Extract discovery questions from the provided document — questions a PM could ask a client in a discovery call.

Include questions that are explicitly written in the document. Also infer questions that the
document's findings clearly imply are worth asking, but only where the document supports them.
Do not invent questions on topics the document does not touch.

Return an object with a "questions" array. Each item has:
- question: string (the question, phrased for asking out loud)
- productArea: one of ${AREAS_FOR_PROMPT}
- theme: one of ${THEMES_FOR_PROMPT}
- persona: string or null (who to ask, if the document indicates one)
- notesIntent: string or null (what the question is trying to learn, and any context worth having)

Skip duplicates and near-duplicates. If the document contains no discovery-relevant
questions, return an empty array rather than padding it.`,
    messages: [{ role: "user", content: text }],
  });

  const message = await stream.finalMessage();
  const raw = extractText(message.content).trim();
  return (parseJSON(raw) as { questions: unknown[] }).questions;
}

const DOC_SCHEMA = {
  type: "object",
  properties: {
    sessionContext: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          questions: { type: "array", items: { type: "string" } },
        },
        required: ["title", "questions"],
        additionalProperties: false,
      },
    },
  },
  required: ["sessionContext", "sections"],
  additionalProperties: false,
};

export async function generateDiscoveryQuestions(
  topic: string,
  persona: string | null,
  clientContext: string | null,
  questions: { question: string; theme: string; notesIntent?: string | null }[],
  insights: { oneLiner: string; content: string; client?: string | null }[],
  apiKey?: string
) {
  const qList = questions.map((q) => `- ${q.question}${q.notesIntent ? ` (Intent: ${q.notesIntent})` : ""}`).join("\n");
  const iList = insights.slice(0, 20).map((i) => `- ${i.oneLiner} [${i.client ?? "unknown client"}]`).join("\n");

  const stream = getClient(apiKey).messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    output_config: { format: jsonFormat(DOC_SCHEMA) },
    system: `You are an expert product discovery facilitator for Navina.
Generate a structured discovery question document in this exact JSON format:
{
  "sessionContext": "string — 2-3 sentence session description",
  "sections": [
    {
      "title": "string",
      "questions": ["string", ...]
    }
  ]
}
Group questions into 5–7 thematic sections. Draw on the provided questions and enrich with insights.
Keep questions open-ended and hypothesis-driven.`,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}
Persona focus: ${persona ?? "general"}
Client context: ${clientContext ?? "none"}

Available questions:
${qList}

Relevant insights:
${iList}`,
      },
    ],
  });

  const message = await stream.finalMessage();
  const raw = extractText(message.content).trim();
  return parseJSON(raw);
}
