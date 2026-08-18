"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { Check, ChevronDown, Search } from "lucide-react";

interface MultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  options: { value: string; label: string }[];
  /** Shown when nothing is picked, e.g. "All clients". */
  placeholder: string;
  className?: string;
}

/** Below this many options, scanning the list beats typing at it. */
const SEARCH_THRESHOLD = 8;

/**
 * Checkbox dropdown for the feed filters. A native <select multiple> needs
 * ctrl-click to add a second value and has no closed state, so the filters get
 * their own panel: click to add, click again to remove. Long lists (clients,
 * of which there are ~100) get a search box.
 */
export function MultiSelect({ value, onChange, options, placeholder, className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const searchable = options.length > SEARCH_THRESHOLD;

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

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // Ticked options stay listed however the query narrows things, so a pick
    // can always be undone without clearing the search first.
    return options.filter((o) => o.label.toLowerCase().includes(q) || value.includes(o.value));
  }, [options, query, value]);

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
        // Query cleared on every open — the button is the only way in, so
        // reopening never shows a list still narrowed by a forgotten search.
        onClick={() => { setQuery(""); setOpen((o) => !o); }}
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
          {searchable && (
            <div className="sticky top-0 bg-white px-2 pt-1 pb-2 border-b border-black/5">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-primary opacity-30 pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  autoFocus
                  className="w-full h-8 rounded-sm bg-white border border-black/15 pl-7 pr-2 text-[13px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500"
                />
              </div>
            </div>
          )}
          {options.length === 0 ? (
            <p className="px-3 py-2 text-[13px] text-brand-primary opacity-40">Nothing to filter by yet</p>
          ) : shown.length === 0 ? (
            <p className="px-3 py-2 text-[13px] text-brand-primary opacity-40">No match for “{query}”</p>
          ) : (
            shown.map((o) => {
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
