"use client";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { Search, ArrowUp, ArrowDown, Lock, Info } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { RowCount } from "@/components/ui/RowCount";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { CONFIDENCE_STYLE } from "@/components/competitors/ClaimRow";
import {
  COMPETITOR_TOPIC_OPTIONS, CONFIDENCE_OPTIONS, AREA_OPTIONS,
  competitorTopicLabel, confidenceLabel, areaLabel, CONFIDENCE_LABELS, CONFIDENCE_DESCRIPTIONS,
} from "@/lib/labels";
import type { CompetitorInsightItem } from "@/lib/types";

/**
 * Every competitor claim in one filterable list.
 *
 * Deliberately its own table on /competitors rather than rows in the client
 * insights hub. They answer different questions and mixing them would blur the
 * one distinction that matters most here: a client told us this, versus a
 * competitor's deck says this about itself.
 *
 * Filtered in the browser over the full set, the same way the feedback table
 * works — a few hundred rows makes a round trip per checkbox pure cost.
 */

const SENSITIVITY_OPTIONS = [
  { value: "internal", label: "Internal only" },
  { value: "external", label: "Shareable" },
];

type SortKey = "competitorName" | "oneLiner" | "topics" | "productAreas" | "confidence" | "sensitivity";

const PAGE_SIZE = 25;

// Same fixed-width approach as the feedback table; the claim takes the rest.
const COLUMNS: { key: SortKey; label: string; width?: string; hint?: string }[] = [
  { key: "competitorName", label: "Competitor", width: "9rem" },
  { key: "oneLiner", label: "Claim" },
  { key: "topics", label: "Topics", width: "9.5rem" },
  { key: "productAreas", label: "Areas", width: "9rem" },
  {
    key: "confidence",
    label: "Confidence",
    width: "7.5rem",
    hint:
      "How well-sourced the claim is, as judged from its source document.\n" +
      Object.entries(CONFIDENCE_LABELS).map(([k, l]) => `${l}: ${CONFIDENCE_DESCRIPTIONS[k]}`).join("\n"),
  },
  {
    key: "sensitivity",
    label: "Visibility",
    width: "6.5rem",
    hint: "Internal: not for sharing outside Navina (our pricing, strategy, named clients, private intel). Shareable: public information about the competitor.",
  },
];

function sortValue(c: CompetitorInsightItem, key: SortKey): string {
  const v = c[key];
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

export function CompetitorInsightsTable({ onOpen }: { onOpen: (claim: CompetitorInsightItem) => void }) {
  const [sortKey, setSortKey] = useState<SortKey>("competitorName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [claims, setClaims] = useState<CompetitorInsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [confidences, setConfidences] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [sensitivities, setSensitivities] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/competitors/insights");
        const data = await res.json();
        if (!cancelled) setClaims(data.insights ?? []);
      } catch {
        if (!cancelled) setClaims([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Only competitors that actually have claims — the other 35 are noise here. */
  const competitorOptions = useMemo(() => {
    const names = [...new Set(claims.map((c) => c.competitorName))].sort();
    return names.map((n) => ({ value: n, label: n }));
  }, [claims]);

  useEffect(() => {
    setPage(1);
  }, [search, competitors, topics, confidences, areas, sensitivities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return claims.filter((c) => {
      if (q && !`${c.oneLiner} ${c.content} ${c.competitorName}`.toLowerCase().includes(q)) return false;
      if (competitors.length && !competitors.includes(c.competitorName)) return false;
      if (topics.length && !c.topics.some((t) => topics.includes(t))) return false;
      if (confidences.length && !confidences.includes(c.confidence)) return false;
      if (areas.length && !c.productAreas.some((a) => areas.includes(a))) return false;
      if (sensitivities.length && !sensitivities.includes(c.sensitivity)) return false;
      return true;
    });
  }, [claims, search, competitors, topics, confidences, areas, sensitivities]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => dir * sortValue(a, sortKey).localeCompare(sortValue(b, sortKey)));
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const pageRows = sorted.slice(start, start + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-11 bg-white rounded-md animate-pulse border border-[rgba(50,43,95,0.08)]" />
        ))}
      </div>
    );
  }

  if (!claims.length) {
    return (
      <div className="text-center py-16">
        <p className="text-brand-primary opacity-40 text-[15px]">No competitor claims yet</p>
        <p className="text-brand-primary opacity-30 text-[13px] mt-1.5 max-w-md mx-auto">
          Claims are read out of the documents behind each competitor&rsquo;s links. Run the ingestion
          once a Notion token and a Google service account are in place.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Input
          icon={<Search className="w-4 h-4" />}
          placeholder="Search claims…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
        <MultiSelect
          value={competitors}
          onChange={setCompetitors}
          options={competitorOptions}
          placeholder="All competitors"
        />
        <MultiSelect value={topics} onChange={setTopics} options={COMPETITOR_TOPIC_OPTIONS} placeholder="All topics" />
        <MultiSelect
          value={confidences}
          onChange={setConfidences}
          options={CONFIDENCE_OPTIONS}
          placeholder="Any confidence"
        />
        <MultiSelect value={areas} onChange={setAreas} options={AREA_OPTIONS} placeholder="Any product area" />
        <MultiSelect
          value={sensitivities}
          onChange={setSensitivities}
          options={SENSITIVITY_OPTIONS}
          placeholder="Internal and shareable"
        />
      </div>

      <RowCount shown={filtered.length} total={claims.length} noun="claims" className="mb-2" />

      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <p className="text-brand-primary opacity-40 text-[14px]">No claims match these filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-md border border-[rgba(50,43,95,0.08)] overflow-x-auto">
          <table className="w-full table-fixed min-w-[960px]">
            <colgroup>
              {COLUMNS.map((col) => (
                <col key={col.key} style={col.width ? { width: col.width } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-[rgba(50,43,95,0.1)] bg-[rgba(50,43,95,0.03)]">
                {COLUMNS.map((col) => {
                  const active = sortKey === col.key;
                  return (
                    <th key={col.key} className="text-left py-0 px-0">
                      <button
                        onClick={() => toggleSort(col.key)}
                        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                        className={`w-full flex items-center gap-1 py-3 px-3 text-[12px] font-semibold uppercase tracking-wide transition-colors ${
                          active
                            ? "text-brand-secondary-600 opacity-100"
                            : "text-brand-primary opacity-60 hover:opacity-90"
                        }`}
                        title={col.hint ? `${col.hint}\n\nClick to sort` : `Sort by ${col.label}`}
                      >
                        <span className="truncate">{col.label}</span>
                        {col.hint && <Info className="w-3 h-3 shrink-0 opacity-40" />}
                        {active ? (
                          sortDir === "asc" ? <ArrowUp className="w-3 h-3 shrink-0" /> : <ArrowDown className="w-3 h-3 shrink-0" />
                        ) : (
                          <ArrowDown className="w-3 h-3 shrink-0 opacity-20" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) => {
                const internal = c.sensitivity === "internal";
                return (
                    <tr
                      key={c.id}
                      onClick={() => onOpen(c)}
                      className="group border-b border-[rgba(50,43,95,0.07)] hover:bg-[rgba(93,7,226,0.03)] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 align-top">
                        <span className="text-[13px] font-semibold text-brand-secondary-600 line-clamp-2 break-words">
                          {c.competitorName}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <span
                          className={clsx(
                            "text-[14px] font-medium text-brand-primary group-hover:text-brand-secondary-600 transition-colors leading-snug",
                            "line-clamp-2",
                          )}
                          title={c.oneLiner}
                        >
                          {c.oneLiner}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {c.topics.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="text-[10.5px] font-medium px-1.5 py-0.5 rounded-full bg-secondary-50 text-brand-secondary-600"
                            >
                              {competitorTopicLabel(t)}
                            </span>
                          ))}
                          {c.topics.length > 2 && (
                            <span
                              className="text-[11px] text-brand-primary opacity-40 self-center"
                              title={c.topics.map(competitorTopicLabel).join(", ")}
                            >
                              +{c.topics.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {c.productAreas.slice(0, 2).map((a) => (
                            <Badge key={a} type="area" value={a} />
                          ))}
                          {c.productAreas.length > 2 && (
                            <span
                              className="text-[11px] text-brand-primary opacity-40 self-center"
                              title={c.productAreas.map(areaLabel).join(", ")}
                            >
                              +{c.productAreas.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <span
                          className={clsx(
                            "text-[10.5px] font-medium px-1.5 py-0.5 rounded-full",
                            CONFIDENCE_STYLE[c.confidence] ?? "bg-gray-50 text-gray-600",
                          )}
                        >
                          {confidenceLabel(c.confidence)}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        {internal ? (
                          <span
                            title={c.sensitivityReason ?? "Not for sharing outside Navina"}
                            className="inline-flex items-center gap-1 text-[10.5px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            Internal
                          </span>
                        ) : (
                          <span className="text-[12px] text-brand-primary opacity-40">Shareable</span>
                        )}
                      </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            page={current}
            pageCount={pageCount}
            start={start}
            pageSize={PAGE_SIZE}
            total={sorted.length}
            noun="claims"
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
