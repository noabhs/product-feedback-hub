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
          product: { type: "string" },
          topic: { type: "string" },
          change: { type: "string" },
          level: { type: "string", enum: ["Initiative", "Epic", "Story"] },
          inferred: { type: "boolean" },
          question: { anyOf: [{ type: "string" }, { type: "null" }] },
        },
        required: ["key", "product", "topic", "change", "level", "inferred", "question"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

type Raw = { key: string; product: string; topic: string; change: string; level: string; inferred: boolean; question: string | null };

// A stray pipe inside a part would read as a second separator, so it becomes a slash.
const clean = (v: string) => v.replace(/^[\s|\-–—]+|[\s|\-–—]+$/g, "").replace(/\s*\|\s*/g, " / ").replace(/\s+/g, " ");

/**
 * The title is joined here, not written by the model, so every proposal has the
 * shape Product | Topic - what changes. The Product given by the hub always wins.
 */
export function composeTitle(given: string, r: Raw): { proposed: string; inferred: boolean; question: string | null } {
  const product = clean(given) || clean(r.product);
  const topic = clean(r.topic);
  const change = clean(r.change);
  const inferred = r.inferred || !clean(given);
  if (!change) return { proposed: "", inferred, question: r.question || "What is this work, and who is it for?" };
  if (!product) return { proposed: "", inferred, question: "Which product does this belong to?" };
  if (!topic) return { proposed: "", inferred, question: r.question || "Which feature or area is this in?" };
  return { proposed: `${product} | ${topic} - ${change}`, inferred, question: null };
}

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
      '\n\nReturn {"items": [...]} with one entry per idea, using the idea\'s key. Do not write the whole title. Give three parts and the system joins them as "product | topic - change":\n- product: copy the given `product` exactly. Only if it is empty, give your best guess.\n- topic: the feature or area inside the product, short, in sentence case (for example Patient registry, File manager).\n- change: what changes, in plain words. No product, no topic, no leading hyphen.\nIf you cannot tell what the work is, leave change empty and put the one question in `question`. Set inferred to true when the name comes from a linked ticket or a partial description.',
    messages: [{ role: "user", content: JSON.stringify(batch.map((b) => ({ ...b, description: b.description.slice(0, 1200) }))) }],
  });
  if (!res.content.some((b) => b.type === "text")) {
    throw new Error(`Claude returned no names (stop_reason: ${res.stop_reason}). Try again with fewer ideas.`);
  }
  const parsed = JSON.parse(extractText(res.content).trim()) as { items: Raw[] };
  const given = new Map(batch.map((b) => [b.key, b.product]));
  return new Map(parsed.items.map((r) => [r.key, { ...composeTitle(given.get(r.key) ?? "", r), level: r.level }]));
}
