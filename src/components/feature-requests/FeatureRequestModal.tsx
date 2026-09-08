"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { FEATURE_REQUEST_STATUS_OPTIONS, DEFAULT_FEATURE_REQUEST_STATUS } from "@/lib/feature-request-status";
import type { FeatureRequestItem } from "@/lib/types";

interface Props {
  /** Present when editing; absent when filing a new request. */
  item?: FeatureRequestItem;
  onSave: (r: FeatureRequestItem) => void;
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

export function FeatureRequestModal({ item, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    painToSolve: item?.painToSolve ?? "",
    status: item?.status ?? DEFAULT_FEATURE_REQUEST_STATUS,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.description.trim()) { setError("Description is required"); return; }
    if (!form.painToSolve.trim()) { setError("Pain to solve is required"); return; }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(item ? `/api/feature-requests/${item.id}` : "/api/feature-requests", {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to save");
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
          <h2 className="text-[16px] font-bold text-brand-primary">
            {item ? "Edit feature request" : "New feature request"}
          </h2>
          <button onClick={onClose} className="p-1 rounded text-brand-primary opacity-40 hover:opacity-80 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <Field label="Title *">
            <Input value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="e.g. Bulk-export feature requests to CSV" className="w-full" />
          </Field>

          <Field label="Description *">
            <textarea
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              rows={5}
              placeholder="What should this do? Markdown is supported — [links](https://...) and ![images](https://...) will render."
              className="w-full rounded-sm bg-white border border-black/15 px-3 py-2.5 text-[14px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none"
            />
          </Field>

          <Field label="Pain to solve *">
            <textarea
              value={form.painToSolve}
              onChange={(e) => set("painToSolve")(e.target.value)}
              rows={3}
              placeholder="What problem does this fix, and for whom?"
              className="w-full rounded-sm bg-white border border-black/15 px-3 py-2.5 text-[14px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none"
            />
          </Field>

          {item && (
            <Field label="Status">
              <Select value={form.status} onChange={set("status")} options={[...FEATURE_REQUEST_STATUS_OPTIONS]} className="w-full" />
            </Field>
          )}

          {error && <p className="text-[13px] text-negative-strong">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(50,43,95,0.1)]">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>{item ? "Save" : "File request"}</Button>
        </div>
      </div>
    </div>
  );
}
