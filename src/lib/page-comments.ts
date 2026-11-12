/** Normalises a client-supplied page path, or returns null if it isn't one. */
export function cleanPagePath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const p = raw.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (!p.startsWith("/") || p.length > 200) return null;
  return p;
}

/** "/know-your-domain" -> "Know your domain": a readable name for notifications. */
export function pageLabel(path: string): string {
  const seg = path.split("/").filter(Boolean)[0];
  if (!seg) return "Home";
  const s = seg.replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
