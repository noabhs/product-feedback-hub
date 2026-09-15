"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2, Sparkles, ArrowLeft, Check, X, CheckCheck } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui/Button";
import { useApiKey } from "@/hooks/useApiKey";
import { AREA_LABELS, COMPETITOR_TOPIC_OPTIONS, CONFIDENCE_OPTIONS, areaLabel } from "@/lib/labels";

const AREA_OPTIONS = Object.keys(AREA_LABELS).map((v) => ({ value: v, label: areaLabel(v) }));

// Not in labels.ts: this is the same two-value `Sensitivity` union already
// typed in src/lib/ingest/extract.ts, just given option labels here.
const SENSITIVITY_OPTIONS = [
  { value: "external", label: "External" },
  { value: "internal", label: "Internal" },
];

type Candidate = {
  oneLiner: string;
  content: string;
  topics: string[];
  productAreas: string[];
  confidence: string;
  sensitivity: string;
  sensitivityReason: string;
};

type Row = Candidate & { _id: number; approved: boolean | null };

interface CompetitorOption {
  id: string;
  name: string;
}

export function ExtractCompetition() {
  const { aiHeaders } = useApiKey();

  const [competitors, setCompetitors] = useState<CompetitorOption[]>([]);
  const [competitorId, setCompetitorId] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [asOf, setAsOf] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/competitors");
      const data = await res.json();
      setCompetitors((data.competitors ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
    })();
  }, []);

  const competitorName = competitors.find((c) => c.id === competitorId)?.name ?? "";

  async function extract() {
    if (!competitorId) {
      setError("Pick a competitor first");
      return;
    }
    if (!url.trim() && !text.trim()) {
      setError("Paste a link or the document text");
      return;
    }
    setExtracting(true);
    setError("");
    try {
      const res = await fetch("/api/ai/extract-competition", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...aiHeaders },
        body: JSON.stringify({
          competitorId,
          title: title.trim() || undefined,
          url: url.trim() || undefined,
          text: text.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Extraction failed (${res.status})`);

      const candidates: Candidate[] = data.claims ?? [];
      if (candidates.length === 0) {
        setError(`No claims about ${competitorName} found in that document.`);
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
      // Sequential rather than Promise.all, same reasoning as the other two
      // extract modes: no benefit to parallel writes here, and a partial
      // failure is easier to report one at a time.
      let ok = 0;
      const failures: string[] = [];
      for (const r of approvedRows) {
        const res = await fetch("/api/competitors/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            competitorId,
            oneLiner: r.oneLiner,
            content: r.content,
            topics: r.topics,
            productAreas: r.productAreas,
            confidence: r.confidence,
            sensitivity: r.sensitivity,
            sensitivityReason: r.sensitivityReason,
            asOf: asOf || null,
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
            {savedCount} claim{savedCount === 1 ? "" : "s"} added
          </h1>
          <p className="text-[14px] text-brand-primary opacity-50 mb-6">
            Added to {competitorName || "that competitor"}&rsquo;s profile.
          </p>
          {error && <p className="text-[13px] text-red-700 mb-4">{error}</p>}
          <div className="flex items-center justify-center gap-3">
            <Link href={`/competitors?open=${competitorId}`}>
              <Button size="sm">View {competitorName || "competitor"}</Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRows(null);
                setSavedCount(null);
                setUrl("");
                setText("");
                setTitle("");
                setError("");
              }}
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
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setRows(null)}
            className="inline-flex items-center gap-1.5 text-[13px] text-brand-primary opacity-50 hover:opacity-100 mb-5 transition-opacity"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-[24px] font-extrabold text-brand-primary mb-1">
                Review claims about {competitorName}
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
                Save {approvedRows.length || ""} claim{approvedRows.length === 1 ? "" : "s"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r._id}
                className={`bg-white rounded-md border border-[rgba(50,43,95,0.08)] p-4 transition-colors ${
                  r.approved === false ? "opacity-40" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-1 shrink-0 mt-1">
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

                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      value={r.oneLiner}
                      onChange={(e) => setRow(r._id, { oneLiner: e.target.value })}
                      className="w-full rounded-sm bg-transparent border border-transparent hover:border-black/10 focus:border-brand-secondary-500 focus:bg-white px-2 py-1 text-[14px] font-semibold text-brand-primary focus:outline-none transition-all"
                    />
                    <textarea
                      value={r.content}
                      onChange={(e) => setRow(r._id, { content: e.target.value })}
                      rows={2}
                      className="w-full rounded-sm bg-transparent border border-transparent hover:border-black/10 focus:border-brand-secondary-500 focus:bg-white px-2 py-1 text-[13px] text-brand-primary opacity-80 focus:outline-none resize-none transition-all"
                    />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                      <MultiSelect
                        value={r.topics}
                        onChange={(v) => setRow(r._id, { topics: v })}
                        options={COMPETITOR_TOPIC_OPTIONS}
                        placeholder="Topics"
                      />
                      <MultiSelect
                        value={r.productAreas}
                        onChange={(v) => setRow(r._id, { productAreas: v })}
                        options={AREA_OPTIONS}
                        placeholder="Product areas"
                      />
                      <Select
                        value={r.confidence}
                        onChange={(v) => setRow(r._id, { confidence: v })}
                        options={CONFIDENCE_OPTIONS}
                        className="w-full"
                      />
                      <Select
                        value={r.sensitivity}
                        onChange={(v) => setRow(r._id, { sensitivity: v, sensitivityReason: v === "internal" ? r.sensitivityReason : "" })}
                        options={SENSITIVITY_OPTIONS}
                        className="w-full"
                      />
                    </div>

                    {r.sensitivity === "internal" && (
                      <Input
                        value={r.sensitivityReason}
                        onChange={(e) => setRow(r._id, { sensitivityReason: e.target.value })}
                        placeholder="What makes this internal? (e.g. private pricing, named client)"
                        className="w-full"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Input ─────────────────────────────────────────────
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-6 space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-brand-primary mb-2">Competitor</label>
            <Select
              value={competitorId}
              onChange={setCompetitorId}
              options={competitors.map((c) => ({ value: c.id, label: c.name }))}
              placeholder={competitors.length ? "Pick a competitor…" : "Loading…"}
              className="w-full"
            />
          </div>

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
              placeholder="Paste a call note, battlecard, or any notes about this competitor…"
              className="w-full rounded-sm bg-white border border-black/15 px-3 py-2.5 text-[14px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-brand-primary mb-2">
                Document title <span className="opacity-40 font-normal">(optional)</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 battlecard"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-brand-primary mb-2">
                As of <span className="opacity-40 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                className="h-10 w-full rounded-sm bg-white border border-black/15 px-3 text-sm text-brand-primary focus:outline-none focus:border-brand-secondary-500"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}

          <Button loading={extracting} onClick={extract} className="w-full justify-center">
            <Sparkles className="w-4 h-4" />
            Extract claims
          </Button>
        </div>
      </div>
    </div>
  );
}
