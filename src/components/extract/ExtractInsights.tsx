"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link2, Sparkles, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useApiKey } from "@/hooks/useApiKey";
import { NoKeyBanner } from "@/components/ui/NoKeyBanner";
import { AREA_OPTIONS as AREAS , THEME_OPTIONS as THEMES } from "@/lib/labels";

interface Item {
  oneLiner: string;
  content: string;
  productArea: string;
  theme: string;
  persona: string | null;
  client: string | null;
  tags: string[];
  approved: boolean;
  expanded: boolean;
}

type Stage = "input" | "review" | "saved";

export function ExtractInsights() {
  const router = useRouter();
  const { aiHeaders } = useApiKey();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [stage, setStage] = useState<Stage>("input");
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [saveError, setSaveError] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  // One date for the whole batch: an extraction comes from a single document,
  // so a per-row date would be busywork. Required, same as the manual form.
  const [date, setDate] = useState("");
  // Reporter is batch-level for the same reason. Defaults to the signed-in user
  // and is editable, so a doc someone else gathered lands under their name.
  const [reporter, setReporter] = useState("");
  const [reporters, setReporters] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/insights/facets")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setReporters(d.reporters ?? []);
        setReporter((prev) => prev || d.me || "");
      })
      .catch(() => {}); // non-fatal: the field still works as free text
  }, []);

  async function extract() {
    const hasContent = text.trim() || url.trim();
    if (!hasContent) return;
    setExtracting(true);
    setError("");
    setItems([]);
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...aiHeaders },
        body: JSON.stringify({ url: url.trim() || null, text: text.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(
        (data.insights as Omit<Item, "approved" | "expanded">[]).map((i) => ({
          ...i,
          approved: true,
          expanded: false,
        }))
      );
      setSourceUrl(url.trim());
      // Default to today; the reviewer can change it to when the feedback was
      // actually given before saving.
      setDate(new Date().toISOString().slice(0, 10));
      setStage("review");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExtracting(false);
    }
  }

  function update(idx: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  }

  async function save() {
    const approved = items.filter((i) => i.approved);
    if (approved.length === 0 || !date) return;
    setSaving(true);
    setSaveError("");
    let hostname = "";
    try {
      if (sourceUrl) hostname = new URL(sourceUrl).hostname;
    } catch {}

    // Sequential with an explicit ok check on each: the previous version fired
    // these in parallel and ignored the responses, so a rejected row still
    // reported success.
    let ok = 0;
    const failures: string[] = [];
    for (const i of approved) {
      try {
        const res = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oneLiner: i.oneLiner,
            content: i.content,
            productArea: i.productArea,
            theme: i.theme,
            persona: i.persona,
            client: i.client,
            date,
            createdBy: reporter.trim() || null,
            tags: i.tags,
            sourceUrl: sourceUrl || null,
            sourceName: hostname || "AI extract",
            sourceType: "AI_EXTRACT",
          }),
        });
        if (res.ok) ok++;
        else failures.push((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
      } catch (e) {
        failures.push((e as Error).message);
      }
    }

    setSavedCount(ok);
    if (failures.length) {
      setSaveError(`${failures.length} of ${approved.length} couldn't be saved — ${failures[0]}`);
    }
    setSaving(false);
    setStage("saved");
  }

  const approvedCount = items.filter((i) => i.approved).length;

  // ── Saved ──────────────────────────────────────────────────────────────────
  if (stage === "saved") {
    return (
      <div className="p-8 max-w-xl mx-auto text-center mt-12">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            savedCount > 0 ? "bg-[rgba(15,110,86,0.1)]" : "bg-red-50"
          }`}
        >
          {savedCount > 0 ? (
            <Check className="w-7 h-7 text-positive-strong" />
          ) : (
            <X className="w-7 h-7 text-red-700" />
          )}
        </div>
        <h2 className="text-[22px] font-bold text-brand-primary mb-2">
          {savedCount > 0 ? "Feedback saved" : "Nothing was saved"}
        </h2>
        <p className="text-[14px] text-brand-primary opacity-50 mb-4">
          {savedCount} {savedCount === 1 ? "entry" : "entries"} added to the feedback hub
        </p>
        {saveError && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-left">
            <p className="text-[13px] text-red-700">{saveError}</p>
          </div>
        )}
        <div className="mb-8" />
        <div className="flex gap-3 justify-center">
          <Button
            variant="ghost"
            onClick={() => {
              setStage("input");
              setUrl("");
              setText("");
              setItems([]);
            }}
          >
            Extract more
          </Button>
          <Button onClick={() => router.push("/insights")}>View feedback</Button>
        </div>
      </div>
    );
  }

  // ── Review table ───────────────────────────────────────────────────────────
  if (stage === "review") {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">
                Review extracted feedback
              </h1>
              <p className="text-[14px] text-brand-primary opacity-50">
                {approvedCount} of {items.length} items approved — edit any field before saving
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setItems((prev) => prev.map((i) => ({ ...i, approved: true })))}
                className="text-[13px] font-medium text-positive-strong hover:underline"
              >
                Approve all
              </button>
              <span className="text-brand-primary opacity-20">·</span>
              <button
                onClick={() => setItems((prev) => prev.map((i) => ({ ...i, approved: false })))}
                className="text-[13px] font-medium text-negative-strong hover:underline"
              >
                Deny all
              </button>
              <div className="w-px h-4 bg-[rgba(50,43,95,0.15)] mx-1" />
              <label className="flex items-center gap-2 text-[12px] font-semibold text-brand-primary opacity-70">
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-sm bg-white border border-black/15 px-2 py-1.5 text-[13px] text-brand-primary focus:outline-none focus:border-brand-secondary-500"
                />
              </label>
              <label className="flex items-center gap-2 text-[12px] font-semibold text-brand-primary opacity-70">
                Reporter
                <input
                  value={reporter}
                  onChange={(e) => setReporter(e.target.value)}
                  placeholder="name@navina.ai"
                  list="extract-reporter-suggestions"
                  className="w-40 rounded-sm bg-white border border-black/15 px-2 py-1.5 text-[13px] text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:border-brand-secondary-500"
                />
                <datalist id="extract-reporter-suggestions">
                  {reporters.map((r) => <option key={r} value={r} />)}
                </datalist>
              </label>
              <Button variant="ghost" size="sm" onClick={() => setStage("input")}>
                Back
              </Button>
              <Button
                size="sm"
                onClick={save}
                loading={saving}
                disabled={approvedCount === 0 || !date}
                title={!date ? "Pick a date first" : undefined}
              >
                <Check className="w-4 h-4" />
                Save {approvedCount > 0 ? `${approvedCount} ` : ""}approved
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] overflow-hidden">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: 36 }} />
                <col />
                <col style={{ width: 130 }} />
                <col style={{ width: 155 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 72 }} />
              </colgroup>
              <thead>
                <tr className="border-b border-[rgba(50,43,95,0.08)] bg-[rgba(50,43,95,0.02)]">
                  <th />
                  <th className="text-left py-3 px-3 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide">
                    One-liner
                  </th>
                  <th className="text-left py-3 px-3 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide">
                    Area
                  </th>
                  <th className="text-left py-3 px-3 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide">
                    Theme
                  </th>
                  <th className="text-left py-3 px-3 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide">
                    Client
                  </th>
                  <th className="py-3 px-3 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <tr
                      className={`border-b border-[rgba(50,43,95,0.06)] transition-opacity ${
                        item.approved ? "" : "opacity-35"
                      }`}
                    >
                      {/* Expand toggle */}
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => update(idx, { expanded: !item.expanded })}
                          className="w-6 h-6 flex items-center justify-center text-brand-primary opacity-25 hover:opacity-60 transition-opacity"
                        >
                          {item.expanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      {/* One-liner */}
                      <td className="py-2 px-3">
                        <input
                          value={item.oneLiner}
                          onChange={(e) => update(idx, { oneLiner: e.target.value })}
                          className="w-full text-[13px] text-brand-primary bg-transparent rounded px-1.5 py-0.5 -mx-1.5 outline-none hover:bg-[rgba(50,43,95,0.04)] focus:bg-[rgba(50,43,95,0.06)] transition-colors"
                        />
                      </td>

                      {/* Area */}
                      <td className="py-2 px-3">
                        <Select
                          value={item.productArea}
                          onChange={(val) => update(idx, { productArea: val })}
                          options={AREAS}
                          className="w-full h-7 text-[12px]"
                        />
                      </td>

                      {/* Theme */}
                      <td className="py-2 px-3">
                        <Select
                          value={item.theme}
                          onChange={(val) => update(idx, { theme: val })}
                          options={THEMES}
                          className="w-full h-7 text-[12px]"
                        />
                      </td>

                      {/* Client */}
                      <td className="py-2 px-3">
                        <input
                          value={item.client ?? ""}
                          onChange={(e) => update(idx, { client: e.target.value || null })}
                          placeholder="—"
                          className="w-full text-[13px] text-brand-primary bg-transparent rounded px-1.5 py-0.5 -mx-1.5 outline-none hover:bg-[rgba(50,43,95,0.04)] focus:bg-[rgba(50,43,95,0.06)] transition-colors placeholder:text-brand-primary/25"
                        />
                      </td>

                      {/* Approve / Deny */}
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Approve"
                            onClick={() => update(idx, { approved: true })}
                            className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                              item.approved
                                ? "bg-[rgba(15,110,86,0.12)] text-positive-strong"
                                : "text-brand-primary opacity-20 hover:opacity-50"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Deny"
                            onClick={() => update(idx, { approved: false })}
                            className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                              !item.approved
                                ? "bg-[rgba(220,38,38,0.10)] text-negative-strong"
                                : "text-brand-primary opacity-20 hover:opacity-50"
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {item.expanded && (
                      <tr
                        className={`border-b border-[rgba(50,43,95,0.06)] bg-[rgba(50,43,95,0.02)] transition-opacity ${
                          item.approved ? "" : "opacity-35"
                        }`}
                      >
                        <td />
                        <td colSpan={5} className="py-3 px-3 pb-4">
                          <p className="text-[11px] font-semibold text-brand-primary opacity-40 uppercase tracking-wide mb-1.5">
                            Full content
                          </p>
                          <textarea
                            value={item.content}
                            onChange={(e) => update(idx, { content: e.target.value })}
                            rows={3}
                            className="w-full text-[13px] text-brand-primary/70 bg-white border border-[rgba(50,43,95,0.12)] rounded px-3 py-2 resize-y outline-none focus:border-brand-secondary-500 transition-colors"
                          />
                          {item.persona && (
                            <p className="text-[12px] text-brand-primary opacity-40 mt-1.5">
                              Persona: {item.persona}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={save} loading={saving} disabled={approvedCount === 0}>
              <Check className="w-4 h-4" />
              Save {approvedCount > 0 ? `${approvedCount} ` : ""}approved
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Input stage ────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-2xl mx-auto">

      <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-6 space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-primary mb-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Paste a link
          </label>
          <Input
            placeholder="https://docs.google.com/... or any public URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && extract()}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[rgba(50,43,95,0.1)]" />
          <span className="text-[12px] text-brand-primary opacity-40">or</span>
          <div className="flex-1 h-px bg-[rgba(50,43,95,0.1)]" />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-brand-primary mb-1.5">Paste text</label>
          <textarea
            placeholder="Call notes, email threads, onsite summaries, Slack messages..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            className="w-full rounded-sm bg-white border border-[rgba(50,43,95,0.18)] px-3 py-2.5 text-[14px] text-brand-primary placeholder:text-brand-primary placeholder:opacity-40 focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none"
          />
        </div>

        <NoKeyBanner />

        {error && <p className="text-[13px] text-negative-strong">{error}</p>}

        <Button
          onClick={extract}
          loading={extracting}
          disabled={!url.trim() && !text.trim()}
        >
          <Sparkles className="w-4 h-4" />
          {extracting ? "Extracting..." : "Extract feedback"}
        </Button>
      </div>
    </div>
  );
}
