import { prisma } from "@/lib/prisma";
import { matchAccount, normalizeAccount, type AccountLike } from "@/lib/accounts";
import type { AccountDetail } from "@/lib/types";

/** Aliases are stored as a JSON string; a malformed one shouldn't break matching. */
function parseAliases(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((a): a is string => typeof a === "string") : [];
  } catch {
    return [];
  }
}

export async function loadAccounts(): Promise<AccountLike[]> {
  const rows = await prisma.account.findMany({
    select: { name: true, aliases: true },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({ name: r.name, aliases: parseAliases(r.aliases) }));
}

/**
 * Free text in, a canonical account name or null out. Every write path runs
 * through here, so an unrecognised client is stored as null rather than
 * quietly re-fragmenting the list the way free text did.
 */
export async function resolveClient(raw: string | null | undefined): Promise<string | null> {
  if (!raw?.trim()) return null;
  return matchAccount(raw, await loadAccounts());
}

/**
 * The resolver for a write path, which must never discard the caller's value
 * silently.
 *
 * `keep` leaves the column untouched — used when the field wasn't submitted at
 * all, and when the submitted value is the row's existing unmatched value (a
 * pre-remap row shouldn't lose its client because someone edited its date).
 * `unknown` means the caller typed something new that isn't on the list; the
 * route turns that into a 400 so the user finds out, rather than saving
 * "successfully" and dropping the edit.
 */
export type ClientResolution =
  | { kind: "set"; value: string | null }
  | { kind: "keep" }
  | { kind: "unknown"; raw: string };

export async function resolveClientForEdit(
  raw: string | null | undefined,
  current: string | null | undefined,
): Promise<ClientResolution> {
  if (raw === undefined) return { kind: "keep" };

  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return { kind: "set", value: null };

  const matched = await resolveClient(trimmed);
  if (matched) return { kind: "set", value: matched };

  // Unchanged from what's already stored: leave it be.
  if (current && normalizeAccount(trimmed) === normalizeAccount(current)) return { kind: "keep" };

  return { kind: "unknown", raw: trimmed };
}

/** Products are stored as a JSON string; a malformed one shouldn't blank a row. */
function parseProducts(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Every account with its report snapshot and its feedback count — the shape
 * /clients renders and its CSV export writes. Shared so the two can't disagree
 * about what a client row contains.
 */
export async function loadAccountDetails(): Promise<AccountDetail[]> {
  const [rows, counts] = await Promise.all([
    prisma.account.findMany({ orderBy: { name: "asc" } }),
    prisma.insight.groupBy({
      by: ["client"],
      where: { client: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const byClient = new Map(counts.map((c) => [c.client as string, c._count._all]));
  const iso = (d: Date | null) => d?.toISOString() ?? null;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    health: r.health,
    products: parseProducts(r.products),
    ehr: r.ehr,
    segment: r.segment,
    billingState: r.billingState,
    accountOwner: r.accountOwner,
    csmName: r.csmName,
    hieMembers: r.hieMembers,
    qualityMembers: r.qualityMembers,
    riskMembers: r.riskMembers,
    arr: r.arr,
    carr: r.carr,
    renewalDate: iso(r.renewalDate),
    lastActivityAt: iso(r.lastActivityAt),
    firstClosedWon: iso(r.firstClosedWon),
    liveDate: iso(r.liveDate),
    feedbackCount: byClient.get(r.name) ?? 0,
  }));
}
