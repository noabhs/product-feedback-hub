/**
 * Client is free text on the entry, so the filter and the form suggestions are
 * built from the values already in use. That leaves a new client unpickable
 * until someone types it in by hand the first time — these are the ones we want
 * offered up front regardless of whether any entry references them yet.
 */

export const PINNED_CLIENTS = ["Advisors"] as const;

/** Merge the pinned names into the in-use ones, deduped and alphabetical. */
export function withPinnedClients(inUse: string[]): string[] {
  return [...new Set([...inUse, ...PINNED_CLIENTS])].sort((a, b) =>
    a.localeCompare(b),
  );
}
