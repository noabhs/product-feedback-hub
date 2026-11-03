import { extractText, getDocumentProxy } from "unpdf";
import { prisma } from "@/lib/prisma";
import { ConversationError } from "@/lib/ask-conversation";

/** Vercel rejects request bodies over 4.5 MB, so stay clear of it. */
export const MAX_DOC_BYTES = 3 * 1024 * 1024;
export const MAX_DOCS_PER_CHAT = 3;
/** Text goes into the prompt as-is, so cap it well below a context window. */
const MAX_TEXT_CHARS = 150_000;

const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json)$/i;

export interface AskDocumentView {
  id: string;
  name: string;
  kind: string;
  size: number;
}

/** What a file is, or null when Q can't read it. */
export function documentKind(name: string, mime: string): "pdf" | "text" | null {
  if (mime === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  if (mime.startsWith("text/") || TEXT_EXT.test(name)) return "text";
  return null;
}

/** Saves an upload to a chat the caller owns. */
export async function addDocument(actor: string, conversationId: string, file: File): Promise<AskDocumentView> {
  const conv = await prisma.askConversation.findFirst({
    where: { id: conversationId, actor },
    select: { id: true, _count: { select: { documents: true } } },
  });
  if (!conv) throw new ConversationError(404, "Conversation not found");
  if (conv._count.documents >= MAX_DOCS_PER_CHAT) {
    throw new ConversationError(409, `A chat can hold ${MAX_DOCS_PER_CHAT} documents — remove one first.`);
  }
  const kind = documentKind(file.name, file.type);
  if (!kind) {
    throw new ConversationError(400, "Q can read PDF, TXT, MD, CSV and JSON files. For Word, save it as PDF first.");
  }
  if (file.size > MAX_DOC_BYTES) {
    throw new ConversationError(400, `${file.name} is over ${MAX_DOC_BYTES / 1024 / 1024} MB.`);
  }
  const buf = Buffer.from(await file.arrayBuffer());
  let data: string;
  if (kind === "pdf") {
    if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") throw new ConversationError(400, `${file.name} isn't a valid PDF.`);
    // Read once here and stored as text. Sending the PDF itself would make
    // Claude re-read it, page images included, on every question of the chat —
    // several times the tokens for the same words.
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      data = (await extractText(pdf, { mergePages: true })).text.slice(0, MAX_TEXT_CHARS);
    } catch {
      throw new ConversationError(400, `Couldn't read ${file.name}. Is it password-protected?`);
    }
    if (data.trim().length < 20) {
      throw new ConversationError(400, `${file.name} has no readable text — it looks like a scan.`);
    }
  } else {
    data = buf.toString("utf8").slice(0, MAX_TEXT_CHARS);
    if (!data.trim()) throw new ConversationError(400, `${file.name} is empty.`);
  }
  const row = await prisma.askDocument.create({
    // Always stored as text now; "pdf" rows from before this are still sent as PDFs.
    data: { conversationId, name: file.name.slice(0, 200), kind: "text", size: file.size, data },
    select: { id: true, name: true, kind: true, size: true },
  });
  return row;
}

export async function removeDocument(actor: string, conversationId: string, docId: string): Promise<void> {
  const { count } = await prisma.askDocument.deleteMany({
    where: { id: docId, conversationId, conversation: { actor } },
  });
  if (!count) throw new ConversationError(404, "Document not found");
}

/** The chat's documents as Anthropic content blocks, ready to precede the question. */
export async function documentBlocks(conversationId: string) {
  const rows = await prisma.askDocument.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } });
  return rows.map((d, i) => {
    // Caching the last block caches all of them: a PDF is re-read every turn.
    const cache = i === rows.length - 1 ? { cache_control: { type: "ephemeral" as const } } : {};
    return d.kind === "pdf"
      ? ({
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: d.data },
          title: d.name,
          ...cache,
        })
      : ({
          type: "document" as const,
          source: { type: "text" as const, media_type: "text/plain" as const, data: d.data },
          title: d.name,
          ...cache,
        });
  });
}
