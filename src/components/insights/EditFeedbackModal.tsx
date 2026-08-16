"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { InsightItem } from "./InsightCard";

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
  { value: "OTHER", label: "Other" },
];

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

const EMPTY = {
  oneLiner: "", content: "", productArea: "GENERAL", theme: "WORKFLOW",
  client: "", persona: "", sourceName: "", sourceUrl: "", date: "", wtp: "",
};

export function EditFeedbackModal({ item, onSave, onClose }: EditFeedbackModalProps) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    oneLiner: item?.oneLiner ?? EMPTY.oneLiner,
    content: item?.content ?? EMPTY.content,
    productArea: item?.productArea ?? EMPTY.productArea,
    theme: item?.theme ?? EMPTY.theme,
    client: item?.client ?? EMPTY.client,
    persona: item?.persona ?? EMPTY.persona,
    sourceName: item?.sourceName ?? EMPTY.sourceName,
    sourceUrl: item?.sourceUrl ?? EMPTY.sourceUrl,
    date: item?.date ? item.date.slice(0, 10) : EMPTY.date,
    wtp: item?.wtp ?? EMPTY.wtp,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSave() {
    if (!form.oneLiner.trim()) { setError("One-liner is required"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        content: form.content || form.oneLiner,
        persona: form.persona || null,
        client: form.client || null,
        sourceName: form.sourceName || null,
        sourceUrl: form.sourceUrl || null,
        date: form.date || null,
        wtp: form.wtp || null,
        sourceType: "MANUAL",
        tags: "[]",
      };
      const res = isEdit
        ? await fetch(`/api/insights/${item!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed to save");
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
            <Field label="Product area">
              <Select value={form.productArea} onChange={set("productArea")} options={AREAS} className="w-full" />
            </Field>
            <Field label="Theme">
              <Select value={form.theme} onChange={set("theme")} options={THEMES} className="w-full" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Client">
              <Input value={form.client} onChange={(e) => set("client")(e.target.value)} placeholder="Client name" className="w-full" />
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
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} className="w-full" />
            </Field>
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
