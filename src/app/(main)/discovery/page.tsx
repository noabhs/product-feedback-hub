"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, FileText, Plus, Download, Upload, ChevronRight, ExternalLink, Trash2, Sparkles } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RowCount } from "@/components/ui/RowCount";
import { byline, shortName } from "@/lib/people";
import type { Question, Source } from "@/lib/types";
import { AddQuestionModal } from "@/components/discovery/AddQuestionModal";
import { AddSourceModal } from "@/components/discovery/AddSourceModal";
import { ImportCsvModal } from "@/components/ImportCsvModal";
import { AREA_OPTIONS as AREAS, areaLabel } from "@/lib/labels";

const THEMES = [
  { value: "WORKFLOW", label: "Workflow" },
  { value: "DATA_INTEGRATION", label: "Data & integration" },
  { value: "TRUST", label: "Trust" },
  { value: "PAIN_POINTS", label: "Pain points" },
  { value: "GOALS", label: "Goals" },
  { value: "PRICING_WTP", label: "Pricing / WTP" },
  { value: "AGENTIC", label: "Agentic" },
];

type Tab = "questions" | "sources";

const FORMAT_COLORS: Record<string, string> = {
  Call: "bg-blue-50 text-blue-700",
  Onsite: "bg-purple-50 text-purple-700",
  Notion: "bg-gray-50 text-gray-600",
  Slack: "bg-green-50 text-green-700",
  Email: "bg-orange-50 text-orange-700",
  Survey: "bg-yellow-50 text-yellow-700",
  QBR: "bg-red-50 text-red-700",
  Other: "bg-gray-50 text-gray-500",
};

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DiscoveryPage() {
  const [tab, setTab] = useState<Tab>("questions");

  // Questions state
  const [search, setSearch] = useState("");
  const [productArea, setProductArea] = useState("");
  const [theme, setTheme] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(false);
  const [qGrandTotal, setQGrandTotal] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Sources state
  const [sources, setSources] = useState<Source[]>([]);
  const [sLoading, setSLoading] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Fetch questions
  useEffect(() => {
    const load = async () => {
      setQLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (productArea) params.set("productArea", productArea);
      if (theme) params.set("theme", theme);
      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setQGrandTotal(data.grandTotal ?? (data.questions?.length ?? 0));
      setQLoading(false);
    };
    load();
  }, [search, productArea, theme, reloadKey]);

  // Fetch sources when tab opens
  useEffect(() => {
    if (tab !== "sources") return;
    const load = async () => {
      setSLoading(true);
      const res = await fetch("/api/sources");
      const data = await res.json();
      setSources(data.sources ?? []);
      setSLoading(false);
    };
    load();
  }, [tab]);

  function exportQuestions() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (productArea) params.set("productArea", productArea);
    if (theme) params.set("theme", theme);
    window.location.href = `/api/questions/export?${params}`;
  }

  // Optimistic, but rolled back if the request fails — otherwise a failed
  // delete looks successful until the next refresh.
  async function deleteSource(id: string) {
    const snapshot = sources;
    setDeleteError(null);
    setSources((prev) => prev.filter((s) => s.id !== id));
    try {
      const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
    } catch (e) {
      setSources(snapshot);
      setDeleteError(`Couldn't delete that source — ${(e as Error).message}. It's still saved.`);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Discovery</h1>
            <p className="text-[14px] text-brand-primary opacity-50 max-w-xl">
              Prepare for client discovery calls with structured questions curated from client sessions and product knowledge. Use the question library to generate ready-to-use docs.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <Button variant="ghost" size="sm" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={exportQuestions}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddQuestion(true)}>
              <Plus className="w-4 h-4" />
              Add question
            </Button>
            <Link href="/discovery/generate">
              <Button size="sm">
                <FileText className="w-4 h-4" />
                Generate doc
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[rgba(50,43,95,0.1)] mb-6">
          {(["questions", "sources"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-[14px] font-medium border-b-2 -mb-px transition-all capitalize ${
                tab === t
                  ? "border-brand-secondary-500 text-brand-secondary-500"
                  : "border-transparent text-brand-primary opacity-40 hover:opacity-70"
              }`}
            >
              {t === "questions" ? `Questions${questions.length ? ` (${questions.length})` : ""}` : "Sources library"}
            </button>
          ))}
        </div>

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

        {/* ── Questions tab ────────────────────────────────── */}
        {tab === "questions" && (
          <>
            <div className="flex flex-wrap gap-3 mb-5">
              <Input
                icon={<Search className="w-4 h-4" />}
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Select value={productArea} onChange={setProductArea} options={AREAS} placeholder="All product areas" className="w-44" />
              <Select value={theme} onChange={setTheme} options={THEMES} placeholder="All themes" className="w-40" />
              {(search || productArea || theme) && (
                <Button variant="text" size="sm" onClick={() => { setSearch(""); setProductArea(""); setTheme(""); }}>
                  Clear
                </Button>
              )}
            </div>

            {!qLoading && questions.length > 0 && (
              <RowCount shown={questions.length} total={qGrandTotal} noun="questions" className="mb-3" />
            )}

            {qLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white rounded-md animate-pulse border border-[rgba(50,43,95,0.06)]" />
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-brand-primary opacity-40 text-[15px]">No questions found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q) => (
                  <div key={q.id} className="bg-white rounded-md border border-[rgba(50,43,95,0.08)] overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                      className="w-full flex items-start gap-3 p-4 text-left hover:bg-[#f6f6fa] transition-colors"
                    >
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 mt-0.5 text-brand-primary opacity-40 transition-transform duration-200 ${expanded === q.id ? "rotate-90" : ""}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-brand-primary font-medium leading-snug">{q.question}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge type="area" value={q.productArea} />
                          <Badge type="theme" value={q.theme} />
                          {q.persona && <span className="text-[11px] text-brand-primary opacity-40">{q.persona}</span>}
                          <span
                            className="text-[11px] text-brand-primary opacity-30"
                            title={q.createdBy ?? "Imported before author tracking"}
                          >
                            {byline(q.createdBy)}
                          </span>
                        </div>
                      </div>
                    </button>
                    {expanded === q.id && (q.notesIntent || q.source) && (
                      <div className="px-10 pb-4 border-t border-[rgba(50,43,95,0.06)]">
                        {q.notesIntent && (
                          <p className="text-[13px] text-brand-primary opacity-60 mt-3 italic">{q.notesIntent}</p>
                        )}
                        {q.source && (
                          <p className="text-[12px] text-brand-secondary-600 mt-1">Source: {q.source}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Sources tab ──────────────────────────────────── */}
        {tab === "sources" && (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[14px] text-brand-primary opacity-50">
                {sources.length > 0 ? `${sources.length} sources` : "No sources yet"} — calls, onsites, docs, and other references used to build this library
              </p>
              <Button size="sm" onClick={() => setShowAddSource(true)}>
                <Plus className="w-4 h-4" />
                Add source
              </Button>
            </div>

            {!sLoading && sources.length > 0 && (
              <RowCount shown={sources.length} total={sources.length} noun="sources" className="mb-3" />
            )}

            {sLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 bg-white rounded-md animate-pulse border border-[rgba(50,43,95,0.06)]" />
                ))}
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-[rgba(50,43,95,0.08)]">
                <p className="text-brand-primary opacity-40 text-[15px] mb-1">No sources yet</p>
                <p className="text-brand-primary opacity-25 text-[13px]">Add calls, onsites, and docs that informed these questions</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(50,43,95,0.08)] bg-[rgba(50,43,95,0.02)]">
                      <th className="text-left py-3 px-4 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide">Source</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide w-28">Area</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide w-24">Format</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide w-28">Date</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide">Topics</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide w-28">Added by</th>
                      <th className="w-10 py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((s, i) => (
                      <tr
                        key={s.id}
                        className={`group ${i < sources.length - 1 ? "border-b border-[rgba(50,43,95,0.06)]" : ""} hover:bg-[rgba(50,43,95,0.02)] transition-colors`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {s.link ? (
                              <a
                                href={s.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[13px] font-medium text-brand-secondary-500 hover:underline flex items-center gap-1"
                              >
                                {s.name}
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            ) : (
                              <span className="text-[13px] font-medium text-brand-primary">{s.name}</span>
                            )}
                          </div>
                          {s.notes && (
                            <p className="text-[12px] text-brand-primary opacity-40 mt-0.5 line-clamp-1">{s.notes}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[12px] text-brand-primary opacity-50">
                            {areaLabel(s.productArea)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {s.format && (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${FORMAT_COLORS[s.format] ?? "bg-gray-50 text-gray-500"}`}>
                              {s.format}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[12px] text-brand-primary opacity-50">{fmtDate(s.date)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[12px] text-brand-primary opacity-60 line-clamp-1">{s.topics}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className="text-[12px] text-brand-primary opacity-45"
                            title={s.createdBy ?? "Imported before author tracking"}
                          >
                            {shortName(s.createdBy)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {s.link && (
                              <Link
                                href={`/upload?mode=questions&url=${encodeURIComponent(s.link)}&name=${encodeURIComponent(s.name)}`}
                                title="Extract discovery questions from this document"
                                className="opacity-0 group-hover:opacity-100 text-brand-primary opacity-30 hover:text-brand-secondary-500 hover:opacity-100 transition-all"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          <button
                            onClick={() => deleteSource(s.id)}
                            className="opacity-0 group-hover:opacity-100 text-brand-primary opacity-30 hover:text-negative-strong hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {showImport && (
        <ImportCsvModal
          type="questions"
          title="Import discovery questions"
          columns="Product Area, Theme, Persona, Question, Notes / Intent, Source"
          onClose={() => setShowImport(false)}
          onImported={() => setReloadKey((k) => k + 1)}
        />
      )}

      {showAddQuestion && (
        <AddQuestionModal
          onSave={(q) => {
            setQuestions((prev) => [q, ...prev]);
            setShowAddQuestion(false);
          }}
          onClose={() => setShowAddQuestion(false)}
        />
      )}

      {showAddSource && (
        <AddSourceModal
          onSave={(s) => {
            setSources((prev) => [s, ...prev]);
            setShowAddSource(false);
          }}
          onClose={() => setShowAddSource(false)}
        />
      )}
    </div>
  );
}
