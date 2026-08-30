import Anthropic from "@anthropic-ai/sdk";
import { AREA_LABELS, THEME_LABELS } from "@/lib/labels";
import { REPORT_AS_OF } from "@/lib/accounts";
import { ACCOUNT_TABLE_COLUMNS, accountTableRow } from "@/lib/account-table";
import { toCsv } from "@/lib/csv";
import type { AccountDetail } from "@/lib/types";

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

/**
 * The model and prompt behind "Ask the feedback", named so every stored answer
 * records what produced it. Bump QA_PROMPT_VERSION whenever the system prompt
 * below changes: without it a thumbs-down from last month can't be traced to the
 * prompt that earned it, and the ratings stop being usable as an eval set.
 */
export const QA_MODEL = "claude-sonnet-5";
export const QA_PROMPT_VERSION = "qa-4";

export interface QaInsight {
  oneLiner: string;
  content: string;
  client?: string | null;
  productAreas: string[];
  id: string;
}

export const QA_SYSTEM_PROMPT = `You are an expert product researcher for Navina, an AI-powered clinical intelligence platform.

You are given two kinds of context, and they answer different questions.

1. FEEDBACK — what clients have told us, numbered. Cite these with [number] references. Never state something as feedback without a citation.

2. THE CLIENT TABLE — Navina's account records as a CSV: health (Red/Yellow/Green), live products, EHR, segment, ARR and CARR, contracted members per product, renewal date and days to it, go-live date, account owner, CSM, billing state, and how many feedback entries each client has filed. These are facts about the accounts, not things anyone said. They carry no citation numbers, so don't invent any for them.

Answer from whichever context fits the question:
- Questions about the accounts themselves — how many clients run HIE, which are Red, total ARR by segment, who renews this quarter, which clients have filed no feedback — are answered from the client table alone. There is no need to find feedback first, and no need to apologise for its absence.
- When you count or aggregate, count every row of the table, state the number plainly, and name the rows when there are few enough to be useful. Do not estimate.
- Questions about what clients want, think, or complain about are answered from the feedback, with citations.
- Where both apply, use the table to weigh the feedback: one request from three Red accounts renewing this quarter is a different signal from the same request from one healthy account, and worth saying so. Prefer concrete facts over adjectives — "two accounts, $1.2M combined ARR" beats "several important clients".

Rules that hold either way:
- Never infer a value that isn't in the table. A blank cell means the accounts report didn't cover that client; it means unknown, not zero and not average.
- The table is a snapshot, not live. For anything time-sensitive, prefer the "Days to renewal" column over doing date arithmetic yourself.
- Be concise. Cut the preamble: no "Based on the feedback entries", no restating the question. Open with the answer itself, and for a counting question lead with the number.

Shape of the answer. It is read in a narrow box on a dashboard, so it has to be scannable at a glance:
- Write Markdown. Separate every block with a blank line.
- Lead with one or two sentences that answer the question outright. That paragraph stands alone.
- When the answer has more than one theme, put each on its own line as a Markdown bullet ("- "), opening with a short bold label, then an em dash, then at most two sentences. Never number themes inside a paragraph — one theme per line, always.
- Three to five bullets at most. Merge or drop the rest rather than writing a sixth.
- Bold only the labels and the figures that carry the point. No headings, no tables, no nested bullets, no bold sentences.
- If the account table changes what to do first, close with a single line starting "**So what:**".
- Put each [n] citation at the end of the clause it supports, not in a pile at the end.`;

/**
 * Everything sent to the model for one question, assembled without calling it.
 * Pure so the prompt can be printed and checked against real data — the previous
 * shape could only be verified by paying for an answer and reading the prose.
 */
export function buildQaPrompt(question: string, insights: QaInsight[], accounts: AccountDetail[]): string {
  const feedback = insights.length
    ? insights
        .map((i, idx) => `[${idx + 1}] Client: ${i.client ?? "Unknown"} | Areas: ${i.productAreas.join(", ") || "none"}\n${i.oneLiner}\n${i.content}`)
        .join("\n\n---\n\n")
    : "(No feedback entries matched this question.)";

  // The whole table, every question. Questions like "how many clients run HIE"
  // are about the accounts rather than about anything a client said, and no
  // amount of feedback retrieval can answer them — so the roster is context in
  // its own right, not a footnote on the quotes.
  //
  // As CSV rather than prose: it's a third of the tokens, it's the shape the
  // model counts most reliably, and it's the same table the CSV export produces.
  const table = toCsv([...ACCOUNT_TABLE_COLUMNS], accounts.map(accountTableRow));

  return [
    `FEEDBACK (${insights.length} ${insights.length === 1 ? "entry" : "entries"} matched):`,
    feedback,
    `THE CLIENT TABLE (${accounts.length} accounts, Salesforce snapshot ${REPORT_AS_OF}):`,
    table,
    `Question: ${question}`,
  ].join("\n\n");
}

export async function answerQuestion(
  question: string,
  insights: QaInsight[],
  accounts: AccountDetail[],
  apiKey?: string,
) {
  const stream = getClient(apiKey).messages.stream({
    model: QA_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: QA_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildQaPrompt(question, insights, accounts) }],
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
          // An array, so one piece of feedback can be filed under every area it
          // touches. minItems keeps the model from returning none at all, which
          // the API would reject anyway.
          productAreas: { type: "array", items: { type: "string", enum: AREAS }, minItems: 1 },
          theme: { type: "string", enum: THEMES },
          persona: nullableString,
          client: nullableString,
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["oneLiner", "content", "productAreas", "theme", "persona", "client", "tags"],
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
- productAreas: one or more of ${AREAS_FOR_PROMPT} — list every area the feedback genuinely touches, and just the one when it only touches one
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
- productAreas: one or more of ${AREAS_FOR_PROMPT} — list every area the feedback genuinely touches, and just the one when it only touches one
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

export interface WeekEntry {
  oneLiner: string;
  content: string;
  client: string | null;
  areas: string[];
  persona: string | null;
}

/**
 * Two or three sentences on what stood out in a week of feedback, for the Sunday
 * recap.
 *
 * Returns null rather than throwing on any problem — no server key, a rate
 * limit, a timeout. The recap is a weekly post to a Slack channel; it going out
 * with rule-picked entries instead of prose is a small loss, and it not going
 * out at all because a model call failed is a real one.
 */
export async function summarizeWeek(entries: WeekEntry[]): Promise<string | null> {
  if (!entries.length) return null;
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return null;

  const body = entries
    .map(
      (e, i) =>
        `${i + 1}. [${e.areas.join(", ") || "no area"}] ${e.client ?? "Unknown client"}` +
        `${e.persona ? ` (${e.persona})` : ""}\n   ${e.oneLiner}\n   ${e.content}`,
    )
    .join("\n\n");

  try {
    const res = await getClient().messages.create({
      model: QA_MODEL,
      max_tokens: 400,
      system: `You write the opening lines of a weekly product-feedback recap for Navina's product team, posted to Slack.

Write two or three sentences on what actually stood out this week. Rules:
- Name the pattern, not the volume. "Three clients independently asked for X" earns its place; "there was feedback about X" does not.
- Only claim what the entries support. No projections, no recommendations, no invented client names.
- Name clients and product areas where it sharpens the point.
- Plain sentences. No bullet points, no headings, no emoji, no preamble like "This week".
- If the week holds nothing beyond unrelated one-offs, say that plainly in one sentence. That is a useful thing for the team to read.`,
      messages: [{ role: "user", content: `This week's feedback entries:\n\n${body}` }],
    });

    const text = res.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text?.trim();
    return text || null;
  } catch {
    return null;
  }
}
