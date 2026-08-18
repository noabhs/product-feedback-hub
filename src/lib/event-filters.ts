import { ACTION_LABELS } from "@/lib/events";

/**
 * The event log's filters, shared by the log query and the CSV export so an
 * export can't quietly cover a different set of rows than the table on screen.
 */
export interface EventFilters {
  from?: string | null;
  to?: string | null;
  actor?: string | null;
  action?: string | null;
  search?: string | null;
}

export function eventFiltersFrom(searchParams: URLSearchParams): EventFilters {
  return {
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    actor: searchParams.get("actor"),
    action: searchParams.get("action"),
    search: searchParams.get("search"),
  };
}

/** Prisma `where` for the Event table. Only the date range and the two exact
 *  matches go to the database; free-text search is applied in memory by
 *  `matchesEventSearch`, because it has to cover the human-readable action label
 *  rather than the stored action key. */
export function eventWhere(f: EventFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  const createdAt: Record<string, Date> = {};
  const from = f.from ? new Date(f.from) : null;
  const to = f.to ? new Date(f.to) : null;
  if (from && !isNaN(from.getTime())) createdAt.gte = from;
  if (to && !isNaN(to.getTime())) createdAt.lte = to;
  if (Object.keys(createdAt).length) where.createdAt = createdAt;

  if (f.actor) where.actor = f.actor;
  if (f.action) where.action = f.action;

  return where;
}

/**
 * Free-text match over the row as a reader sees it — the friendly action label
 * included, so searching "Added feedback" works even though the stored action is
 * "feedback.created".
 */
export function matchesEventSearch(
  row: { actor: string; action: string; label: string | null; target: string | null },
  search?: string | null,
): boolean {
  const needle = search?.trim().toLowerCase();
  if (!needle) return true;
  const hay = `${row.actor} ${ACTION_LABELS[row.action] ?? row.action} ${row.label ?? ""} ${row.target ?? ""}`;
  return hay.toLowerCase().includes(needle);
}
