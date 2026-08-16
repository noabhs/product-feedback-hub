import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJSON(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(stripped);
}

export async function answerQuestion(question: string, insights: { oneLiner: string; content: string; client?: string | null; productArea: string; id: string }[]) {
  const context = insights
    .map((i, idx) => `[${idx + 1}] Client: ${i.client ?? "Unknown"} | Area: ${i.productArea}\n${i.oneLiner}\n${i.content}`)
    .join("\n\n---\n\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
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

  return (message.content[0] as { type: string; text: string }).text;
}

export async function extractInsights(text: string) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
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

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  return parseJSON(raw);
}

export async function generateDiscoveryQuestions(
  topic: string,
  persona: string | null,
  clientContext: string | null,
  questions: { question: string; theme: string; notesIntent?: string | null }[],
  insights: { oneLiner: string; content: string; client?: string | null }[]
) {
  const qList = questions.map((q) => `- ${q.question}${q.notesIntent ? ` (Intent: ${q.notesIntent})` : ""}`).join("\n");
  const iList = insights.slice(0, 20).map((i) => `- ${i.oneLiner} [${i.client ?? "unknown client"}]`).join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
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

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  return parseJSON(raw);
}
