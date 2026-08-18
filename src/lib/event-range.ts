/**
 * Time ranges for the event log.
 *
 * The boundaries are worked out in the browser, where the user's timezone lives,
 * and sent as ISO instants. Sending "2026-08-18" instead would have the server —
 * which runs in UTC — decide where the day starts, putting late-evening events on
 * the wrong day for anyone west of UTC.
 */

export const EVENT_RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Past week" },
  { value: "30d", label: "Past 30 days" },
  { value: "custom", label: "Custom range" },
] as const;

export type EventRangeKey = (typeof EVENT_RANGES)[number]["value"];

/** The range the log opens on, matching what the page server-renders. */
export const DEFAULT_EVENT_RANGE: EventRangeKey = "30d";

const DAY = 86_400_000;

export interface RangeBounds {
  from?: string;
  to?: string;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/**
 * ISO bounds for a range. `to` is left open for the rolling ranges, so an event
 * logged while the page is up still falls inside "today".
 *
 * A custom range missing either end returns nothing to filter on rather than
 * half a range, which would silently show far more than the user asked for.
 */
export function eventRangeBounds(
  range: EventRangeKey,
  customFrom?: string,
  customTo?: string,
  now: Date = new Date(),
): RangeBounds {
  switch (range) {
    case "today":
      return { from: startOfDay(now).toISOString() };
    case "7d":
      return { from: new Date(now.getTime() - 7 * DAY).toISOString() };
    case "30d":
      return { from: new Date(now.getTime() - 30 * DAY).toISOString() };
    case "custom": {
      if (!customFrom || !customTo) return {};
      // Parsed as local dates: "2026-08-18" through the Date constructor is UTC
      // midnight, which is the previous day in every timezone behind UTC.
      const [fy, fm, fd] = customFrom.split("-").map(Number);
      const [ty, tm, td] = customTo.split("-").map(Number);
      if (!fy || !ty) return {};
      return {
        from: startOfDay(new Date(fy, fm - 1, fd)).toISOString(),
        to: endOfDay(new Date(ty, tm - 1, td)).toISOString(),
      };
    }
  }
}

/** A range's bounds as query params, ready for the log and export endpoints. */
export function eventRangeParams(
  range: EventRangeKey,
  customFrom?: string,
  customTo?: string,
): URLSearchParams {
  const { from, to } = eventRangeBounds(range, customFrom, customTo);
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return params;
}
