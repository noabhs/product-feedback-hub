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

export type Anchor = {
  selector: string;
  snippet: string;
  relX: number;
  relY: number;
  absX: number;
  absY: number;
};

/** Validates an anchor from the client; null if it isn't usable. */
export function cleanAnchor(a: unknown): Anchor | null {
  if (!a || typeof a !== "object") return null;
  const o = a as Record<string, unknown>;
  const nums = ["relX", "relY", "absX", "absY"].map((k) => o[k]);
  if (!nums.every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  const selector = typeof o.selector === "string" ? o.selector.slice(0, 600) : "";
  const snippet = typeof o.snippet === "string" ? o.snippet.slice(0, 80) : "";
  const [relX, relY, absX, absY] = nums as number[];
  return { selector, snippet, relX, relY, absX, absY };
}
