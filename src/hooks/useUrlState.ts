"use client";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Filters and sort live in the URL so a view can be bookmarked, reloaded and
 * pasted into Slack — "the red accounts renewing this quarter, worst first" is
 * a link rather than a list of instructions.
 *
 * React state stays the source of truth after mount; the URL is a mirror of it.
 * The alternative — driving state off `useSearchParams` and navigating on every
 * keystroke — makes each filter change a Next.js navigation, which refetches
 * and flickers. Writing the mirror with `history.replaceState` costs nothing and
 * leaves the address bar correct, which is all a shareable link needs.
 */

/** Long enough to swallow a burst of keystrokes, short enough that the address
 *  bar is already correct by the time a hand reaches the Copy link button. */
const MIRROR_DELAY_MS = 250;

/** The value kinds a filter bar actually holds. */
export type UrlValue = string | string[] | number | boolean | null | undefined;

/**
 * Reads initial state out of the query string, coercing to the shape each piece
 * of state wants. Every getter falls back to the default rather than throwing,
 * so a hand-edited or truncated link degrades to the unfiltered page instead of
 * a blank one.
 */
export interface UrlReader {
  /** A single value: `?search=aegis`. */
  str(key: string, fallback?: string): string;
  /** A repeated value: `?client=Aegis&client=NOMS`. Repeated rather than
   *  comma-joined because a client name may itself contain a comma. */
  list(key: string): string[];
  /** A flag, present-and-`1` meaning true: `?risk=1`. */
  bool(key: string): boolean;
  /** A positive integer, e.g. a page number. Anything unparseable is the default. */
  num(key: string, fallback: number): number;
  /** A value constrained to a known set — a sort key or a tab. A stale or
   *  invented value falls back rather than putting the page in a state its
   *  switch statements don't cover. */
  oneOf<T extends string>(key: string, allowed: readonly T[], fallback: T): T;
  /** The raw params, for state that already has a decoder of its own —
   *  `accountFiltersFromParams` on /clients. Reusing it beats re-listing that
   *  page's six filters here, where the two spellings could drift apart. */
  readonly params: URLSearchParams;
}

/** Exported so the coercion rules can be exercised without a React tree. */
export function createUrlReader(params: URLSearchParams): UrlReader {
  return {
    params,
    str: (key, fallback = "") => params.get(key) ?? fallback,
    list: (key) => params.getAll(key).map((v) => v.trim()).filter(Boolean),
    bool: (key) => params.get(key) === "1",
    num: (key, fallback) => {
      const n = Number(params.get(key));
      return Number.isInteger(n) && n > 0 ? n : fallback;
    },
    oneOf: (key, allowed, fallback) => {
      const raw = params.get(key);
      return raw && (allowed as readonly string[]).includes(raw) ? (raw as typeof fallback) : fallback;
    },
  };
}

/**
 * The query string as it was when the page opened, for seeding `useState`.
 *
 * Frozen at mount on purpose: the page writes its own state straight back to the
 * URL, so re-reading would hand back whatever was just written and any state
 * seeded from it would fight the user's next click.
 *
 * Needs a `<Suspense>` boundary above it on a statically prerendered page —
 * that's a Next.js requirement for `useSearchParams`, not something this adds.
 */
export function useUrlReader(): UrlReader {
  const params = useSearchParams();
  // A state initializer rather than a memo, because "runs once and never again"
  // is a guarantee `useState` makes and `useMemo` explicitly doesn't.
  const [reader] = useState(() => createUrlReader(params));
  return reader;
}

/**
 * Serializes state to a query string, leaving out anything that isn't worth
 * carrying: nulls, empty strings, empty lists and `false`.
 *
 * Defaults are the caller's business — a page passes `null` for state sitting at
 * its default (`page > 1 ? page : null`). That keeps a link to an untouched page
 * clean, and keeps the question "what counts as default here?" next to the
 * state it describes instead of in this file.
 */
export function encodeUrlState(state: Record<string, UrlValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    if (value === null || value === undefined || value === false || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) if (v !== "") params.append(key, v);
    } else if (value === true) {
      params.set(key, "1");
    } else {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

/**
 * Mirrors an already-encoded query string into the address bar.
 *
 * Split out from `useUrlState` for pages whose filters have their own encoder —
 * /clients shares `accountFiltersToParams` with its CSV export, and a second
 * spelling of those params here is exactly the drift that module prevents.
 *
 * `replaceState`, not `pushState`: ticking four filters would otherwise bury the
 * previous page under four history entries, so Back would stop meaning "the page
 * I came from". The trade is that Back doesn't undo a filter — which matches how
 * the filter bar reads, since there's a Clear filters button for that.
 */
export function useUrlMirror(query: string): void {
  const written = useRef<string | null>(null);

  useEffect(() => {
    if (written.current === query) return;

    // Coalesced, because a search box mirrors on every keystroke and Safari
    // throttles history writes (roughly 100 per 30s) — a long phrase typed at
    // speed can trip that and the writes start getting dropped. The delay is
    // invisible for copying a link, which happens long after typing stops.
    const t = setTimeout(() => {
      written.current = query;
      const { pathname, hash } = window.location;
      window.history.replaceState(null, "", `${pathname}${query ? `?${query}` : ""}${hash}`);
    }, MIRROR_DELAY_MS);
    return () => clearTimeout(t);
  }, [query]);
}

/** Mirrors a plain state object — the common case. */
export function useUrlState(state: Record<string, UrlValue>): void {
  // Encoded on every render rather than memoized: it's a handful of keys, and the
  // caller passes a fresh object literal, so there are no stable deps to memo on.
  useUrlMirror(encodeUrlState(state));
}
