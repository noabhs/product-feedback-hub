/**
 * @mentions in comments. A mention is stored as plain text — "@noa.bhs", the
 * local part of the person's @navina.ai address — so there is no schema to
 * migrate and an old comment still reads naturally. Resolving a token back to
 * an email happens against the known-people list, on both the server (to send
 * the DM) and the client (to highlight it).
 */

export const MENTION_DOMAIN = "navina.ai";

/** "@" at the start or after whitespace/punctuation, never inside an email address. */
const MENTION_RE = /(^|[^\w.@])@([a-z0-9][a-z0-9._-]*)/gi;

/** Trailing punctuation belongs to the sentence ("ask @dana."), not the name. */
function cleanToken(raw: string): string {
  return raw.replace(/[._-]+$/, "").toLowerCase();
}

/** The emails a comment body mentions, in order of first appearance, deduplicated. */
export function resolveMentions(body: string, people: string[]): string[] {
  const byLocal = new Map(people.map((e) => [e.split("@")[0].toLowerCase(), e]));
  const found: string[] = [];
  for (const m of body.matchAll(MENTION_RE)) {
    const email = byLocal.get(cleanToken(m[2]));
    if (email && !found.includes(email)) found.push(email);
  }
  return found;
}

export type BodyPart = { text: string; mention: boolean };

/** Splits a body into plain and mention runs, so the UI can highlight the latter. */
export function splitBody(body: string, people: string[]): BodyPart[] {
  const locals = new Set(people.map((e) => e.split("@")[0].toLowerCase()));
  const parts: BodyPart[] = [];
  let last = 0;
  for (const m of body.matchAll(MENTION_RE)) {
    const clean = cleanToken(m[2]);
    if (!locals.has(clean)) continue;
    const start = m.index + m[1].length;
    const end = start + 1 + clean.length;
    if (start > last) parts.push({ text: body.slice(last, start), mention: false });
    parts.push({ text: body.slice(start, end), mention: true });
    last = end;
  }
  if (last < body.length) parts.push({ text: body.slice(last), mention: false });
  return parts;
}
