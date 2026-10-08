/**
 * A small icon for a competitor's card/panel, derived from its website —
 * no logo assets to host, so this asks Google's public favicon service for
 * whatever icon that domain already serves. Returns null when there's no
 * website to derive one from; callers fall back to an initial instead.
 */
export function faviconUrl(website: string | null, size: number = 32): string | null {
  if (!website) return null;
  try {
    const host = new URL(website).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=${size}`;
  } catch {
    return null;
  }
}

/**
 * What a typed-in website becomes before it is stored: "privia.com",
 * "www.privia.com/about" and "https://privia.com" all land on the same origin.
 * Returns null for anything that isn't a hostname, so a typo is rejected at the
 * API rather than stored and silently rendered as a missing icon.
 */
export function normalizeWebsite(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    // A hostname with no dot is a typo, not a domain — "priviahealth" would
    // otherwise be stored and quietly serve no icon forever.
    if (!url.hostname.includes(".")) return null;
    return `https://${url.hostname}`;
  } catch {
    return null;
  }
}
