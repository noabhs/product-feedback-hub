import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logEvent, ACTIONS } from "@/lib/events";
import { parseReportRows, planReport, type ReportRow } from "@/lib/account-report";
import { parseCsv } from "@/lib/csv";
import { readXlsxRows, looksLikeXlsx } from "@/lib/xlsx";

/** Noon UTC, so a date-only value can't shift a day when it's read back. */
const atNoon = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

interface Decision {
  rawName: string;
  name: string;
  aliases: string[];
}

/**
 * What one report row would change on the account it matched. Counting the
 * fields rather than listing every value, because the useful question each
 * month is "43 accounts changed health", not a diff of 77 rows.
 */
const TRACKED = [
  "health", "products", "ehr", "segment", "billingState", "accountOwner", "csmName",
  "hieMembers", "qualityMembers", "riskMembers", "arr", "carr",
  "renewalDate", "lastActivityAt", "firstClosedWon",
] as const;
type Tracked = (typeof TRACKED)[number];

const asDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

function changedFields(row: ReportRow, current: Record<string, unknown>): Tracked[] {
  const before: Record<Tracked, unknown> = {
    health: current.health ?? null,
    products: JSON.parse((current.products as string) ?? "[]"),
    ehr: current.ehr ?? null,
    segment: current.segment ?? null,
    billingState: current.billingState ?? null,
    accountOwner: current.accountOwner ?? null,
    csmName: current.csmName ?? null,
    hieMembers: current.hieMembers ?? null,
    qualityMembers: current.qualityMembers ?? null,
    riskMembers: current.riskMembers ?? null,
    arr: current.arr ?? null,
    carr: current.carr ?? null,
    renewalDate: asDay(current.renewalDate as Date | null),
    lastActivityAt: asDay(current.lastActivityAt as Date | null),
    firstClosedWon: asDay(current.firstClosedWon as Date | null),
  };
  const after: Record<Tracked, unknown> = {
    health: row.health, products: row.products, ehr: row.ehr, segment: row.segment,
    billingState: row.billingState, accountOwner: row.accountOwner, csmName: row.csmName,
    hieMembers: row.hieMembers, qualityMembers: row.qualityMembers, riskMembers: row.riskMembers,
    arr: row.arr, carr: row.carr, renewalDate: row.renewalDate,
    lastActivityAt: row.lastActivityAt, firstClosedWon: row.firstClosedWon,
  };
  return TRACKED.filter((f) => JSON.stringify(before[f]) !== JSON.stringify(after[f]));
}

/**
 * Apply a Salesforce accounts report.
 *
 * Two passes over one request: without `apply` it reports what would happen,
 * with `apply` it writes. The preview is not a nicety — new accounts need a
 * display name chosen, and the three rules in lib/account-report.ts mean an
 * import can never be undone by re-importing an older file. Nothing is deleted,
 * nothing is renamed, and liveDate and archivedAt are never written.
 */
/** A Salesforce export is tens of kilobytes; past this it isn't one. */
const MAX_BYTES = 10 * 1024 * 1024;

interface Submission {
  rows: string[][];
  asOf: string;
  apply: boolean;
  newAccounts: Decision[];
  fileName: string | null;
}

/**
 * The upload, from either a form post carrying the file or a JSON body carrying
 * rows already parsed.
 *
 * The file is sent again with the apply, because the endpoint keeps nothing
 * between the two passes. That is the right trade for a file this size: no
 * server-side scratch state to expire, go stale, or be applied by someone else.
 */
async function read(req: NextRequest): Promise<Submission> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("No file was attached");
    if (file.size === 0) throw new Error("That file is empty");
    if (file.size > MAX_BYTES) throw new Error("That file is too large to be an accounts report");

    const bytes = Buffer.from(await file.arrayBuffer());
    // By content, not by filename: a report saved as .xls or with no extension
    // is still whatever it actually is.
    const rows = looksLikeXlsx(bytes) ? readXlsxRows(bytes) : parseCsv(bytes.toString("utf8"));

    const newAccountsRaw = form.get("newAccounts");
    return {
      rows,
      asOf: String(form.get("asOf") ?? ""),
      apply: form.get("apply") === "true",
      newAccounts: typeof newAccountsRaw === "string" && newAccountsRaw ? JSON.parse(newAccountsRaw) : [],
      fileName: file.name || null,
    };
  }

  const body = await req.json();
  if (!Array.isArray(body.rows)) throw new Error("rows must be an array");
  return {
    rows: body.rows as string[][],
    asOf: String(body.asOf ?? ""),
    apply: !!body.apply,
    newAccounts: Array.isArray(body.newAccounts) ? (body.newAccounts as Decision[]) : [],
    fileName: null,
  };
}

export async function POST(req: NextRequest) {
  let submission: Submission;
  try {
    submission = await read(req);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  const { rows, asOf } = submission;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
    return NextResponse.json({ error: "A report date (yyyy-mm-dd) is required" }, { status: 400 });
  }

  let report: ReportRow[];
  try {
    report = parseReportRows(rows);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  if (report.length === 0) {
    return NextResponse.json({ error: "No account rows below the header" }, { status: 400 });
  }

  const accounts = await prisma.account.findMany();
  const plan = planReport(
    report,
    accounts.map((a) => ({
      name: a.name,
      aliases: JSON.parse(a.aliases || "[]"),
      reportAsOf: a.reportAsOf?.toISOString() ?? null,
      archivedAt: a.archivedAt?.toISOString() ?? null,
    })),
  );

  // Two report rows onto one account is unresolvable from here: picking one
  // silently drops the other's figures.
  if (Object.keys(plan.duplicateTargets).length) {
    return NextResponse.json(
      {
        error: "Two rows in this report point at the same client, so it can't be applied.",
        duplicateTargets: plan.duplicateTargets,
      },
      { status: 409 },
    );
  }

  const byName = new Map(accounts.map((a) => [a.name, a]));
  const byRaw = new Map(report.map((r) => [r.rawName, r]));

  // Field-level counts, over the accounts this report and an earlier one share.
  const fieldChanges: Record<string, number> = {};
  let unchanged = 0;
  for (const [raw, name] of Object.entries(plan.matched)) {
    const current = byName.get(name);
    const row = byRaw.get(raw);
    if (!current || !row) continue;
    const fields = current.reportAsOf ? changedFields(row, current) : TRACKED.slice();
    if (fields.length === 0) unchanged++;
    for (const f of fields) fieldChanges[f] = (fieldChanges[f] ?? 0) + 1;
  }

  const summary = {
    asOf,
    reportRows: report.length,
    matched: Object.keys(plan.matched).length,
    newAccounts: plan.newAccounts,
    dropped: plan.dropped,
    returning: plan.returning,
    unchanged,
    fieldChanges,
  };

  if (!submission.apply) {
    return NextResponse.json({ preview: true, ...summary });
  }

  // Display names come back from the preview, where they could be edited. A new
  // account with no decision is refused rather than guessed at.
  const decisions = new Map<string, Decision>(submission.newAccounts.map((d) => [d.rawName, d]));
  const undecided = plan.newAccounts.filter((n) => !decisions.get(n.rawName)?.name?.trim());
  if (undecided.length) {
    return NextResponse.json(
      { error: `These new clients need a name: ${undecided.map((u) => u.rawName).join(", ")}` },
      { status: 400 },
    );
  }

  const target = new Map(Object.entries(plan.matched));
  for (const n of plan.newAccounts) {
    target.set(n.rawName, decisions.get(n.rawName)!.name.trim());
  }

  const stamp = atNoon(asOf);
  let created = 0;
  let updated = 0;

  await prisma.$transaction(async (tx) => {
    for (const n of plan.newAccounts) {
      const d = decisions.get(n.rawName)!;
      const name = d.name.trim();
      // Case-insensitive, so a re-import can't add a second row, and so a name
      // someone already added by hand in the UI is adopted rather than cloned.
      const existing = await tx.account.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { name: true },
      });
      if (existing) {
        target.set(n.rawName, existing.name);
        continue;
      }
      await tx.account.create({
        data: {
          id: `acct-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
          name,
          aliases: JSON.stringify((d.aliases ?? []).map((a) => a.trim()).filter(Boolean)),
        },
      });
      created++;
    }

    for (const row of report) {
      const name = target.get(row.rawName);
      if (!name) continue;
      // By name, and only the report's own columns: no rename, no liveDate, no
      // archivedAt. updateMany so a name that vanished mid-import is a no-op
      // rather than a thrown transaction.
      const res = await tx.account.updateMany({
        where: { name },
        data: {
          health: row.health,
          products: JSON.stringify(row.products),
          ehr: row.ehr,
          segment: row.segment,
          billingState: row.billingState,
          accountOwner: row.accountOwner,
          csmName: row.csmName,
          hieMembers: row.hieMembers,
          qualityMembers: row.qualityMembers,
          riskMembers: row.riskMembers,
          arr: row.arr,
          carr: row.carr,
          renewalDate: row.renewalDate ? atNoon(row.renewalDate) : null,
          lastActivityAt: row.lastActivityAt ? atNoon(row.lastActivityAt) : null,
          firstClosedWon: row.firstClosedWon ? atNoon(row.firstClosedWon) : null,
          reportAsOf: stamp,
        },
      });
      updated += res.count;
    }
  });

  const session = await auth();
  void logEvent(ACTIONS.accountsReportImported, {
    label: `${asOf} report — ${updated} updated, ${created} added, ${plan.dropped.length} left stale`,
    actor: session?.user?.email ?? undefined,
  });

  return NextResponse.json({ applied: true, created, updated, ...summary });
}
