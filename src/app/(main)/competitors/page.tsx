"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { COMPETITOR_CATEGORIES, COMPETITOR_SUBGROUPS } from "@/lib/competitor-categories";
import { CompetitorPanel } from "@/components/competitors/CompetitorPanel";
import { useUrlReader, useUrlState } from "@/hooks/useUrlState";
import type { CompetitorItem } from "@/lib/types";

export default function CompetitorsPage() {
  // useSearchParams (via useUrlReader) needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={<div className="p-8" />}>
      <Competitors />
    </Suspense>
  );
}

/** One category, and within it, subgroups (in declared order) then ungrouped rows. */
function groupsFor(category: string, all: CompetitorItem[]): { subgroup: string | null; rows: CompetitorItem[] }[] {
  const subgroups = COMPETITOR_SUBGROUPS[category as keyof typeof COMPETITOR_SUBGROUPS] ?? [];
  const inCategory = all.filter((c) => c.category === category);
  const groups: { subgroup: string | null; rows: CompetitorItem[] }[] = subgroups.map((sg) => ({
    subgroup: sg,
    rows: inCategory.filter((c) => c.subgroup === sg),
  }));
  groups.push({ subgroup: null, rows: inCategory.filter((c) => !c.subgroup) });
  return groups.filter((g) => g.rows.length > 0);
}

function Competitors() {
  const url = useUrlReader();
  const [competitors, setCompetitors] = useState<CompetitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(url.str("open") || null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/competitors");
      const data = await res.json();
      if (!cancelled) {
        setCompetitors(data.competitors ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useUrlState({ open: openId });

  const sections = useMemo(
    () => COMPETITOR_CATEGORIES.map((category) => ({ category, groups: groupsFor(category, competitors) })).filter(
      (s) => s.groups.length > 0,
    ),
    [competitors],
  );

  const openCompetitor = openId ? competitors.find((c) => c.id === openId) ?? null : null;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Competitors</h1>
          <p className="text-[14px] text-brand-primary opacity-50 max-w-2xl">
            Who else our clients evaluate, grouped the same way as the CI Launcher tool this was
            pulled from. Open any competitor for its overview and every source link we have on it.
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-white rounded-md animate-pulse border border-[rgba(50,43,95,0.08)]" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-brand-primary opacity-40 text-[15px]">No competitors yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map(({ category, groups }) => (
              <div key={category}>
                <h2 className="text-[13px] font-bold text-brand-primary uppercase tracking-wide mb-3">
                  {category}
                </h2>
                <div className="space-y-4">
                  {groups.map(({ subgroup, rows }) => (
                    <div key={subgroup ?? "_"}>
                      {subgroup && (
                        <h3 className="text-[12px] font-semibold text-brand-primary opacity-50 mb-2 ml-1">
                          {subgroup}
                        </h3>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {rows.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setOpenId(c.id)}
                            className="text-left bg-white rounded-md border border-[rgba(50,43,95,0.08)] hover:bg-[rgba(93,7,226,0.03)] transition-colors px-4 py-3"
                          >
                            <p className="text-[14px] font-medium text-brand-primary">{c.name}</p>
                            <p className="text-[12px] text-brand-primary opacity-40 mt-0.5">
                              {c.sources.length
                                ? `${c.sources.length} source${c.sources.length === 1 ? "" : "s"}`
                                : "No sources yet"}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openCompetitor && (
        <CompetitorPanel key={openCompetitor.id} competitor={openCompetitor} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
