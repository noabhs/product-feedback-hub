"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, Search, Download } from "lucide-react";
import { ACTION_LABELS } from "@/lib/events";
import { shortName } from "@/lib/people";
import { RowCount } from "@/components/ui/RowCount";
import { Pagination } from "@/components/ui/Pagination";
import {
  EVENT_RANGES,
  DEFAULT_EVENT_RANGE,
  eventRangeParams,
  type EventRangeKey,
} from "@/lib/event-range";

export interface EventRow {
  id: string;
  actor: string;
  action: string;
  label: string | null;
  target: string | null;
  /** ISO string — Dates don't survive the server→client boundary as Dates. */
  createdAt: string;
}

type SortKey = "createdAt" | "actor" | "action";

const PAGE_SIZE = 10;

function fmtWhen(iso: string) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  const abs = d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (mins < 1) return { abs, rel: "just now" };
  if (mins < 60) return { abs, rel: `${mins}m ago` };
  if (mins < 60 * 24) return { abs, rel: `${Math.round(mins / 60)}h ago` };
  return { abs, rel: `${Math.round(mins / (60 * 24))}d ago` };
}

const TH = "text-left text-[11px] font-semibold uppercase tracking-wide text-brand-primary opacity-45 px-3 py-2";
const SELECT =
  "text-[13px] border border-[rgba(50,43,95,0.12)] rounded-sm px-2.5 py-1.5 bg-white text-brand-primary focus:outline-none focus:border-brand-secondary-500";

function SortHeader({
  label,
  keyName,
  sort,
  desc,
  onSort,
}: {
  label: string;
  keyName: SortKey;
  sort: SortKey;
  desc: boolean;
  onSort: (key: SortKey) => void;
}) {
  const active = sort === keyName;
  const Icon = desc ? ArrowDown : ArrowUp;
  return (
    <th className={TH}>
      <button
        onClick={() => onSort(keyName)}
        className={`flex items-center gap-1 uppercase tracking-wide ${
          active ? "text-brand-secondary-600 opacity-100" : "hover:text-brand-primary"
        }`}
      >
        {label}
        {active && <Icon className="w-3 h-3" />}
      </button>
    </th>
  );
}

export function EventLog({ events }: { events: EventRow[] }) {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [desc, setDesc] = useState(true);
  const [page, setPage] = useState(1);

  // The page server-renders the default range, so `loaded` starts null and the
  // prop is used as-is. Any other range is fetched.
  const [range, setRange] = useState<EventRangeKey>(DEFAULT_EVENT_RANGE);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loaded, setLoaded] = useState<EventRow[] | null>(null);
  const [capped, setCapped] = useState(false);
  const [loading, setLoading] = useState(false);

  const source = loaded ?? events;

  /** Fetched from the change handlers rather than an effect, so nothing is set
   *  synchronously during render and the range only reloads when it's asked to. */
  async function loadRange(next: EventRangeKey, from: string, to: string) {
    if (next === DEFAULT_EVENT_RANGE) {
      setLoaded(null);
      setCapped(false);
      return;
    }
    // An incomplete custom range would otherwise query wide open.
    if (next === "custom" && (!from || !to)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events?${eventRangeParams(next, from, to)}`);
      const data = await res.json();
      setLoaded(data.events ?? []);
      setCapped((data.total ?? 0) > (data.limit ?? Infinity));
    } catch {
      setLoaded([]);
    } finally {
      setLoading(false);
    }
  }

  function pickRange(next: EventRangeKey) {
    setRange(next);
    setPage(1);
    void loadRange(next, customFrom, customTo);
  }

  function pickCustom(from: string, to: string) {
    setCustomFrom(from);
    setCustomTo(to);
    setPage(1);
    void loadRange("custom", from, to);
  }

  function exportCsv() {
    const params = eventRangeParams(range, customFrom, customTo);
    if (actor) params.set("actor", actor);
    if (action) params.set("action", action);
    if (q.trim()) params.set("search", q.trim());
    window.location.href = `/api/events/export?${params}`;
  }

  const actors = useMemo(
    () => Array.from(new Set(source.map((e) => e.actor))).sort(),
    [source]
  );
  const actions = useMemo(
    () => Array.from(new Set(source.map((e) => e.action))).sort(),
    [source]
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = source.filter((e) => {
      if (actor && e.actor !== actor) return false;
      if (action && e.action !== action) return false;
      if (needle) {
        const hay = `${e.actor} ${ACTION_LABELS[e.action] ?? e.action} ${e.label ?? ""} ${e.target ?? ""}`;
        if (!hay.toLowerCase().includes(needle)) return false;
      }
      return true;
    });

    const dir = desc ? -1 : 1;
    return [...filtered].sort((a, b) => {
      if (sort === "createdAt") return dir * a.createdAt.localeCompare(b.createdAt);
      if (sort === "actor") return dir * a.actor.localeCompare(b.actor);
      const al = ACTION_LABELS[a.action] ?? a.action;
      const bl = ACTION_LABELS[b.action] ?? b.action;
      // Ties within an action sort newest-first so the group reads chronologically.
      return dir * (al.localeCompare(bl) || a.createdAt.localeCompare(b.createdAt));
    });
  }, [source, actor, action, q, sort, desc]);

  function toggleSort(key: SortKey) {
    setPage(1);
    if (key === sort) {
      setDesc(!desc);
    } else {
      setSort(key);
      setDesc(key === "createdAt"); // time defaults newest-first, names A→Z
    }
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // Clamped rather than trusted: a filter that shrinks the set mid-read would
  // otherwise leave the view on a page that no longer exists.
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)]">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[14px] font-semibold text-brand-primary">Event log</h2>
            <p className="text-[12px] text-brand-primary opacity-45 mt-0.5">
              Who did what, and when
              {capped && " — showing the most recent 600 in this range; the export has all of them"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RowCount shown={rows.length} total={source.length} noun="events" />
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-secondary-600 border border-[rgba(93,7,226,0.25)] rounded-sm px-2.5 py-1.5 hover:bg-[rgba(93,7,226,0.05)] transition-colors"
              title="Download every event in this range as CSV, ignoring the 600-row display cap"
            >
              <Download className="w-3.5 h-3.5" />
              Export full report
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-primary opacity-35" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search events"
              className="text-[13px] border border-[rgba(50,43,95,0.12)] rounded-sm pl-8 pr-2.5 py-1.5 w-56 bg-white text-brand-primary focus:outline-none focus:border-brand-secondary-500"
            />
          </div>
          <select value={range} onChange={(e) => pickRange(e.target.value as EventRangeKey)} className={SELECT}>
            {EVENT_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {range === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => pickCustom(e.target.value, customTo)}
                className={SELECT}
              />
              <span className="text-[12px] text-brand-primary opacity-40">to</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => pickCustom(customFrom, e.target.value)}
                className={SELECT}
              />
            </>
          )}
          <select value={actor} onChange={(e) => { setActor(e.target.value); setPage(1); }} className={SELECT}>
            <option value="">All people</option>
            {actors.map((a) => (
              <option key={a} value={a}>
                {shortName(a)}
              </option>
            ))}
          </select>
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className={SELECT}>
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABELS[a] ?? a}
              </option>
            ))}
          </select>
          {(actor || action || q) && (
            <button
              onClick={() => {
                setActor("");
                setAction("");
                setQ("");
                setPage(1);
              }}
              className="text-[12px] text-brand-secondary-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-y border-[rgba(50,43,95,0.08)] bg-[rgba(50,43,95,0.015)]">
            <tr>
              <SortHeader label="Who" keyName="actor" sort={sort} desc={desc} onSort={toggleSort} />
              <SortHeader label="What" keyName="action" sort={sort} desc={desc} onSort={toggleSort} />
              <th className={TH}>Detail</th>
              <SortHeader label="When" keyName="createdAt" sort={sort} desc={desc} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((e) => {
              const when = fmtWhen(e.createdAt);
              return (
                <tr
                  key={e.id}
                  className="border-b border-[rgba(50,43,95,0.05)] hover:bg-[rgba(50,43,95,0.02)]"
                >
                  <td className="px-3 py-2.5 align-top">
                    <span
                      className="text-[13px] font-medium text-brand-primary whitespace-nowrap"
                      title={e.actor}
                    >
                      {shortName(e.actor)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <span className="text-[13px] text-brand-primary whitespace-nowrap">
                      {ACTION_LABELS[e.action] ?? e.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-top max-w-md">
                    <span className="text-[12.5px] text-brand-primary opacity-60 line-clamp-2">
                      {e.label ?? e.target ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-top whitespace-nowrap">
                    <span className="text-[12.5px] text-brand-primary opacity-60" title={when.abs}>
                      {when.abs}
                    </span>
                    <span className="text-[11px] text-brand-primary opacity-35 ml-1.5">
                      {when.rel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="text-[13px] text-brand-primary opacity-45 px-5 py-8 text-center">
            {loading
              ? "Loading…"
              : range === "custom" && (!customFrom || !customTo)
                ? "Pick a start and end date."
                : "No events match these filters."}
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <Pagination
          page={current}
          pageCount={pageCount}
          start={start}
          pageSize={PAGE_SIZE}
          total={rows.length}
          noun="events"
          onPage={setPage}
        />
      )}
    </div>
  );
}
