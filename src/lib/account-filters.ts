import { atRenewalRisk } from "@/lib/accounts";
import type { AccountDetail } from "@/lib/types";

/**
 * What the /clients filter bar is currently narrowing by. Empty arrays and an
 * empty search mean "all", matching how the MultiSelects behave.
 */
export interface AccountFilters {
  search: string;
  health: string[];
  products: string[];
  ehr: string[];
  segment: string[];
  csm: string[];
  /** Renewal inside the window on an account that isn't green. */
  riskOnly: boolean;
}

export const NO_ACCOUNT_FILTERS: AccountFilters = {
  search: "",
  health: [],
  products: [],
  ehr: [],
  segment: [],
  csm: [],
  riskOnly: false,
};

/**
 * One definition of what the filters mean, used by the table and by the CSV
 * export. The export used to be the obvious place for these rules to drift out
 * of step with the screen, which is the whole reason it reads them from here.
 */
export function matchesAccountFilters(a: AccountDetail, f: AccountFilters): boolean {
  if (f.health.length && !(a.health && f.health.includes(a.health))) return false;
  // Any picked product counts — an account on Risk shows under a Risk filter
  // whether or not it also runs Quality.
  if (f.products.length && !a.products.some((p) => f.products.includes(p))) return false;
  if (f.ehr.length && !(a.ehr && f.ehr.includes(a.ehr))) return false;
  if (f.segment.length && !(a.segment && f.segment.includes(a.segment))) return false;
  if (f.csm.length && !(a.csmName && f.csm.includes(a.csmName))) return false;
  if (f.riskOnly && !atRenewalRisk(a)) return false;

  const q = f.search.trim().toLowerCase();
  if (!q) return true;
  // Owner and CSM included so "who does Zeshan cover" is one search away.
  return (
    a.name.toLowerCase().includes(q) ||
    (a.accountOwner?.toLowerCase().includes(q) ?? false) ||
    (a.csmName?.toLowerCase().includes(q) ?? false) ||
    (a.billingState?.toLowerCase().includes(q) ?? false)
  );
}

/**
 * The same filters off a query string, so a CSV download can be handed the
 * screen's state as a URL. Values are repeated rather than comma-joined: a
 * segment is literally "ACO/MSO" and an EHR could hold a comma.
 */
export function accountFiltersFromParams(params: URLSearchParams): AccountFilters {
  return {
    search: params.get("search") ?? "",
    health: params.getAll("health"),
    products: params.getAll("products"),
    ehr: params.getAll("ehr"),
    segment: params.getAll("segment"),
    csm: params.getAll("csm"),
    riskOnly: params.get("risk") === "1",
  };
}

/** The inverse, for building the export link from the page's state. */
export function accountFiltersToParams(f: AccountFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (f.search.trim()) params.set("search", f.search.trim());
  for (const v of f.health) params.append("health", v);
  for (const v of f.products) params.append("products", v);
  for (const v of f.ehr) params.append("ehr", v);
  for (const v of f.segment) params.append("segment", v);
  for (const v of f.csm) params.append("csm", v);
  if (f.riskOnly) params.set("risk", "1");
  return params;
}
