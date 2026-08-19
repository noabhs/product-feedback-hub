import { NextRequest, NextResponse } from "next/server";
import { loadAccountDetails } from "@/lib/accounts-db";
import { accountFiltersFromParams, matchesAccountFilters } from "@/lib/account-filters";
import { renewalWindow, daysUntil } from "@/lib/accounts";
import { toCsv, csvDownloadHeaders } from "@/lib/csv";

/** Dates go out as yyyy-mm-dd, which sorts correctly in every spreadsheet. */
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

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

  const csv = toCsv(
    [
      "Account", "Health", "Active products", "EHR", "Segment", "Live date",
      "Renewal date", "Days to renewal", "Renewal risk",
      "Current ARR", "CARR", "Risk members", "Quality members", "HIE members",
      "Account owner", "CSM", "Billing state", "Last activity", "First closed won",
      "Feedback entries",
    ],
    rows.map((a) => [
      a.name,
      a.health,
      // Semicolons, as the accounts report itself writes them — and so the cell
      // needs no quoting in a comma-separated file.
      a.products.join("; "),
      a.ehr,
      a.segment,
      day(a.liveDate),
      day(a.renewalDate),
      daysUntil(a.renewalDate),
      renewalWindow(a.renewalDate) ?? "",
      a.arr,
      a.carr,
      a.riskMembers,
      a.qualityMembers,
      a.hieMembers,
      a.accountOwner,
      a.csmName,
      a.billingState,
      day(a.lastActivityAt),
      day(a.firstClosedWon),
      a.feedbackCount,
    ]),
  );

  return new NextResponse(csv, { headers: csvDownloadHeaders("navina-clients") });
}
