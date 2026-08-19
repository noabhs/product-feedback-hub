import { NextRequest, NextResponse } from "next/server";
import { loadAccountDetails } from "@/lib/accounts-db";
import { accountFiltersFromParams, matchesAccountFilters } from "@/lib/account-filters";
import { ACCOUNT_TABLE_COLUMNS, accountTableRow } from "@/lib/account-table";
import { toCsv, csvDownloadHeaders } from "@/lib/csv";

/**
 * The client table as a CSV, narrowed by whatever the page is filtering by.
 *
 * Wider than the table on purpose: the columns that live in the side panel —
 * owner, CSM, members, ARR, renewal — are exactly the ones someone exports in
 * order to pivot on, and clicking 95 accounts to copy them out by hand is the
 * thing this replaces.
 */
export async function GET(req: NextRequest) {
  const filters = accountFiltersFromParams(req.nextUrl.searchParams);
  const rows = (await loadAccountDetails()).filter((a) => matchesAccountFilters(a, filters));

  const csv = toCsv([...ACCOUNT_TABLE_COLUMNS], rows.map(accountTableRow));

  return new NextResponse(csv, { headers: csvDownloadHeaders("navina-clients") });
}
