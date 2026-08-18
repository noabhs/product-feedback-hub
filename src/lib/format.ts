/** Formatters shared by the client table and its detail panel. */

/** "$3.87M", "$1.7M", "$323K", "$0" — no room for full dollar amounts inline. */
export function money(n: number | null | undefined): string | null {
  if (n === null || n === undefined) return null;
  // Trailing zeros trimmed, so 1,699,560 reads "$1.7M" rather than "$1.70M".
  if (Math.abs(n) >= 1_000_000) return `$${Number((n / 1_000_000).toFixed(2))}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

/** Exact dollars, for the panel and for hover titles on the rounded figures. */
export function moneyExact(n: number | null | undefined): string | null {
  if (n === null || n === undefined) return null;
  return `$${n.toLocaleString("en-US")}`;
}

export function members(n: number | null | undefined): string | null {
  if (n === null || n === undefined) return null;
  return n.toLocaleString("en-US");
}

export function fmtDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** yyyy-mm-dd, the value shape a native date input wants. */
export function dateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
