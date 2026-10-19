/**
 * Where a competitor claim came from, for claims with no CompetitorDocument.
 *
 * A document-backed claim gets its source from the document. A claim pushed from
 * the Slack sync or entered by hand carries its own `sourceUrl`/`sourceLabel`.
 * The URL arrives in a request body, so only http(s) is kept: a `javascript:`
 * link must never reach an <a href>.
 */

export function cleanSourceUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function cleanSourceLabel(value: unknown, url: string | null): string | null {
  if (!url) return null;
  const label = typeof value === "string" ? value.trim().slice(0, 120) : "";
  return label || new URL(url).hostname.replace(/^www\./, "");
}

/** The document's source when there is one, otherwise the claim's own. */
export function claimSource(i: {
  document: { title: string; url: string } | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
}): { title: string | null; url: string | null } {
  if (i.document) return { title: i.document.title, url: i.document.url };
  return { title: i.sourceLabel, url: i.sourceUrl };
}
