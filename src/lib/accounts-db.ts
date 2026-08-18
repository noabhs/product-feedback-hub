import { prisma } from "@/lib/prisma";
import { matchAccount, type AccountLike } from "@/lib/accounts";

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
 * The resolver for edits, which must not destroy data as a side effect.
 *
 * Before the historical remap has been applied, plenty of rows still carry an
 * unrecognised client. Editing such a row's date would otherwise blank its
 * client, because the value resolves to null. So: an empty value clears the
 * field, a recognised one is stored, and an unrecognised one leaves the column
 * untouched (`undefined`) — cleaning those up is the Clients page's job.
 */
export async function resolveClientForEdit(raw: string | null | undefined): Promise<string | null | undefined> {
  if (raw === undefined) return undefined;
  if (!raw?.trim()) return null;
  return (await resolveClient(raw)) ?? undefined;
}
