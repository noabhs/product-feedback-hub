"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, LayoutGrid, List, Plus, Download } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { InsightCard } from "@/components/insights/InsightCard";
import { InsightRow } from "@/components/insights/InsightRow";
import { EditFeedbackModal } from "@/components/insights/EditFeedbackModal";
import { AIQABar } from "@/components/insights/AIQABar";
import { Button } from "@/components/ui/Button";
import type { InsightItem } from "@/components/insights/InsightCard";

const AREAS = [
  { value: "POP_HEALTH", label: "Pop health" },
  { value: "QUALITY", label: "Quality" },
  { value: "ANALYTICS", label: "Analytics" },
  { value: "AGENTIC", label: "Agentic" },
  { value: "RISK_DX", label: "Risk / Dx" },
  { value: "AMBIENT", label: "Ambient" },
  { value: "GENERAL", label: "General" },
  { value: "COMPETITIVE", label: "Competitive" },
];

const THEMES = [
  { value: "WORKFLOW", label: "Workflow" },
  { value: "DATA_INTEGRATION", label: "Data & integration" },
  { value: "TRUST", label: "Trust" },
  { value: "PAIN_POINTS", label: "Pain points" },
  { value: "GOALS", label: "Goals" },
  { value: "PRICING_WTP", label: "Pricing / WTP" },
  { value: "AGENTIC", label: "Agentic" },
];

type ViewMode = "cards" | "table";

export default function FeedbackPage() {
  const [search, setSearch] = useState("");
  const [productArea, setProductArea] = useState("");
  const [theme, setTheme] = useState("");
  const [client, setClient] = useState("");
  const [clients, setClients] = useState<{ value: string; label: string }[]>([]);
  const [items, setItems] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewMode>("cards");
  const [modal, setModal] = useState<InsightItem | null | "new">(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/insights/clients")
      .then((r) => r.json())
      .then((list: string[]) => setClients(list.map((c) => ({ value: c, label: c }))));
  }, []);

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
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.oneLiner.toLowerCase().includes(q) ||
        (item.content && item.content.toLowerCase().includes(q))
    );
  }, [items, search]);

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

        {/* Filters + view toggle */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
          <Select value={productArea} onChange={setProductArea} options={AREAS} placeholder="All product areas" className="w-44" />
          <Select value={theme} onChange={setTheme} options={THEMES} placeholder="All themes" className="w-40" />
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
          <div className="ml-auto flex items-center gap-1 bg-white border border-[rgba(50,43,95,0.15)] rounded-sm p-0.5">
            <button
              onClick={() => setView("cards")}
              title="Card view"
              className={`p-1.5 rounded-[8px] transition-colors ${view === "cards" ? "bg-brand-secondary-500 text-white" : "text-brand-primary opacity-40 hover:opacity-70"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("table")}
              title="Table view"
              className={`p-1.5 rounded-[8px] transition-colors ${view === "table" ? "bg-brand-secondary-500 text-white" : "text-brand-primary opacity-40 hover:opacity-70"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={view === "cards" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : ""}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-md animate-pulse border border-[rgba(50,43,95,0.08)]" />
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
        ) : view === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayed.map((item) => (
              <InsightCard key={item.id} insight={item} onDelete={handleDelete} onEdit={(i) => setModal(i)} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-md border border-[rgba(50,43,95,0.08)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(50,43,95,0.1)] bg-[rgba(50,43,95,0.03)]">
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-brand-primary opacity-60 uppercase tracking-wide">Area</th>
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-brand-primary opacity-60 uppercase tracking-wide">Theme</th>
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-brand-primary opacity-60 uppercase tracking-wide">Client</th>
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-brand-primary opacity-60 uppercase tracking-wide">Feedback</th>
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-brand-primary opacity-60 uppercase tracking-wide">Source</th>
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-brand-primary opacity-60 uppercase tracking-wide">Date</th>
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
