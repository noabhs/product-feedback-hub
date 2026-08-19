"use client";
import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ComboField } from "@/components/ui/ComboField";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { ClientField } from "@/components/insights/ClientField";
import { AREA_LABELS, THEME_LABELS, areaLabel, themeLabel, normalizeKey } from "@/lib/labels";
import type { InsightItem } from "@/lib/types";

const BUILT_IN_AREAS = Object.keys(AREA_LABELS);
const BUILT_IN_THEMES = Object.keys(THEME_LABELS);

interface EditFeedbackModalProps {
  item?: InsightItem | null;
  onSave: (updated: InsightItem) => void;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-brand-primary opacity-60 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Local calendar date as yyyy-mm-dd — toISOString() would shift back a day west of UTC. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMPTY = {
  oneLiner: "", content: "", theme: "WORKFLOW",
  client: "", persona: "", sourceName: "", sourceUrl: "", date: today(), wtp: "",
  reporter: "",
};

export function EditFeedbackModal({ item, onSave, onClose }: EditFeedbackModalProps) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    oneLiner: item?.oneLiner ?? EMPTY.oneLiner,
    content: item?.content ?? EMPTY.content,
    // No default area on a new entry: the old "GENERAL" default meant most
    // entries were filed under an area nobody had actually chosen.
    productAreas: item?.productAreas ?? [],
    theme: item?.theme ?? EMPTY.theme,
    client: item?.client ?? EMPTY.client,
    persona: item?.persona ?? EMPTY.persona,
    sourceName: item?.sourceName ?? EMPTY.sourceName,
    sourceUrl: item?.sourceUrl ?? EMPTY.sourceUrl,
    date: item?.date ? item.date.slice(0, 10) : EMPTY.date,
    wtp: item?.wtp ?? EMPTY.wtp,
    // Filled in from the session once facets loads, when creating a new entry.
    reporter: item?.createdBy ?? EMPTY.reporter,
  });
  // An area that isn't on the list yet: normalised the same way the server
  // would, added to the options so it shows ticked, and selected.
  const [newArea, setNewArea] = useState("");
  const [addingArea, setAddingArea] = useState(false);
  const [customAreas, setCustomAreas] = useState<string[]>([]);


  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Areas/themes/clients already in use, so custom values someone else added
  // are pickable here rather than retyped into a near-duplicate.
  const [facets, setFacets] = useState<{
    areas: string[]; themes: string[]; clients: string[]; reporters: string[];
  }>({ areas: [], themes: [], clients: [], reporters: [] });

  useEffect(() => {
    fetch("/api/insights/facets")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setFacets(d);
        // Default a new entry's reporter to the signed-in user, without
        // clobbering anything already typed. Never on an edit: the seeded rows
        // have no reporter, and defaulting there would quietly reassign them.
        if (isEdit) return;
        setForm((prev) => (prev.reporter || !d.me ? prev : { ...prev, reporter: d.me }));
      })
      .catch(() => {}); // non-fatal: built-in options still work
  }, [isEdit]);

  const areaOptions = useMemo(
    () => [...new Set([...BUILT_IN_AREAS, ...facets.areas, ...customAreas])]
      .map((v) => ({ value: v, label: areaLabel(v) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [facets.areas, customAreas]
  );

  function addArea() {
    const typed = normalizeKey(newArea);
    if (!typed) return;
    // Typing an area's display name shouldn't create a second one: "Risk
    // Adjustment" normalises to RISK_ADJUSTMENT, but it's stored as RISK_DX. So
    // match against the labels on offer before treating this as new.
    const existing = areaOptions.find(
      (o) => o.value === typed || normalizeKey(o.label) === typed,
    );
    const key = existing?.value ?? typed;
    setCustomAreas((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setForm((prev) =>
      prev.productAreas.includes(key) ? prev : { ...prev, productAreas: [...prev.productAreas, key] },
    );
    setNewArea("");
    setAddingArea(false);
  }

  const themeOptions = useMemo(
    () => [...new Set([...BUILT_IN_THEMES, ...facets.themes])]
      .map((v) => ({ value: v, label: themeLabel(v) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [facets.themes]
  );

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const setAreas = (productAreas: string[]) => setForm((prev) => ({ ...prev, productAreas }));


  async function handleSave() {
    if (!form.oneLiner.trim()) { setError("One-liner is required"); return; }
    if (!form.date) { setError("Date is required — when did this feedback happen?"); return; }
    // Checked post-normalisation: a value like "!!!" normalises to empty and
    // would otherwise silently fall back to General on the server.
    if (!form.productAreas.length) { setError("Pick at least one product area"); return; }
    if (!normalizeKey(form.theme)) { setError("Theme needs at least one letter or number"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        // Normalise so a typed "Billing" and "billing" don't become two groups.
        productAreas: form.productAreas,
        theme: normalizeKey(form.theme),
        client: form.client.trim() || null,
        content: form.content || form.oneLiner,
        persona: form.persona || null,
        sourceName: form.sourceName || null,
        sourceUrl: form.sourceUrl || null,
        date: form.date,
        wtp: form.wtp || null,
        createdBy: form.reporter.trim() || null,
        sourceType: "MANUAL",
        tags: "[]",
      };
      const res = isEdit
        ? await fetch(`/api/insights/${item!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        // Surface the server's reason — "X isn't on the client list" is
        // actionable, "Failed to save" is not.
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error ?? `Couldn't save — HTTP ${res.status}`);
      }
      const saved = await res.json();
      onSave(isEdit ? { ...item!, ...saved } : saved);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-lg shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(50,43,95,0.1)]">
          <h2 className="text-[16px] font-bold text-brand-primary">
            {isEdit ? "Edit feedback" : "Add feedback"}
          </h2>
          <button onClick={onClose} className="p-1 rounded text-brand-primary opacity-40 hover:opacity-80 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <Field label="One-liner *">
            <Input
              value={form.oneLiner}
              onChange={(e) => set("oneLiner")(e.target.value)}
              placeholder="Short summary of the feedback"
              className="w-full"
            />
          </Field>

          <Field label="Full feedback">
            <textarea
              value={form.content}
              onChange={(e) => set("content")(e.target.value)}
              rows={4}
              placeholder="Detailed feedback notes..."
              className="w-full rounded-sm bg-white border border-black/15 px-3 py-2.5 text-[14px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none transition-all"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Product areas *">
              {/* An entry can touch several — Risk Adjustment and Coders both,
                  say — so this is a multi-select rather than one value. */}
              <MultiSelect
                value={form.productAreas}
                onChange={setAreas}
                options={areaOptions}
                placeholder="Pick one or more"
                className="w-full"
              />
              {addingArea ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addArea()}
                    placeholder="New area name"
                    autoFocus
                    className="w-full"
                  />
                  <Button size="sm" onClick={addArea}>Add</Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingArea(true)}
                  className="mt-1.5 text-[12px] text-brand-secondary-500 hover:underline"
                >
                  ＋ Add a new area
                </button>
              )}
            </Field>
            <Field label="Theme *">
              <ComboField
                value={form.theme}
                onChange={set("theme")}
                options={themeOptions}
                placeholder="e.g. Onboarding"
                className="w-full"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Client">
              <ClientField
                value={form.client}
                onChange={set("client")}
                clients={facets.clients}
                onClientAdded={(name) =>
                  setFacets((prev) => ({ ...prev, clients: [...prev.clients, name].sort() }))
                }
                className="w-full"
              />
            </Field>
            <Field label="Persona / POC">
              <Input value={form.persona} onChange={(e) => set("persona")(e.target.value)} placeholder="e.g. Quality Manager" className="w-full" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Source">
              <Input value={form.sourceName} onChange={(e) => set("sourceName")(e.target.value)} placeholder="Notion, onsite, Slack..." className="w-full" />
            </Field>
            <Field label="Source URL">
              <Input value={form.sourceUrl} onChange={(e) => set("sourceUrl")(e.target.value)} placeholder="https://..." className="w-full" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date *">
              <Input type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} className="w-full" />
            </Field>
            <Field label="Reporter">
              {/* Defaults to you, but editable — the person who gathered the
                  feedback is often not the one entering it. Cleared means the
                  entry shows as imported. */}
              <Input
                value={form.reporter}
                onChange={(e) => set("reporter")(e.target.value)}
                placeholder="name@navina.ai"
                list="reporter-suggestions"
                className="w-full"
              />
              <datalist id="reporter-suggestions">
                {facets.reporters.map((r) => <option key={r} value={r} />)}
              </datalist>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="WTP">
              <Input value={form.wtp} onChange={(e) => set("wtp")(e.target.value)} placeholder="e.g. $0.20 PMPM" className="w-full" />
            </Field>
          </div>

          {error && <p className="text-[13px] text-negative-strong">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(50,43,95,0.1)]">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>
            {isEdit ? "Save changes" : "Add feedback"}
          </Button>
        </div>
      </div>
    </div>
  );
}
