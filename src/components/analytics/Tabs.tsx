"use client";
import { useState } from "react";

/**
 * Takes already-rendered tab content rather than a render prop, so a server
 * component can hand over its output without crossing the server/client
 * boundary with a function.
 *
 * Inactive tabs stay mounted (hidden via CSS, not unmounted) so switching back
 * doesn't lose client-side state such as pagination.
 */
export function Tabs({
  tabs,
  initialTab,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  /** Opens on this tab when it exists, e.g. from a ?tab= link. */
  initialTab?: string;
}) {
  const [active, setActive] = useState(tabs.some((t) => t.id === initialTab) ? initialTab : tabs[0]?.id);

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 border-b border-[rgba(50,43,95,0.08)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
              active === t.id
                ? "border-brand-secondary-500 text-brand-primary"
                : "border-transparent text-brand-primary opacity-45 hover:opacity-70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} className={t.id === active ? "" : "hidden"}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
