/**
 * Week boundaries for the Sunday recap.
 *
 * The week is Sunday 00:00 through Saturday 23:59:59 **in Israel time**, not UTC.
 * Vercel's cron and functions run in UTC, and a UTC week would put anything
 * logged after 21:00 Israel on a Saturday into the following week — so the
 * recap would report a number the person who logged it knows is wrong.
 *
 * Done with Intl rather than a date library: it is the only way to get an
 * offset that is correct across DST without adding a dependency.
 */

export const RECAP_TIMEZONE = "Asia/Jerusalem";

/** The zone's offset from UTC, in ms, at a given instant. */
function offsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(new Date(utcMs))
    .reduce<Record<string, number>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = Number(p.value);
      return acc;
    }, {});

  // Midnight reads as hour 24 in some locales' formatToParts output.
  const hour = parts.hour === 24 ? 0 : parts.hour;
  const asIfUtc = Date.UTC(parts.year, parts.month - 1, parts.day, hour, parts.minute, parts.second);
  return asIfUtc - utcMs;
}

/** The instant of local midnight on a given calendar date in the zone. */
function zonedMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day);
  // One correction is enough: the offset at local midnight and at the guess only
  // differ when a DST switch lands inside those few hours, and applying the
  // corrected guess's own offset resolves that.
  const corrected = guess - offsetMs(guess, timeZone);
  return new Date(guess - offsetMs(corrected, timeZone));
}

/**
 * Shift a calendar date by whole days. Pure y/m/d arithmetic — no zone involved,
 * which is exactly the point: subtracting 7 × 24h from an instant is an hour out
 * across a DST change, so the week start is derived as a *date* and only then
 * resolved to an instant.
 */
function addDays(year: number, month: number, day: number, days: number) {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** The calendar date and weekday in the zone at a given instant. */
function zonedParts(at: Date, timeZone: string) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(at);
  const get = (t: string) => f.find((p) => p.type === t)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: weekdays.indexOf(get("weekday")),
  };
}

export type PeriodKind = "week" | "month";

export interface WeekWindow {
  /** Inclusive start: Sunday 00:00 Israel, as a UTC instant. */
  start: Date;
  /** Exclusive end: the following Sunday 00:00 Israel. */
  end: Date;
  /** "Aug 10–16" — the range a reader recognises. */
  label: string;
  /** "2026-08-10", the idempotency key for "did we already post this?". */
  key: string;
  kind: PeriodKind;
}

/**
 * The last **completed** Sunday–Saturday week relative to `now`.
 *
 * Run on a Sunday, that is the week that ended the previous night — so every
 * number is final and no partial day is counted.
 */
export function lastCompleteWeek(now: Date = new Date()): WeekWindow {
  const today = zonedParts(now, RECAP_TIMEZONE);
  const thisSunday = addDays(today.year, today.month, today.day, -today.weekday);
  return weekStartingOn(addDays(thisSunday.year, thisSunday.month, thisSunday.day, -7));
}

/** The week before a given one, for the "vs last week" comparison. */
export function previousWeek(week: WeekWindow): WeekWindow {
  const s = zonedParts(week.start, RECAP_TIMEZONE);
  return weekStartingOn(addDays(s.year, s.month, s.day, -7));
}

function weekStartingOn({ year, month, day }: { year: number; month: number; day: number }): WeekWindow {
  const start = zonedMidnight(year, month, day, RECAP_TIMEZONE);
  const next = addDays(year, month, day, 7);
  const end = zonedMidnight(next.year, next.month, next.day, RECAP_TIMEZONE);
  return { start, end, label: rangeLabel(start, end), key: dateKey(start), kind: "week" };
}

/**
 * The calendar month containing `now`, ending at `now` when the month is still
 * running — so "August" on the 30th means the 1st through the 30th, not a month
 * with two empty days tacked on the end.
 */
export function monthToDate(now: Date = new Date()): WeekWindow {
  const { year, month } = zonedParts(now, RECAP_TIMEZONE);
  const start = zonedMidnight(year, month, 1, RECAP_TIMEZONE);
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const monthEnd = zonedMidnight(nextMonth.year, nextMonth.month, 1, RECAP_TIMEZONE);
  const end = now < monthEnd ? now : monthEnd;
  return { start, end, label: rangeLabel(start, end), key: `${year}-${String(month).padStart(2, "0")}`, kind: "month" };
}

/** The month before a period's start, whole — the comparison for a month recap. */
export function previousMonth(period: WeekWindow): WeekWindow {
  const { year, month } = zonedParts(period.start, RECAP_TIMEZONE);
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const start = zonedMidnight(prev.year, prev.month, 1, RECAP_TIMEZONE);
  const end = zonedMidnight(year, month, 1, RECAP_TIMEZONE);
  return { start, end, label: rangeLabel(start, end), key: `${prev.year}-${String(prev.month).padStart(2, "0")}`, kind: "month" };
}

function dateKey(d: Date): string {
  const { year, month, day } = zonedParts(d, RECAP_TIMEZONE);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "Aug 10–16", or "Aug 30 – Sep 5" when the week straddles a month. */
function rangeLabel(start: Date, endExclusive: Date): string {
  // Step back a day to name the last day *inside* the range. For a partial month
  // the end is "now" rather than a midnight boundary, so step back to that day
  // only when the end actually sits on midnight.
  const endParts = zonedParts(endExclusive, RECAP_TIMEZONE);
  const onBoundary =
    zonedMidnight(endParts.year, endParts.month, endParts.day, RECAP_TIMEZONE).getTime() ===
    endExclusive.getTime();
  const last = onBoundary ? new Date(endExclusive.getTime() - 86_400_000) : endExclusive;
  const opts = { timeZone: RECAP_TIMEZONE, month: "short", day: "numeric" } as const;
  const from = new Intl.DateTimeFormat("en-US", opts).format(start);
  const sameMonth = zonedParts(start, RECAP_TIMEZONE).month === zonedParts(last, RECAP_TIMEZONE).month;
  const to = sameMonth
    ? new Intl.DateTimeFormat("en-US", { timeZone: RECAP_TIMEZONE, day: "numeric" }).format(last)
    : new Intl.DateTimeFormat("en-US", opts).format(last);
  return sameMonth ? `${from}–${to}` : `${from} – ${to}`;
}
