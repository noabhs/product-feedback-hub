"use client";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";

const ADD_NEW = "__ADD_NEW__";

interface ComboFieldProps {
  /** Stored value (e.g. "POP_HEALTH" or a custom "BILLING"). */
  value: string;
  onChange: (value: string) => void;
  /** Selectable options, already de-duplicated and labelled. */
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

/**
 * A select with an escape hatch: choosing "＋ Add new…" swaps the control for a
 * text input so the user isn't blocked when their value isn't on the list.
 * The typed value is normalised by the caller on save.
 */
export function ComboField({ value, onChange, options, placeholder, className }: ComboFieldProps) {
  // Start in custom mode if the current value isn't one of the options —
  // e.g. when editing an entry that already carries a custom area.
  const isKnown = options.some((o) => o.value === value);
  const [custom, setCustom] = useState(!isKnown && value !== "");

  if (custom) {
    return (
      <div className={className}>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Type a new value"}
          autoFocus
          className="w-full"
        />
        <button
          type="button"
          onClick={() => { setCustom(false); onChange(options[0]?.value ?? ""); }}
          className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-brand-secondary-500 hover:underline"
        >
          <ArrowLeft className="w-3 h-3" />
          Pick from list instead
        </button>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onChange={(next) => {
        if (next === ADD_NEW) {
          setCustom(true);
          onChange("");
          return;
        }
        onChange(next);
      }}
      options={[...options, { value: ADD_NEW, label: "＋ Add new…" }]}
      className={className}
    />
  );
}
