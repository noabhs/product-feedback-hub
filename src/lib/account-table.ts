import { renewalWindow, daysUntil } from "@/lib/accounts";
import type { AccountDetail } from "@/lib/types";

/**
 * The client table, as columns and rows. One definition, used by the CSV export
 * and by the "Ask the feedback" prompt — so the table someone downloads and the
 * table the model answers from are the same table, and a column added here shows
 * up in both without anyone remembering to.
 */
export const ACCOUNT_TABLE_COLUMNS = [
  "Account", "Health", "Active products", "EHR", "Segment", "Live date",
  "Renewal date", "Days to renewal", "Renewal risk",
  "Current ARR", "CARR", "Risk members", "Quality members", "HIE members",
  "Account owner", "CSM", "Billing state", "Last activity", "First closed won",
  "Feedback entries",
] as const;

/** Dates go out as yyyy-mm-dd, which sorts correctly in every spreadsheet. */
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function accountTableRow(a: AccountDetail): (string | number | null)[] {
  return [
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
  ];
}
