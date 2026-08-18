"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { AREA_OPTIONS as AREAS , THEME_OPTIONS as THEMES } from "@/lib/labels";

import type { Question } from "@/lib/types";

interface Props {
  onSave: (q: Question) => void;
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

export function AddQuestionModal({ onSave, onClose }: Props) {
  const [form, setForm] = useState({
    question: "",
    productArea: "GENERAL",
    theme: "WORKFLOW",
    persona: "",
    notesIntent: "",
    source: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSave() {
    if (!form.question.trim()) { setError("Question text is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: form.question,
          productArea: form.productArea,
          theme: form.theme,
          persona: form.persona || null,
          notesIntent: form.notesIntent || null,
          source: form.source || null,
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
          <h2 className="text-[16px] font-bold text-brand-primary">Add discovery question</h2>
          <button onClick={onClose} className="p-1 rounded text-brand-primary opacity-40 hover:opacity-80 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <Field label="Question *">
            <textarea
              value={form.question}
              onChange={(e) => set("question")(e.target.value)}
              rows={3}
              placeholder="What does your workflow look like today for..."
              className="w-full rounded-sm bg-white border border-black/15 px-3 py-2.5 text-[14px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none"
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

          <Field label="Persona (optional)">
            <Input value={form.persona} onChange={(e) => set("persona")(e.target.value)} placeholder="e.g. VBC Leader, Care Coordinator" className="w-full" />
          </Field>

          <Field label="Intent / Notes (optional)">
            <textarea
              value={form.notesIntent}
              onChange={(e) => set("notesIntent")(e.target.value)}
              rows={2}
              placeholder="What are we trying to learn from this question?"
              className="w-full rounded-sm bg-white border border-black/15 px-3 py-2.5 text-[14px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none"
            />
          </Field>

          <Field label="Source (optional)">
            <Input value={form.source} onChange={(e) => set("source")(e.target.value)} placeholder="e.g. Notion, onsite session, team review" className="w-full" />
          </Field>

          {error && <p className="text-[13px] text-negative-strong">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(50,43,95,0.1)]">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>Add question</Button>
        </div>
      </div>
    </div>
  );
}
