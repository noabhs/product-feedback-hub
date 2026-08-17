/**
 * Fetch a public URL and reduce it to plain text for the model.
 * Shared by the insight and question extractors.
 *
 * Note: this only works for publicly readable URLs. A Google Doc or Notion page
 * that requires sign-in returns the login HTML, not the document — callers
 * should surface that to the user rather than feeding it to the model.
 */
export async function fetchUrlText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NavinaBot/1.0)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);

  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 14000);

  if (!text) throw new Error("No readable text found at that URL");

  // Detect an auth wall so the user gets a useful message rather than the model
  // summarising a login screen. Matched on full phrases, not single words:
  // an earlier version keyed on "permission" alone and rejected example.com,
  // whose short body happens to contain it. Prefer letting a login page through
  // over blocking a legitimate page.
  const AUTH_WALL = /(sign in to continue|log in to continue|request access|you need permission|need permission to access|sign in to your account to continue)/i;
  if (text.length < 400 && AUTH_WALL.test(text)) {
    throw new Error(
      "That URL needs sign-in, so only the login page was readable. Paste the document text instead."
    );
  }

  return text;
}
