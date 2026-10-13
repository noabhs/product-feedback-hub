import { normalizeAccount, type AccountLike } from "@/lib/accounts";

/**
 * Reading a Salesforce "Accounts Report for Product Requirements" export.
 *
 * This was a by-hand job for three months — read the spreadsheet, match its
 * names onto the canonical accounts, write a migration — and the procedure
 * stopped changing, so it lives here instead.
 *
 * The rules it exists to keep, in order of how much damage breaking them does:
 *
 *   1. Nothing is deleted. The report covers active direct accounts only, so an
 *      account missing from it may have churned, gone indirect or changed
 *      status — and its feedback is still real. It keeps its row and its last
 *      known figures, and `reportAsOf` says how old they are.
 *   2. Nothing is renamed. Insight.client stores the display name, not a
 *      foreign key, so a rename orphans every insight pointing at it. When
 *      Salesforce writes a longer string, the row is matched onto the existing
 *      display name and only the figures change.
 *   3. liveDate and archivedAt are never written from a report. One is typed in
 *      by hand, the other is a decision, and neither appears in any export.
 */

/** Columns the importer needs, by the header text Salesforce writes. */
export const REQUIRED_COLUMNS = [
  "Account Name",
  "Account Health",
  "Active Products",
  "EHR",
  "Segment Group",
  "Billing State/Province (text only)",
  "Account Owner",
  "CSM Name",
  "Total Current Contracted HIE Members",
  "Total Current Contracted Quality Members",
  "Total Current Contracted Risk Members",
  "Current ARR",
  "CARR",
  "Renewal Date",
  "Last Activity",
  "First Closed Won Date",
] as const;

export interface ReportRow {
  /** Exactly as the report writes it, for matching and for showing back. */
  rawName: string;
  health: string | null;
  products: string[];
  ehr: string | null;
  segment: string | null;
  billingState: string | null;
  accountOwner: string | null;
  csmName: string | null;
  hieMembers: number | null;
  qualityMembers: number | null;
  riskMembers: number | null;
  arr: number | null;
  carr: number | null;
  renewalDate: string | null;
  lastActivityAt: string | null;
  firstClosedWon: string | null;
}

const text = (v: string | undefined): string | null => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

const int = (v: string | undefined): number | null => {
  const s = (v ?? "").trim().replace(/[$,]/g, "");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
};

/**
 * Salesforce writes M/D/YYYY. Returned as yyyy-mm-dd, and as UTC noon when it
 * becomes a Date, so a date-only value can't shift a day in either direction.
 */
export function reportDate(v: string | undefined): string | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const [, m, d, y] = us;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Already ISO, which is what a re-exported CSV sometimes carries.
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? iso[0] : null;
}

/**
 * Locate the header row and read the columns by name.
 *
 * Never by position: the August and September exports had three preamble rows
 * with Account Name first, and the October one had no preamble and Account Name
 * last. Anything that counts columns produces silent garbage the next time the
 * report is reordered.
 */
export function parseReportRows(rows: string[][]): ReportRow[] {
  const headerIndex = rows.findIndex((r) =>
    r.some((c) => (c ?? "").trim().replace(/[\s↑↓]+$/, "") === "Account Name"),
  );
  if (headerIndex === -1) {
    throw new Error(
      'No header row found — no column is called "Account Name". Upload the Salesforce export as it comes, without reshaping it.',
    );
  }

  // Trailing sort arrows have shown up in these headers ("Account Name  ↑").
  const header = rows[headerIndex].map((c) => (c ?? "").trim().replace(/[\s↑↓]+$/, ""));
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    throw new Error(`The report is missing these columns: ${missing.join(", ")}`);
  }

  const at = (row: string[], column: string) => row[header.indexOf(column)];

  const out: ReportRow[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const rawName = (at(row, "Account Name") ?? "").trim();
    // Salesforce appends a "Total" summary row.
    if (!rawName || rawName.toLowerCase() === "total") continue;

    out.push({
      rawName,
      health: text(at(row, "Account Health")),
      products: (at(row, "Active Products") ?? "")
        .split(";")
        .map((p) => p.trim())
        .filter(Boolean),
      ehr: text(at(row, "EHR")),
      segment: text(at(row, "Segment Group")),
      billingState: text(at(row, "Billing State/Province (text only)")),
      accountOwner: text(at(row, "Account Owner")),
      csmName: text(at(row, "CSM Name")),
      hieMembers: int(at(row, "Total Current Contracted HIE Members")),
      qualityMembers: int(at(row, "Total Current Contracted Quality Members")),
      riskMembers: int(at(row, "Total Current Contracted Risk Members")),
      arr: int(at(row, "Current ARR")),
      carr: int(at(row, "CARR")),
      renewalDate: reportDate(at(row, "Renewal Date")),
      lastActivityAt: reportDate(at(row, "Last Activity")),
      firstClosedWon: reportDate(at(row, "First Closed Won Date")),
    });
  }
  return out;
}

/** Report strings whose hub display name the normaliser can't reach. */
const MANUAL_MATCHES: Record<string, string> = {
  "JCMG-Jefferson City Medical Group": "Jefferson City Medical Group",
  "Physicians' Primary Care of Southwest Florida, P.L.": "Physicians Primary Care",
};

/** Everything before a trailing parenthetical, and before an FKA/AKA tail. */
function baseName(raw: string): string {
  const head = raw.split("(")[0].trim();
  return head.replace(/\s+(fka|f\/k\/a|formerly|aka)\s+.*$/i, "").trim();
}

/**
 * The display name and aliases for an account the hub has never seen.
 *
 * A parenthetical naming a former name becomes an alias — that is what keeps
 * feedback filed under "Wellforce" or "Rural Healthcare Group" resolving. Any
 * other parenthetical stays in the name, because it is usually a real
 * disambiguator: "Baptist Health (AR)" is Arkansas, and "Baptist Health" alone
 * would invite a collision with the next one. Acronyms are never invented.
 */
export function proposeNewAccount(raw: string): { name: string; aliases: string[] } {
  const aliases: string[] = [];
  let name = raw.trim();

  const paren = name.match(/\(([^)]*)\)\s*\.?$/);
  if (paren) {
    const inner = paren[1].trim();
    const former = inner.match(/^(?:fka|f\/k\/a|formerly|aka)\s+(.*)$/i);
    if (former) {
      const prior = former[1].replace(/\.$/, "").trim();
      if (prior) aliases.push(prior);
      name = name.slice(0, paren.index).trim();
    }
  }

  // An "X fka Y" tail outside parentheses, same idea.
  const tail = name.match(/^(.*?)\s+(?:fka|f\/k\/a|formerly|aka)\s+(.*)$/i);
  if (tail) {
    name = tail[1].trim();
    const prior = tail[2].replace(/\.$/, "").trim();
    if (prior && !aliases.includes(prior)) aliases.push(prior);
  }

  // Trailing legal suffix adds nothing to a display name.
  name = name.replace(/,?\s+(LLC|L\.L\.C\.|Inc\.?|P\.?C\.?|P\.?A\.?|P\.?L\.?|Ltd\.?)\s*\.?$/i, "").trim();
  name = name.replace(/\.$/, "").trim();

  const bare = baseName(raw);
  if (bare && bare !== name && !aliases.includes(bare)) aliases.push(bare);

  return { name: name || raw.trim(), aliases };
}

export interface ReportPlan {
  /** Report name -> existing account display name. */
  matched: Record<string, string>;
  /** Report names with no account, each with a proposed name and aliases. */
  newAccounts: { rawName: string; name: string; aliases: string[] }[];
  /** Accounts that had report figures and aren't in this report. Left alone. */
  dropped: string[];
  /** Archived accounts the report lists again — a decision, never automatic. */
  returning: string[];
  /** Two report rows resolving to one account; blocks the import. */
  duplicateTargets: Record<string, string[]>;
}

export interface PlannableAccount extends AccountLike {
  /** Null when no report has ever covered it. */
  reportAsOf?: string | null;
  archivedAt?: string | null;
}

/**
 * Match every report row onto an account, and say what that implies.
 *
 * Decides nothing irreversible: a new account's display name is a proposal the
 * UI shows for editing, and the two blocking cases — two rows landing on one
 * account, an archived account reappearing — are surfaced rather than resolved.
 */
export function planReport(rows: ReportRow[], accounts: PlannableAccount[]): ReportPlan {
  const lookup = new Map<string, Set<string>>();
  for (const a of accounts) {
    for (const term of [a.name, ...(a.aliases ?? [])]) {
      const key = normalizeAccount(term);
      if (!key) continue;
      if (!lookup.has(key)) lookup.set(key, new Set());
      lookup.get(key)!.add(a.name);
    }
  }
  const unique = (key: string) => {
    const hit = lookup.get(key);
    return hit && hit.size === 1 ? [...hit][0] : null;
  };

  const matched: Record<string, string> = {};
  const newAccounts: ReportPlan["newAccounts"] = [];

  for (const row of rows) {
    const raw = row.rawName;
    if (MANUAL_MATCHES[raw]) {
      matched[raw] = MANUAL_MATCHES[raw];
      continue;
    }
    const nb = normalizeAccount(baseName(raw));
    let hit = unique(normalizeAccount(raw)) ?? unique(nb);

    // The hub's name may be longer than the report's ("Olmsted Medical Center"
    // against "Olmsted Medical Center Physicians") or shorter than it.
    if (!hit && nb) {
      for (const longer of [true, false]) {
        const cands = new Set<string>();
        for (const [key, names] of lookup) {
          const isMatch = longer ? key.startsWith(`${nb} `) : nb.startsWith(`${key} `);
          if (isMatch) for (const n of names) cands.add(n);
        }
        if (cands.size === 1) {
          hit = [...cands][0];
          break;
        }
      }
    }

    if (hit) matched[raw] = hit;
    else newAccounts.push({ rawName: raw, ...proposeNewAccount(raw) });
  }

  const targets = Object.values(matched);
  const seen = new Map<string, string[]>();
  for (const [raw, name] of Object.entries(matched)) {
    seen.set(name, [...(seen.get(name) ?? []), raw]);
  }
  const duplicateTargets: Record<string, string[]> = {};
  for (const [name, raws] of seen) {
    if (raws.length > 1) duplicateTargets[name] = raws;
  }

  const hit = new Set(targets);
  return {
    matched,
    newAccounts,
    dropped: accounts
      .filter((a) => a.reportAsOf && !hit.has(a.name))
      .map((a) => a.name)
      .sort((x, y) => x.localeCompare(y)),
    returning: accounts.filter((a) => a.archivedAt && hit.has(a.name)).map((a) => a.name).sort(),
    duplicateTargets,
  };
}
