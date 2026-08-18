"use client";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Check, ChevronDown } from "lucide-react";

interface MultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  options: { value: string; label: string }[];
  /** Shown when nothing is picked, e.g. "All clients". */
  placeholder: string;
  className?: string;
}

/**
 * Checkbox dropdown for the feed filters. A native <select multiple> needs
 * ctrl-click to add a second value and has no closed state, so the filters get
 * their own panel: click to add, click again to remove.
 */
export function MultiSelect({ value, onChange, options, placeholder, className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  // Ordered by the options list rather than click order, so the summary doesn't
  // reshuffle as picks are added and removed.
  const selected = options.filter((o) => value.includes(o.value)).map((o) => o.label);
  const summary =
    selected.length === 0 ? placeholder
    : selected.length === 1 ? selected[0]
    : `${selected[0]} +${selected.length - 1}`;

  return (
    <div ref={root} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title={selected.join(", ") || placeholder}
        className={clsx(
          "w-full h-10 flex items-center justify-between gap-2 rounded-sm bg-white border px-3",
          "text-sm text-brand-primary text-left cursor-pointer transition-all duration-200",
          "focus:outline-none focus:border-brand-secondary-500",
          value.length ? "border-brand-secondary-500" : "border-black/15"
        )}
      >
        <span className={clsx("truncate", !value.length && "opacity-60")}>{summary}</span>
        <ChevronDown className={clsx("w-4 h-4 shrink-0 opacity-40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-52 max-h-72 overflow-y-auto rounded-sm border border-black/10 bg-white shadow-lg py-1">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-[13px] text-brand-primary opacity-40">Nothing to filter by yet</p>
          ) : (
            options.map((o) => {
              const checked = value.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  aria-pressed={checked}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[13px] text-brand-primary hover:bg-[rgba(50,43,95,0.04)] transition-colors"
                >
                  <span
                    className={clsx(
                      "w-4 h-4 shrink-0 rounded-[3px] border flex items-center justify-center",
                      checked ? "bg-brand-secondary-500 border-brand-secondary-500" : "border-black/25"
                    )}
                  >
                    {checked && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span className="truncate">{o.label}</span>
                </button>
              );
            })
          )}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full border-t border-black/5 px-3 pt-2 pb-1 text-left text-[12px] text-brand-secondary-500 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
