import { Client } from "@notionhq/client";
import { cleanKey } from "@/lib/claude";

/**
 * Reads a Notion page into plain Markdown.
 *
 * Notion's own API returns a tree of block objects, not text, so this walks it.
 * Two things learned from Innovaccer's page shape the result:
 *
 * 1. Embedded screenshots come back as signed S3 URLs around 2,500 characters
 *    each that expire in five minutes. Nine of them were 90% of that page by
 *    volume and worth nothing to a text answer, so images become a one-line
 *    placeholder rather than a URL.
 * 2. The useful material — pricing, packaging, the product breakdown — is inside
 *    collapsed toggles. A walker that only read top-level blocks would return an
 *    almost empty page, so toggle children are followed.
 */

const MAX_DEPTH = 4;
/** A page past this many blocks is a dumping ground; take the front and say so. */
const MAX_BLOCKS = 600;

export interface NotionPage {
  title: string;
  markdown: string;
  /** True when something on the page could not be read — see `notes`. */
  truncated: boolean;
  notes: string[];
  /** Child pages found while walking, for the caller to queue separately. */
  childPageIds: string[];
  lastEditedAt: Date | null;
}

export function notionConfigured(): boolean {
  return Boolean(cleanKey(process.env.NOTION_TOKEN));
}

function client(): Client {
  const auth = cleanKey(process.env.NOTION_TOKEN);
  if (!auth) throw new Error("NOTION_TOKEN is not set");
  return new Client({ auth });
}

/**
 * The SDK's block union is enormous and mostly irrelevant here, so the response
 * is narrowed once at this boundary rather than threaded through the walker.
 */
interface RichText {
  plain_text?: string;
}
interface Block {
  id: string;
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
}

function text(block: Block, key: string): string {
  const body = block[key] as { rich_text?: RichText[] } | undefined;
  return (body?.rich_text ?? []).map((t) => t.plain_text ?? "").join("").trim();
}

/** Blocks that carry no text and no children worth following. */
const IGNORED = new Set(["divider", "breadcrumb", "table_of_contents", "column_list", "column"]);

/**
 * Block types Notion itself won't expand through the API — embeds of external
 * objects, synced blocks pointing elsewhere. Innovaccer's page had one (an
 * embedded deck), which is why a page is reported as truncated rather than
 * silently short.
 */
const OPAQUE = new Set(["unsupported", "external_object_instance", "embed", "synced_block", "link_to_page"]);

function render(block: Block, depth: number): string | null {
  const pad = "  ".repeat(depth);
  switch (block.type) {
    case "paragraph": {
      const body = text(block, "paragraph");
      return body ? `${pad}${body}` : null;
    }
    case "heading_1":
      return `\n# ${text(block, "heading_1")}`;
    case "heading_2":
      return `\n## ${text(block, "heading_2")}`;
    case "heading_3":
      return `\n### ${text(block, "heading_3")}`;
    case "toggle":
      // The summary line of a toggle is a heading in everything but name — it is
      // what a reader sees collapsed, so it labels the block below it.
      return `\n**${text(block, "toggle")}**`;
    case "bulleted_list_item":
      return `${pad}- ${text(block, "bulleted_list_item")}`;
    case "numbered_list_item":
      return `${pad}1. ${text(block, "numbered_list_item")}`;
    case "to_do":
      return `${pad}- ${text(block, "to_do")}`;
    case "quote":
      return `${pad}> ${text(block, "quote")}`;
    case "callout":
      return `${pad}${text(block, "callout")}`;
    case "code":
      return `${pad}${text(block, "code")}`;
    case "image":
    case "video":
    case "file":
    case "pdf":
      // Deliberately not the URL: Notion's file URLs are signed and expire in
      // minutes, so storing one saves a string that is already dead.
      return `${pad}[${block.type} omitted]`;
    default:
      return null;
  }
}

export async function fetchNotionPage(pageId: string): Promise<NotionPage> {
  const notion = client();
  const page = (await notion.pages.retrieve({ page_id: pageId })) as {
    last_edited_time?: string;
    properties?: Record<string, { title?: RichText[] }>;
  };

  const titleProp = Object.values(page.properties ?? {}).find((p) => Array.isArray(p.title));
  const title = (titleProp?.title ?? []).map((t) => t.plain_text ?? "").join("").trim() || "Untitled";

  const lines: string[] = [];
  const notes: string[] = [];
  const childPageIds: string[] = [];
  let blocksSeen = 0;
  let truncated = false;

  async function walk(blockId: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH) {
      truncated = true;
      notes.push(`stopped at nesting depth ${MAX_DEPTH}`);
      return;
    }

    let cursor: string | undefined;
    do {
      const res = await notion.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100,
      });
      cursor = res.next_cursor ?? undefined;

      for (const raw of res.results as unknown as Block[]) {
        if (blocksSeen >= MAX_BLOCKS) {
          truncated = true;
          notes.push(`stopped after ${MAX_BLOCKS} blocks`);
          return;
        }
        blocksSeen += 1;

        if (raw.type === "child_page") {
          // Recorded rather than inlined: a child page is its own document with
          // its own title and freshness, and flattening it here would make one
          // blob whose parts can't be dated or cited separately.
          childPageIds.push(raw.id);
          const childTitle = (raw.child_page as { title?: string } | undefined)?.title ?? "child page";
          lines.push(`[child page: ${childTitle}]`);
          continue;
        }

        if (OPAQUE.has(raw.type)) {
          truncated = true;
          notes.push(`could not read a ${raw.type} block`);
          continue;
        }

        if (!IGNORED.has(raw.type)) {
          const line = render(raw, depth);
          if (line !== null) lines.push(line);
        }

        if (raw.has_children) await walk(raw.id, depth + 1);
      }
    } while (cursor);
  }

  await walk(pageId, 0);

  return {
    title,
    markdown: lines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    truncated,
    notes,
    childPageIds,
    lastEditedAt: page.last_edited_time ? new Date(page.last_edited_time) : null,
  };
}
