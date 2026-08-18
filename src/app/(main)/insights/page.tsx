"use client";
import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, Download, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { InsightRow } from "@/components/insights/InsightRow";
import { EditFeedbackModal } from "@/components/insights/EditFeedbackModal";
import { FeedbackPanel } from "@/components/insights/FeedbackPanel";
import { ImportCsvModal } from "@/components/ImportCsvModal";
import { AIQABar } from "@/components/insights/AIQABar";
import { Button } from "@/components/ui/Button";
import { RowCount } from "@/components/ui/RowCount";
import { Pagination } from "@/components/ui/Pagination";
import type { InsightItem } from "@/lib/types";
import { AREA_LABELS, THEME_LABELS, areaLabel, themeLabel } from "@/lib/labels";
import { SOURCE_CATEGORIES, sourceCategory } from "@/lib/sources";
import { PERSONA_ROLES, personaRoles } from "@/lib/personas";

const BUILT_IN_AREAS = Object.keys(AREA_LABELS);
const BUILT_IN_THEMES = Object.keys(THEME_LABELS);

type SortKey =
  | "productArea" | "theme" | "persona" | "oneLiner" | "client"
  | "sourceName" | "date" | "createdBy" | "commentCount";

// Order here drives the header; InsightRow renders its cells to match.
const PAGE_SIZE = 20;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "productArea", label: "Area" },
  { key: "theme", label: "Theme" },
  { key: "persona", label: "Persona" },
  { key: "oneLiner", label: "Feedback" },
  { key: "client", label: "Client" },
  { key: "sourceName", label: "Source" },
  { key: "date", label: "Date" },
  { key: "createdBy", label: "Reporter" },
  { key: "commentCount", label: "Comments" },
];

export default function FeedbackPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={<div className="p-8" />}>
      <Feedback />
    </Suspense>
  );
}

function Feedback() {
  const [search, setSearch] = useState("");
  // Each filter holds every picked value; empty means "all".
  const [productArea, setProductArea] = useState<string[]>([]);
  const [theme, setTheme] = useState<string[]>([]);
  const [persona, setPersona] = useState<string[]>([]);
  // Seeded from ?client=<name> so the "N entries from this client" link on
  // /clients lands here already filtered to that account.
  const [client, setClient] = useState<string[]>(useSearchParams().getAll("client"));
  const [source, setSource] = useState<string[]>([]);
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);
  const [items, setItems] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [modal, setModal] = useState<InsightItem | null | "new">(null);
  // /insights/<id> redirects here as ?open=<id>, so old links, the home page's
  // recent list, the AI citations and any bookmark all open the panel.
  const [panelId, setPanelId] = useState<string | null>(useSearchParams().get("open"));
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  // Count of every entry, ignoring filters — the denominator in "23/245".
  const [grandTotal, setGrandTotal] = useState(0);

  const [facets, setFacets] = useState<{ areas: string[]; themes: string[] }>({ areas: [], themes: [] });
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/insights/facets")
      .then((r) => r.json())
      .then((d) => {
        setClients((d.clients ?? []).map((c: string) => ({ value: c, label: c })));
        setFacets({ areas: d.areas ?? [], themes: d.themes ?? [] });
        setMe(d.me ?? null);
      })
      .catch(() => {});
  }, []);

  // Every role, not just the ones the loaded rows happen to produce: a newly
  // added role (Coder, Clinic manager) has no entries yet and would otherwise
  // be invisible here. Matches how the area and theme filters offer all the
  // built-in values; only the derived Source list is present-only.
  const personaOptions = useMemo(
    () => PERSONA_ROLES.map((r) => ({ value: r, label: r })),
    []
  );

  // Only categories actually present are worth offering — plus any already
  // picked, which the area/theme/client filters may have narrowed out of view.
  // Dropping a picked one would leave it filtering with no way to untick it.
  const sourceOptions = useMemo(() => {
    const present = new Set(items.map((i) => sourceCategory(i.sourceName, i.sourceType)));
    return SOURCE_CATEGORIES
      .filter((c) => present.has(c) || source.includes(c))
      .map((c) => ({ value: c, label: c }));
  }, [items, source]);

  // Built-in options plus any custom values already in use, so a custom area
  // someone added is filterable rather than invisible.
  const areaOptions = useMemo(
    () => [...new Set([...BUILT_IN_AREAS, ...facets.areas])]
      .map((v) => ({ value: v, label: areaLabel(v) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [facets.areas]
  );

  const themeOptions = useMemo(
    () => [...new Set([...BUILT_IN_THEMES, ...facets.themes])]
      .map((v) => ({ value: v, label: themeLabel(v) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [facets.themes]
  );

  // Load all items whenever the DB-side filters change (not search — that's client-side)
  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    // Repeated rather than comma-joined: a client name may contain a comma.
    for (const v of productArea) params.append("productArea", v);
    for (const v of theme) params.append("theme", v);
    for (const v of client) params.append("client", v);
    // Sorting and search are client-side, so every row is loaded up front.
    // Kept well above the current row count; revisit if this grows past ~2k.
    params.set("limit", "2000");
    const res = await fetch(`/api/insights?${params}`);
    const data = await res.json();
    setItems(data.insights ?? []);
    setGrandTotal(data.grandTotal ?? (data.insights?.length ?? 0));
    setLoading(false);
  }, [productArea, theme, client]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // A linked entry the current filters exclude isn't in `items`, which would
  // leave the panel silently not opening. Fetch it in and keep track of which
  // ids we've tried, so a deleted id doesn't retry on every render.
  const fetchedIds = useRef(new Set<string>());
  useEffect(() => {
    if (!panelId || loading) return;
    if (items.some((i) => i.id === panelId) || fetchedIds.current.has(panelId)) return;
    fetchedIds.current.add(panelId);
    fetch(`/api/insights/${panelId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((found) => found && setItems((prev) => [found, ...prev]))
      .catch(() => {});
  }, [panelId, loading, items]);

  // Search filtered client-side — instant, no API call
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (source.length && !source.includes(sourceCategory(item.sourceName, item.sourceType))) return false;
      // A persona naming several roles matches a filter on any of them.
      if (persona.length && !personaRoles(item.persona).some((r) => persona.includes(r))) return false;
      if (!q) return true;
      return (
        item.oneLiner.toLowerCase().includes(q) ||
        (item.content && item.content.toLowerCase().includes(q)) ||
        // Personas are mostly names, so this is the only way to find "Joe Hefner".
        (item.persona && item.persona.toLowerCase().includes(q))
      );
    });
  }, [items, search, source, persona]);

  // Sorted client-side too — everything is already loaded, so this is instant.
  const displayed = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;

    // Empty values always sort last regardless of direction, so a column of
    // mostly-blank cells doesn't bury the rows that actually have data.
    const rank = (item: InsightItem): string | number | null => {
      switch (sortKey) {
        case "productArea": return areaLabel(item.productArea);
        case "theme": return themeLabel(item.theme);
        case "persona": return item.persona?.toLowerCase() || null;
        case "client": return item.client?.toLowerCase() || null;
        case "oneLiner": return item.oneLiner.toLowerCase();
        case "sourceName": return item.sourceName?.toLowerCase() || null;
        case "date": return item.date ? new Date(item.date).getTime() : null;
        case "createdBy": return item.createdBy?.toLowerCase() || null;
        case "commentCount": return item.commentCount ?? 0;
      }
    };

    return [...filtered].sort((a, b) => {
      const av = rank(a);
      const bv = rank(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  /** Wraps a filter setter so changing it also returns to the first page —
   *  page 4 of an old result set is meaningless against a new one. */
  function onFilter<T>(set: (value: T) => void) {
    return (value: T) => {
      setPage(1);
      set(value);
    };
  }

  const pageCount = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  // Clamped rather than trusted: a filter that shrinks the set would otherwise
  // leave the table on a page that no longer exists.
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const pageRows = displayed.slice(start, start + PAGE_SIZE);

  // Same column toggles direction; a new column starts descending for dates
  // and counts (newest / most first) and ascending for text.
  const toggleSort = (key: SortKey) => {
    setPage(1);
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" || key === "commentCount" ? "desc" : "asc");
    }
  };

  // Optimistic, but rolled back if the request fails — otherwise a failed
  // delete looks successful until the next refresh.
  const handleDelete = async (id: string) => {
    const snapshot = items;
    setDeleteError(null);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setGrandTotal((n) => Math.max(0, n - 1));
    try {
      const res = await fetch(`/api/insights/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
    } catch (e) {
      setItems(snapshot);
      setGrandTotal((n) => n + 1);
      setDeleteError(`Couldn't delete that entry — ${(e as Error).message}. It's still saved.`);
    }
  };

  const handleSaved = (saved: InsightItem) => {
    const isNew = !items.find((i) => i.id === saved.id);
    if (isNew) {
      setItems((prev) => [saved, ...prev]);
      setGrandTotal((n) => n + 1);
    } else {
      setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
    }
    setModal(null);
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    for (const v of productArea) params.append("productArea", v);
    for (const v of theme) params.append("theme", v);
    for (const v of client) params.append("client", v);
    window.location.href = `/api/insights/export?${params}`;
  };

  // Derived rather than stored, so an edit saved through the modal is reflected
  // in the panel behind it instead of showing the pre-edit copy.
  const panelItem = panelId ? items.find((i) => i.id === panelId) ?? null : null;

  const hasFilters =
    !!search || !!productArea.length || !!theme.length || !!persona.length || !!client.length || !!source.length;
  const editingItem = modal !== "new" ? modal : null;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Client feedback</h1>
            <p className="text-[14px] text-brand-primary opacity-50">
              From client sessions, onsites, Jira, and feedback threads
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setModal("new")}>
              <Plus className="w-4 h-4" />
              Add feedback
            </Button>
          </div>
        </div>

        <AIQABar />

        {deleteError && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[13px] text-red-700">{deleteError}</p>
            <button
              onClick={() => setDeleteError(null)}
              className="text-[13px] text-red-700 opacity-60 hover:opacity-100 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-60"
          />
          <MultiSelect value={productArea} onChange={onFilter(setProductArea)} options={areaOptions} placeholder="All product areas" className="w-44" />
          <MultiSelect value={theme} onChange={onFilter(setTheme)} options={themeOptions} placeholder="All themes" className="w-40" />
          <MultiSelect value={persona} onChange={onFilter(setPersona)} options={personaOptions} placeholder="All personas" className="w-40" />
          <MultiSelect value={client} onChange={onFilter(setClient)} options={clients} placeholder="All clients" className="w-44" />
          <MultiSelect value={source} onChange={onFilter(setSource)} options={sourceOptions} placeholder="All sources" className="w-40" />
          {hasFilters && (
            <Button
              variant="text"
              size="sm"
              onClick={() => { setSearch(""); setProductArea([]); setTheme([]); setPersona([]); setClient([]); setSource([]); setPage(1); }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {!loading && displayed.length > 0 && (
          <RowCount shown={displayed.length} total={grandTotal} noun="entries" className="mb-3" />
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-white rounded-md animate-pulse border border-[rgba(50,43,95,0.08)]" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-brand-primary opacity-40 text-[15px]">
              {search ? `No results for "${search}"` : "No feedback found"}
            </p>
            <p className="text-brand-primary opacity-30 text-[13px] mt-1">
              Try adjusting your filters or adding new feedback
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-[rgba(50,43,95,0.08)] overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(50,43,95,0.1)] bg-[rgba(50,43,95,0.03)]">
                  {COLUMNS.map((col) => {
                    const active = sortKey === col.key;
                    return (
                      <th key={col.key} className="text-left py-0 px-0">
                        <button
                          onClick={() => toggleSort(col.key)}
                          aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                          className={`w-full flex items-center gap-1 py-3 px-4 text-[12px] font-semibold uppercase tracking-wide transition-colors ${
                            active
                              ? "text-brand-secondary-600 opacity-100"
                              : "text-brand-primary opacity-60 hover:opacity-90"
                          }`}
                          title={`Sort by ${col.label}`}
                        >
                          {col.label}
                          {active ? (
                            sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3 opacity-20" />
                          )}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((item) => (
                  <InsightRow key={item.id} insight={item} onOpen={(i) => setPanelId(i.id)} />
                ))}
              </tbody>
            </table>
            <Pagination
              page={current}
              pageCount={pageCount}
              start={start}
              pageSize={PAGE_SIZE}
              total={displayed.length}
              noun="entries"
              onPage={setPage}
            />
          </div>
        )}
      </div>

      {showImport && (
        <ImportCsvModal
          type="feedback"
          title="Import client feedback"
          columns="Product Area, Theme, Persona / POC, One-liner, Feedback, Date, WTP, Source, Client"
          onClose={() => setShowImport(false)}
          onImported={() => fetchItems()}
        />
      )}

      {panelItem && (
        <FeedbackPanel
          item={panelItem}
          currentUser={me}
          onEdit={(i) => setModal(i)}
          onDelete={(id) => { setPanelId(null); handleDelete(id); }}
          onClose={() => setPanelId(null)}
        />
      )}

      {modal !== null && (
        <EditFeedbackModal
          item={editingItem}
          onSave={handleSaved}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
