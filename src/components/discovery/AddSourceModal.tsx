"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

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

const FORMATS = [
  { value: "Call", label: "Call" },
  { value: "Onsite", label: "Onsite" },
  { value: "Notion", label: "Notion doc" },
  { value: "Slack", label: "Slack thread" },
  { value: "Email", label: "Email" },
  { value: "Survey", label: "Survey" },
  { value: "QBR", label: "QBR" },
  { value: "Other", label: "Other" },
];


import type { Source } from "@/lib/types";

interface Props {
  onSave: (s: Source) => void;
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

export function AddSourceModal({ onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: "",
    productArea: "GENERAL",
    format: "",
    date: "",
    topics: "",
    link: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          productArea: form.productArea,
          format: form.format || null,
          date: form.date || null,
          topics: form.topics || null,
          link: form.link || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const saved = await res.json();
      onSave(saved);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(50,43,95,0.1)]">
          <h2 className="text-[16px] font-bold text-brand-primary">Add source</h2>
          <button onClick={onClose} className="p-1 rounded text-brand-primary opacity-40 hover:opacity-80 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <Field label="Source name *">
            <Input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. CareMore onsite Q2, QBR with DHG" className="w-full" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Product area">
              <Select value={form.productArea} onChange={set("productArea")} options={AREAS} className="w-full" />
            </Field>
            <Field label="Format">
              <Select value={form.format} onChange={set("format")} options={FORMATS} placeholder="Select type" className="w-full" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => set("date")(e.target.value)} className="w-full" />
            </Field>
            <Field label="Link">
              <Input value={form.link} onChange={(e) => set("link")(e.target.value)} placeholder="https://..." className="w-full" />
            </Field>
          </div>

          <Field label="Topics (optional)">
            <Input value={form.topics} onChange={(e) => set("topics")(e.target.value)} placeholder="e.g. Quality gap closure, TCM billing" className="w-full" />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
              rows={2}
              placeholder="Any context about this source..."
              className="w-full rounded-sm bg-white border border-black/15 px-3 py-2.5 text-[14px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none"
            />
          </Field>

          {error && <p className="text-[13px] text-negative-strong">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(50,43,95,0.1)]">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>Add source</Button>
        </div>
      </div>
    </div>
  );
}
