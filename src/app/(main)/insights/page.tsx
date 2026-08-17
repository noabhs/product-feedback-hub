"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Download, ArrowUp, ArrowDown } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { InsightRow } from "@/components/insights/InsightRow";
import { EditFeedbackModal } from "@/components/insights/EditFeedbackModal";
import { AIQABar } from "@/components/insights/AIQABar";
import { Button } from "@/components/ui/Button";
import type { InsightItem } from "@/lib/types";
import { AREA_LABELS, THEME_LABELS, areaLabel, themeLabel } from "@/lib/labels";

const BUILT_IN_AREAS = Object.keys(AREA_LABELS);
const BUILT_IN_THEMES = Object.keys(THEME_LABELS);

type SortKey =
  | "productArea" | "theme" | "client" | "oneLiner"
  | "sourceName" | "date" | "createdBy" | "commentCount";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "productArea", label: "Area" },
  { key: "theme", label: "Theme" },
  { key: "client", label: "Client" },
  { key: "oneLiner", label: "Feedback" },
  { key: "sourceName", label: "Source" },
  { key: "date", label: "Date" },
  { key: "createdBy", label: "Reporter" },
  { key: "commentCount", label: "Comments" },
];

export default function FeedbackPage() {
  const [search, setSearch] = useState("");
  const [productArea, setProductArea] = useState("");
  const [theme, setTheme] = useState("");
  const [client, setClient] = useState("");
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);
  const [items, setItems] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [modal, setModal] = useState<InsightItem | null | "new">(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [facets, setFacets] = useState<{ areas: string[]; themes: string[] }>({ areas: [], themes: [] });

  useEffect(() => {
    fetch("/api/insights/facets")
      .then((r) => r.json())
      .then((d) => {
        setClients((d.clients ?? []).map((c: string) => ({ value: c, label: c })));
        setFacets({ areas: d.areas ?? [], themes: d.themes ?? [] });
      })
      .catch(() => {});
  }, []);

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
    if (productArea) params.set("productArea", productArea);
    if (theme) params.set("theme", theme);
    if (client) params.set("client", client);
    params.set("limit", "500");
    const res = await fetch(`/api/insights?${params}`);
    const data = await res.json();
    setItems(data.insights ?? []);
    setLoading(false);
  }, [productArea, theme, client]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Search filtered client-side — instant, no API call
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.oneLiner.toLowerCase().includes(q) ||
        (item.content && item.content.toLowerCase().includes(q))
    );
  }, [items, search]);

  // Sorted client-side too — everything is already loaded, so this is instant.
  const displayed = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;

    // Empty values always sort last regardless of direction, so a column of
    // mostly-blank cells doesn't bury the rows that actually have data.
    const rank = (item: InsightItem): string | number | null => {
      switch (sortKey) {
        case "productArea": return areaLabel(item.productArea);
        case "theme": return themeLabel(item.theme);
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

  // Same column toggles direction; a new column starts descending for dates
  // and counts (newest / most first) and ascending for text.
  const toggleSort = (key: SortKey) => {
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
    try {
      const res = await fetch(`/api/insights/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
    } catch (e) {
      setItems(snapshot);
      setDeleteError(`Couldn't delete that entry — ${(e as Error).message}. It's still saved.`);
    }
  };

  const handleSaved = (saved: InsightItem) => {
    const isNew = !items.find((i) => i.id === saved.id);
    if (isNew) {
      setItems((prev) => [saved, ...prev]);
    } else {
      setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
    }
    setModal(null);
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (productArea) params.set("productArea", productArea);
    if (theme) params.set("theme", theme);
    if (client) params.set("client", client);
    window.location.href = `/api/insights/export?${params}`;
  };

  const hasFilters = !!(search || productArea || theme || client);
  const editingItem = modal !== "new" ? modal : null;

  const countLabel = search.trim()
    ? `${displayed.length} of ${items.length} entries`
    : `${items.length} entries`;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Client feedback</h1>
            <p className="text-[14px] text-brand-primary opacity-50">
              {items.length > 0 ? countLabel : "No entries yet"} from client sessions, onsites, and feedback
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
          <Select value={productArea} onChange={setProductArea} options={areaOptions} placeholder="All product areas" className="w-44" />
          <Select value={theme} onChange={setTheme} options={themeOptions} placeholder="All themes" className="w-40" />
          <Select value={client} onChange={setClient} options={clients} placeholder="All clients" className="w-44" />
          {hasFilters && (
            <Button
              variant="text"
              size="sm"
              onClick={() => { setSearch(""); setProductArea(""); setTheme(""); setClient(""); }}
            >
              Clear filters
            </Button>
          )}
        </div>

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
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {displayed.map((item) => (
                  <InsightRow key={item.id} insight={item} onDelete={handleDelete} onEdit={(i) => setModal(i)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
