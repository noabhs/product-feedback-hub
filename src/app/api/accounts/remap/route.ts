import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchAccount } from "@/lib/accounts";
import { loadAccounts } from "@/lib/accounts-db";
import { logEvent, ACTIONS } from "@/lib/events";

interface Proposal {
  from: string;
  to: string | null;
  count: number;
}

/**
 * Every distinct client value currently stored, next to the account it would
 * resolve to. Read-only — the preview behind the Apply button, so a wrong match
 * is caught before it overwrites anything.
 */
async function proposals(): Promise<Proposal[]> {
  const accounts = await loadAccounts();
  const grouped = await prisma.insight.groupBy({
    by: ["client"],
    where: { client: { not: null } },
    _count: { _all: true },
  });

  return grouped
    .map((g) => ({
      from: g.client as string,
      to: matchAccount(g.client, accounts),
      count: g._count._all,
    }))
    // Unmatched first — those are the ones worth a human decision.
    .sort((a, b) => (a.to === null ? 0 : 1) - (b.to === null ? 0 : 1) || a.from.localeCompare(b.from));
}

export async function GET() {
  const rows = await proposals();
  return NextResponse.json({
    proposals: rows,
    // Values already equal to their target need no work.
    pending: rows.filter((r) => r.from !== r.to).length,
    unmatched: rows.filter((r) => r.to === null).length,
  });
}

/** Apply the remap. Keeps the original text in clientRaw so it stays traceable. */
export async function POST() {
  const rows = (await proposals()).filter((r) => r.from !== r.to);

  let changed = 0;
  for (const row of rows) {
    // First remap: stash the original text alongside the new value. Guarded on
    // clientRaw being empty so a second pass can't overwrite the true original
    // with an already-remapped one.
    const first = await prisma.insight.updateMany({
      where: { client: row.from, clientRaw: null },
      data: { client: row.to, clientRaw: row.from },
    });
    // Anything already carrying an original just gets the new value.
    const rest = await prisma.insight.updateMany({
      where: { client: row.from },
      data: { client: row.to },
    });
    changed += first.count + rest.count;
  }

  void logEvent(ACTIONS.clientsRemapped, { label: `${changed} entries across ${rows.length} values` });
  return NextResponse.json({ changed, values: rows.length });
}
