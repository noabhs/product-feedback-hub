"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { Search } from "lucide-react";
import { COMPETITOR_CATEGORIES, COMPETITOR_SUBGROUPS } from "@/lib/competitor-categories";
import { CompetitorPanel } from "@/components/competitors/CompetitorPanel";
import { CompetitorIcon } from "@/components/competitors/CompetitorIcon";
import { CompetitorInsightsTable } from "@/components/competitors/CompetitorInsightsTable";
import { Input } from "@/components/ui/Input";
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
  const [search, setSearch] = useState(url.str("search"));
  // Kept in the URL like the other filters, so a link to the claims view lands
  // there rather than on the grid.
  const [view, setView] = useState(url.str("view") === "claims" ? "claims" : "competitors");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/competitors");
      const data = await res.json();
      if (!cancelled) {
        // Coverage is defaulted here rather than guarded at every read: this is
        // the one untyped boundary in the page, and a response from before the
        // field existed would otherwise crash the card subtitles.
        setCompetitors(
          (data.competitors ?? []).map((c: CompetitorItem) => ({
            ...c,
            coverage: c.coverage ?? { read: 0, empty: 0, skipped: 0, failed: 0, claims: 0, newestSourceAt: null },
          })),
        );
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useUrlState({ open: openId, search, view: view === "claims" ? "claims" : null });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? competitors.filter((c) => c.name.toLowerCase().includes(q)) : competitors;
  }, [competitors, search]);

  const sections = useMemo(
    () => COMPETITOR_CATEGORIES.map((category) => ({ category, groups: groupsFor(category, filtered) })).filter(
      (s) => s.groups.length > 0,
    ),
    [filtered],
  );

  const openCompetitor = openId ? competitors.find((c) => c.id === openId) ?? null : null;

  const claimTotal = useMemo(() => competitors.reduce((n, c) => n + c.coverage.claims, 0), [competitors]);

  /**
   * Across every competitor, not just the search results: this answers "can the
   * ask actually field a competitor question", which is a property of the whole
   * corpus. The unreachable count is the half that matters — a service account
   * reaches some of these Drive files and not others, and the misses are the
   * list worth chasing.
   */
  const coverage = useMemo(() => {
    const t = competitors.reduce(
      (a, c) => ({
        read: a.read + c.coverage.read,
        other: a.other + c.coverage.empty + c.coverage.skipped,
        failed: a.failed + c.coverage.failed,
      }),
      { read: 0, other: 0, failed: 0 },
    );
    return { ...t, total: t.read + t.other + t.failed };
  }, [competitors]);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Competitors</h1>
          <p className="text-[14px] text-brand-primary opacity-50 max-w-2xl">
            Who else our clients evaluate, grouped the same way as the CI Launcher tool this was
            pulled from. Open any competitor for its overview, every source link we have on it, and
            what we&rsquo;ve read out of those links.
          </p>
          {coverage.total > 0 && (
            <p className="text-[12px] text-brand-primary opacity-50 mt-2">
              Read {coverage.read} of {coverage.total} documents behind these links
              {coverage.failed > 0 && (
                <>
                  {" · "}
                  <span className="text-red-700 opacity-90">{coverage.failed} unreachable</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Two views over the same competitors: the roster, and every claim the
            hub has read about any of them. */}
        <div className="flex items-center gap-1 mb-5 border-b border-[rgba(50,43,95,0.1)]">
          {([
            { key: "competitors", label: `Competitors${competitors.length ? ` (${competitors.length})` : ""}` },
            { key: "claims", label: `What we know${claimTotal ? ` (${claimTotal})` : ""}` },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-3 py-2 text-[13px] font-medium -mb-px border-b-2 transition-colors ${
                view === tab.key
                  ? "border-brand-secondary-500 text-brand-primary"
                  : "border-transparent text-brand-primary opacity-45 hover:opacity-75"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {view === "claims" ? (
          <CompetitorInsightsTable />
        ) : (
          <>
        <div className="mb-5">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search competitors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-white rounded-md animate-pulse border border-[rgba(50,43,95,0.08)]" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-brand-primary opacity-40 text-[15px]">
              {search ? `No competitors match "${search}"` : "No competitors yet"}
            </p>
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
                      <div className="grid grid-cols-4 gap-2">
                        {rows.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setOpenId(c.id)}
                            className="flex items-center gap-2 text-left bg-white rounded-md border border-[rgba(50,43,95,0.08)] hover:bg-[rgba(93,7,226,0.03)] transition-colors px-3 py-2.5 min-w-0"
                          >
                            <CompetitorIcon name={c.name} website={c.website} />
                            <div className="min-w-0">
                              <p className="text-[14px] font-medium text-brand-primary truncate">{c.name}</p>
                              <p className="text-[12px] text-brand-primary opacity-40 mt-0.5">
                                {c.sources.length
                                  ? `${c.sources.length} source${c.sources.length === 1 ? "" : "s"}` +
                                    (c.coverage.claims ? ` · ${c.coverage.claims} claims` : "")
                                  : "No sources yet"}
                              </p>
                            </div>
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
          </>
        )}
      </div>

      {openCompetitor && (
        <CompetitorPanel key={openCompetitor.id} competitor={openCompetitor} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
