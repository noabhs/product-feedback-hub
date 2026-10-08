import { Readable } from "node:stream";
import { google } from "googleapis";

/**
 * Creates a Google Doc from a generated brief.
 *
 * The doc is created by the hub's service account (the same credentials Drive
 * ingestion uses, with a wider scope) and then shared with whoever clicked, so
 * no one has to re-consent to a new OAuth scope. Drive converts the HTML upload
 * into a native Doc, which keeps headings, bullets and bold.
 */

export function docsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
}

function credentials(): Record<string, unknown> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Bold, [n] citations and bare URLs inside one already-trimmed line. */
function inlineHtml(text: string): string {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\[(\d{1,3})\]/g, "<sup>[$1]</sup>")
    .replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1">$1</a>');
}

/** Just the markdown a brief uses: headings, bullets, numbered lines, paragraphs. */
export function markdownToHtml(title: string, markdown: string): string {
  const out: string[] = [`<h1>${esc(title)}</h1>`];
  let list: "ul" | "ol" | null = null;
  const close = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  const open = (kind: "ul" | "ol") => {
    if (list !== kind) {
      close();
      out.push(`<${kind}>`);
      list = kind;
    }
  };

  for (const line of markdown.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    const h = t.match(/^(#{1,4})\s+(.*)$/);
    const b = t.match(/^[-*•]\s+(.*)$/);
    const n = t.match(/^\d+\.\s+(.*)$/);
    if (h) {
      close();
      // The title is the h1, so brief headings start at h2.
      const level = Math.min(h[1].length + 1, 4);
      out.push(`<h${level}>${inlineHtml(h[2])}</h${level}>`);
    } else if (b) {
      open("ul");
      out.push(`<li>${inlineHtml(b[1])}</li>`);
    } else if (n) {
      open("ol");
      out.push(`<li>${inlineHtml(n[1])}</li>`);
    } else {
      close();
      out.push(`<p>${inlineHtml(t)}</p>`);
    }
  }
  close();
  return `<html><body>${out.join("")}</body></html>`;
}

/** Makes the Doc and shares it with `shareWith` as an editor. Returns its link. */
export async function createGoogleDoc(opts: {
  title: string;
  markdown: string;
  shareWith: string;
}): Promise<{ url: string }> {
  const auth = new google.auth.GoogleAuth({
    credentials: credentials(),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  const drive = google.drive({ version: "v3", auth });

  const created = await drive.files.create({
    requestBody: { name: opts.title, mimeType: "application/vnd.google-apps.document" },
    media: { mimeType: "text/html", body: Readable.from([markdownToHtml(opts.title, opts.markdown)]) },
    fields: "id,webViewLink",
  });
  const id = created.data.id;
  if (!id) throw new Error("Google didn't return a document id.");

  await drive.permissions.create({
    fileId: id,
    sendNotificationEmail: false,
    requestBody: { type: "user", role: "writer", emailAddress: opts.shareWith },
  });

  return { url: created.data.webViewLink ?? `https://docs.google.com/document/d/${id}/edit` };
}
