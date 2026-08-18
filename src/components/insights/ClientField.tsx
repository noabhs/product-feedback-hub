"use client";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ClientFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Canonical client names. */
  clients: string[];
  /** Called after a new client is added, so the caller can refresh its list. */
  onClientAdded?: (name: string) => void;
  className?: string;
}

/**
 * Client is picked from the canonical list rather than typed, which is what
 * stops "DTC" and "DTC — Lynn" becoming separate clients again. The escape
 * hatch adds a genuinely new account to the list instead of a one-off string,
 * so the next person can pick the same one.
 */
export function ClientField({ value, onChange, clients, onClientAdded, className }: ClientFieldProps) {
  const ADD_NEW = "__ADD_NEW__";
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    const name = draft.trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        // A 409 still tells us the canonical spelling, so select that.
        if (res.status === 409 && data.name) {
          onChange(data.name);
          onClientAdded?.(data.name);
          setAdding(false);
          setDraft("");
          return;
        }
        throw new Error(data.error ?? "Couldn't add that client");
      }
      onChange(data.name);
      onClientAdded?.(data.name);
      setAdding(false);
      setDraft("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (adding) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New client name"
            autoFocus
            className="w-full"
          />
          <Button size="sm" loading={saving} onClick={add}>Add</Button>
        </div>
        {error && <p className="mt-1 text-[12px] text-negative-strong">{error}</p>}
        <button
          type="button"
          onClick={() => { setAdding(false); setDraft(""); setError(""); }}
          className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-brand-secondary-500 hover:underline"
        >
          <ArrowLeft className="w-3 h-3" />
          Pick from the list instead
        </button>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onChange={(next) => (next === ADD_NEW ? setAdding(true) : onChange(next))}
      options={[
        // A value that predates the canonical list stays visible and selected,
        // so editing an entry's date can't quietly drop its client.
        ...(value && !clients.includes(value)
          ? [{ value, label: `${value} — not on the list` }]
          : []),
        ...clients.map((c) => ({ value: c, label: c })),
        { value: ADD_NEW, label: "＋ Add a new client…" },
      ]}
      placeholder="No client"
      className={className}
    />
  );
}
