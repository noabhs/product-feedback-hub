import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Creates a Google Doc in the signed-in user's own Drive from a generated brief.
 *
 * It uses the user's Google sign-in (the drive.file scope, which only reaches
 * files this app creates) rather than a shared service account, so the doc is
 * theirs. Drive converts the HTML upload into a native Doc, which keeps
 * headings, bullets and bold.
 */

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

/** Thrown when the user signed in before Docs access existed, or revoked it. */
export class NeedsReconnect extends Error {}

/**
 * A usable access token for this request's user. Google's last an hour but the
 * session lasts far longer, so an expired one is renewed from the refresh token
 * (not saved back: the refresh token stays valid, and renewing again is cheap).
 */
async function accessTokenFor(req: NextRequest): Promise<string> {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: req.nextUrl.protocol === "https:",
  });
  const access = token?.googleAccessToken as string | undefined;
  const refresh = token?.googleRefreshToken as string | undefined;
  const expiresAt = token?.googleExpiresAt as number | undefined;
  if (!access && !refresh) throw new NeedsReconnect();

  if (access && expiresAt && expiresAt * 1000 > Date.now() + 60_000) return access;
  if (!refresh) throw new NeedsReconnect();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: refresh,
    }),
  });
  if (!res.ok) throw new NeedsReconnect();
  return ((await res.json()) as { access_token: string }).access_token;
}

/** Makes the Doc in the requester's Drive and returns its link. */
export async function createGoogleDoc(
  req: NextRequest,
  opts: { title: string; markdown: string },
): Promise<{ url: string }> {
  const accessToken = await accessTokenFor(req);

  const boundary = `brief${Date.now().toString(36)}`;
  const metadata = JSON.stringify({ name: opts.title, mimeType: "application/vnd.google-apps.document" });
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${markdownToHtml(opts.title, opts.markdown)}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  // 401/403 from Drive means the grant is gone or never included Drive.
  if (res.status === 401 || res.status === 403) throw new NeedsReconnect();
  if (!res.ok) throw new Error(`Drive returned ${res.status}`);
  const data = (await res.json()) as { id: string; webViewLink?: string };
  return { url: data.webViewLink ?? `https://docs.google.com/document/d/${data.id}/edit` };
}
