import Anthropic from "@anthropic-ai/sdk";

function getClient(apiKey?: string) {
  return new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
}

function parseJSON(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(stripped);
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

export async function extractInsights(text: string, apiKey?: string) {
  const stream = getClient(apiKey).messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: `You are a product research analyst for Navina. Extract discrete client insights from the provided text.
Return a JSON array of insights. Each insight must have:
- oneLiner: string (max 100 chars, sentence case)
- content: string (full detail)
- productArea: one of "POP_HEALTH" | "QUALITY" | "ANALYTICS" | "AGENTIC" | "RISK_DX" | "AMBIENT" | "GENERAL" | "COMPETITIVE"
- theme: one of "WORKFLOW" | "DATA_INTEGRATION" | "TRUST" | "PAIN_POINTS" | "GOALS" | "PRICING_WTP" | "OTHER"
- persona: string or null
- client: string or null
- tags: string[] (3–5 keywords)

Return ONLY valid JSON array, no markdown.`,
    messages: [{ role: "user", content: text }],
  });

  const message = await stream.finalMessage();
  const raw = extractText(message.content).trim();
  return parseJSON(raw);
}

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
Keep questions open-ended and hypothesis-driven. Return ONLY valid JSON.`,
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
