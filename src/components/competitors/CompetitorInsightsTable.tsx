"use client";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { RowCount } from "@/components/ui/RowCount";
import { ClaimRow } from "@/components/competitors/ClaimRow";
import { COMPETITOR_TOPIC_OPTIONS, CONFIDENCE_OPTIONS, AREA_OPTIONS } from "@/lib/labels";
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

export function CompetitorInsightsTable() {
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
        <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] px-4">
          {filtered.map((c) => (
            <ClaimRow key={c.id} claim={c} showCompetitor />
          ))}
        </div>
      )}
    </div>
  );
}
