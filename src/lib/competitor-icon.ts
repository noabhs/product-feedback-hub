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
