import Anthropic from "@anthropic-ai/sdk";
import { cleanKey, jsonFormat, extractText } from "@/lib/claude";
import { conventionPrompt } from "./guidelines";

export type Proposal = { proposed: string; level: string; inferred: boolean; question: string | null };

export type ProposeInput = {
  key: string;
  title: string;
  description: string;
  status: string;
  product: string;
  delivery: { type: string; title: string }[];
};

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          proposed: { type: "string" },
          level: { type: "string", enum: ["Initiative", "Epic", "Story"] },
          inferred: { type: "boolean" },
          question: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
        required: ["key", "proposed", "level", "inferred", "question"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

/** Proposes a name for each idea. Ten or so at a time keeps one answer short enough to be reliable. */
export async function proposeNames(batch: ProposeInput[]): Promise<Map<string, Proposal>> {
  const client = new Anthropic({ apiKey: cleanKey(process.env.ANTHROPIC_API_KEY) });
  const res = await client.messages.create({
    model: "claude-sonnet-5",
    // Adaptive thinking is on by default and is billed against max_tokens. A small
    // budget lets the reasoning use it all and return no text block at all, so give
    // headroom and ask for low effort: naming ten ideas does not need deep reasoning.
    max_tokens: 12000,
    output_config: { format: jsonFormat(SCHEMA), effort: "low" },
    system:
      conventionPrompt() +
      '\n\nReturn {"items": [...]} with one entry per idea, using the idea\'s key. Set inferred to true when the name comes from a linked ticket or a partial description.',
    messages: [{ role: "user", content: JSON.stringify(batch.map((b) => ({ ...b, description: b.description.slice(0, 1200) }))) }],
  });
  if (!res.content.some((b) => b.type === "text")) {
    throw new Error(`Claude returned no names (stop_reason: ${res.stop_reason}). Try again with fewer ideas.`);
  }
  const parsed = JSON.parse(extractText(res.content).trim()) as { items: (Proposal & { key: string })[] };
  return new Map(parsed.items.map((p) => [p.key, p]));
}
