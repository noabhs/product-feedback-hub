"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Link2, Sparkles, ArrowLeft, Check, X, CheckCheck, FilePlus } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useApiKey } from "@/hooks/useApiKey";
import { AddSourceModal } from "@/components/discovery/AddSourceModal";
import { AREA_LABELS, THEME_LABELS, areaLabel, themeLabel } from "@/lib/labels";

const AREA_OPTIONS = Object.keys(AREA_LABELS).map((v) => ({ value: v, label: areaLabel(v) }));
const THEME_OPTIONS = Object.keys(THEME_LABELS).map((v) => ({ value: v, label: themeLabel(v) }));

type Candidate = {
  question: string;
  productArea: string;
  theme: string;
  persona: string | null;
  notesIntent: string | null;
};

type Row = Candidate & { _id: number; approved: boolean | null };

export default function ExtractQuestionsPage() {
  const params = useSearchParams();
  const { aiHeaders } = useApiKey();

  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showAddSource, setShowAddSource] = useState(false);
  const [registered, setRegistered] = useState<string | null>(null);

  // Deep-linked from a source in the library: prefill its URL and name.
  useEffect(() => {
    const u = params.get("url");
    const n = params.get("name");
    if (u) setUrl(u);
    if (n) setSourceName(n);
  }, [params]);

  async function extract() {
    if (!url.trim() && !text.trim()) {
      setError("Paste a link or the document text");
      return;
    }
    setExtracting(true);
    setError("");
    try {
      const res = await fetch("/api/ai/extract-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...aiHeaders },
        body: JSON.stringify({ url: url.trim() || undefined, text: text.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Extraction failed (${res.status})`);

      const candidates: Candidate[] = data.questions ?? [];
      if (candidates.length === 0) {
        setError("No discovery questions found in that document.");
        return;
      }
      setRows(candidates.map((c, i) => ({ ...c, _id: i, approved: null })));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExtracting(false);
    }
  }

  const setRow = (id: number, patch: Partial<Row>) =>
    setRows((prev) => prev?.map((r) => (r._id === id ? { ...r, ...patch } : r)) ?? null);

  const approvedRows = rows?.filter((r) => r.approved === true) ?? [];

  async function saveApproved() {
    if (approvedRows.length === 0) return;
    setSaving(true);
    setError("");
    try {
      // Sequential rather than Promise.all: a burst of parallel writes gives
      // no benefit here and makes a partial failure harder to report.
      let ok = 0;
      const failures: string[] = [];
      for (const r of approvedRows) {
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: r.question,
            productArea: r.productArea,
            theme: r.theme,
            persona: r.persona,
            notesIntent: r.notesIntent,
            source: sourceName.trim() || url.trim() || "Extracted from document",
          }),
        });
        if (res.ok) ok++;
        else failures.push((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
      }
      setSavedCount(ok);
      if (failures.length) {
        setError(`${failures.length} of ${approvedRows.length} couldn't be saved — ${failures[0]}`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ── Saved ─────────────────────────────────────────────
  if (savedCount !== null) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-mint-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-teal-strong" />
          </div>
          <h1 className="text-[20px] font-bold text-brand-primary mb-1">
            {savedCount} question{savedCount === 1 ? "" : "s"} added
          </h1>
          <p className="text-[14px] text-brand-primary opacity-50 mb-6">
            They&apos;re now in the discovery question library.
          </p>
          {error && <p className="text-[13px] text-red-700 mb-4">{error}</p>}
          <div className="flex items-center justify-center gap-3">
            <Link href="/discovery">
              <Button size="sm">View question library</Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setRows(null); setSavedCount(null); setUrl(""); setText(""); setError(""); }}
            >
              Extract another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Review ────────────────────────────────────────────
  if (rows) {
    const pending = rows.filter((r) => r.approved === null).length;
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setRows(null)}
            className="inline-flex items-center gap-1.5 text-[13px] text-brand-primary opacity-50 hover:opacity-100 mb-5 transition-opacity"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-[24px] font-extrabold text-brand-primary mb-1">
                Review extracted questions
              </h1>
              <p className="text-[14px] text-brand-primary opacity-50">
                {rows.length} found · {approvedRows.length} approved
                {pending > 0 && ` · ${pending} not yet reviewed`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRows((prev) => prev?.map((r) => ({ ...r, approved: true })) ?? null)}
              >
                <CheckCheck className="w-4 h-4" />
                Approve all
              </Button>
              <Button size="sm" loading={saving} disabled={approvedRows.length === 0} onClick={saveApproved}>
                Save {approvedRows.length || ""} question{approvedRows.length === 1 ? "" : "s"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-md border border-[rgba(50,43,95,0.08)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(50,43,95,0.1)] bg-[rgba(50,43,95,0.03)]">
                  <th className="w-24 text-left py-3 px-4 text-[12px] font-semibold text-brand-primary opacity-60 uppercase tracking-wide">Keep?</th>
                  <th className="text-left py-3 px-4 text-[12px] font-semibold text-brand-primary opacity-60 uppercase tracking-wide">Question</th>
                  <th className="w-40 text-left py-3 px-4 text-[12px] font-semibold text-brand-primary opacity-60 uppercase tracking-wide">Area</th>
                  <th className="w-40 text-left py-3 px-4 text-[12px] font-semibold text-brand-primary opacity-60 uppercase tracking-wide">Theme</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r._id}
                    className={`border-b border-[rgba(50,43,95,0.07)] transition-colors ${
                      r.approved === false ? "opacity-40" : ""
                    }`}
                  >
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setRow(r._id, { approved: true })}
                          title="Keep"
                          className={`p-1.5 rounded transition-colors ${
                            r.approved === true
                              ? "bg-mint-200 text-teal-strong"
                              : "text-brand-primary opacity-30 hover:opacity-70"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRow(r._id, { approved: false })}
                          title="Discard"
                          className={`p-1.5 rounded transition-colors ${
                            r.approved === false
                              ? "bg-red-100 text-red-700"
                              : "text-brand-primary opacity-30 hover:opacity-70"
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <textarea
                        value={r.question}
                        onChange={(e) => setRow(r._id, { question: e.target.value })}
                        rows={2}
                        className="w-full rounded-sm bg-transparent border border-transparent hover:border-black/10 focus:border-brand-secondary-500 focus:bg-white px-2 py-1 text-[14px] text-brand-primary focus:outline-none resize-none transition-all"
                      />
                      {r.notesIntent && (
                        <p className="text-[12px] text-brand-primary opacity-45 px-2 mt-0.5 italic">
                          {r.notesIntent}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <Select
                        value={r.productArea}
                        onChange={(v) => setRow(r._id, { productArea: v })}
                        options={AREA_OPTIONS}
                        className="w-full"
                      />
                    </td>
                    <td className="py-3 px-4 align-top">
                      <Select
                        value={r.theme}
                        onChange={(v) => setRow(r._id, { theme: v })}
                        options={THEME_OPTIONS}
                        className="w-full"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Input ─────────────────────────────────────────────
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/discovery"
          className="inline-flex items-center gap-1.5 text-[13px] text-brand-primary opacity-50 hover:opacity-100 mb-5 transition-opacity"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to discovery
        </Link>

        <h1 className="text-[28px] font-extrabold text-brand-primary mb-2">Extract questions from a doc</h1>
        <p className="text-[15px] text-brand-primary opacity-60 mb-6 leading-relaxed">
          Paste a link to a discovery doc, or the document text. Claude pulls out the questions
          worth asking, and you review them before anything is saved.
        </p>

        <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-6 space-y-5">
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-primary mb-2">
              <Link2 className="w-4 h-4 opacity-50" />
              Paste a link
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/... or any public URL"
              className="w-full"
            />
            <p className="text-[12px] text-brand-primary opacity-40 mt-1.5">
              The link has to be readable without signing in. For a private Drive or Notion doc,
              paste the text below instead.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[rgba(50,43,95,0.1)]" />
            <span className="text-[12px] text-brand-primary opacity-40">or</span>
            <div className="flex-1 h-px bg-[rgba(50,43,95,0.1)]" />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-brand-primary mb-2">Paste text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Paste the document contents…"
              className="w-full rounded-sm bg-white border border-black/15 px-3 py-2.5 text-[14px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-brand-primary mb-2">
              Source name <span className="opacity-40 font-normal">(optional)</span>
            </label>
            <Input
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="e.g. Pop Health Discovery — June 2026"
              className="w-full"
            />
            <p className="text-[12px] text-brand-primary opacity-40 mt-1.5">
              Recorded against each saved question so you can trace where it came from.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}

          {registered && (
            <div className="flex items-center gap-2 rounded-md border border-[rgba(15,110,86,0.2)] bg-mint-100 px-3 py-2.5">
              <Check className="w-4 h-4 text-teal-strong shrink-0" />
              <p className="text-[13px] text-brand-primary">
                Added <span className="font-semibold">{registered}</span> to the sources library.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button loading={extracting} onClick={extract} className="flex-1 justify-center">
              <Sparkles className="w-4 h-4" />
              Extract questions
            </Button>
            <Button variant="ghost" onClick={() => setShowAddSource(true)}>
              <FilePlus className="w-4 h-4" />
              Add to sources library
            </Button>
          </div>
          <p className="text-[12px] text-brand-primary opacity-40 text-center">
            Registering the doc keeps it findable later. Documents are stored as links, not uploaded
            copies, so permissions stay with Drive or Notion.
          </p>
        </div>
      </div>

      {showAddSource && (
        <AddSourceModal
          initialName={sourceName || undefined}
          initialLink={url || undefined}
          onSave={(saved) => { setRegistered(saved.name); setShowAddSource(false); }}
          onClose={() => setShowAddSource(false)}
        />
      )}
    </div>
  );
}
