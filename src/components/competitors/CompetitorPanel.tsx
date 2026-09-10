"use client";
import { useEffect } from "react";
import { X, Globe } from "lucide-react";
import { CompetitorSources } from "@/components/competitors/CompetitorSources";
import type { CompetitorItem } from "@/lib/types";

interface CompetitorPanelProps {
  competitor: CompetitorItem;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5">
      <h3 className="text-[13px] font-bold text-brand-primary mb-3">{title}</h3>
      {children}
    </div>
  );
}

/**
 * A pill for category/subgroup, matching the inline chip classes AccountPanel
 * uses for product tags — not worth a new Badge variant for one place.
 */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium bg-secondary-50 text-brand-secondary-600">
      {children}
    </span>
  );
}

const dayFormat = { month: "short", day: "numeric", year: "numeric" } as const;

/**
 * Both dates, because they disagree and the disagreement is the useful part.
 *
 * `lastUpdated` is CI Launcher's own stamp on its notes. `newestSourceAt` is the
 * most recent change to any document actually behind the links. Innovaccer's
 * notes read June 2025 while its Notion page had been edited three weeks ago —
 * showing only the first would present year-old framing as current, and only the
 * second would imply the notes had been revised when they hadn't.
 */
function Freshness({ competitor }: { competitor: CompetitorItem }) {
  const notes = competitor.lastUpdated ? new Date(competitor.lastUpdated) : null;
  const source = competitor.coverage.newestSourceAt ? new Date(competitor.coverage.newestSourceAt) : null;
  if (!notes && !source) return null;

  const lagDays = notes && source ? (source.getTime() - notes.getTime()) / 86_400_000 : 0;

  return (
    <div className="text-[11px] text-brand-primary opacity-40 text-center leading-relaxed pb-1">
      {notes && <span>These notes: {notes.toLocaleDateString("en-US", dayFormat)}</span>}
      {notes && source && <span> · </span>}
      {source && <span>newest source: {source.toLocaleDateString("en-US", dayFormat)}</span>}
      {lagDays > 90 && (
        <span className="block text-amber-700 opacity-90 mt-0.5">
          The source material has moved on since these notes were written.
        </span>
      )}
    </div>
  );
}

export function CompetitorPanel({ competitor, onClose }: CompetitorPanelProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" onClick={onClose} />

      <aside
        role="dialog"
        aria-label={`${competitor.name} detail`}
        className="relative w-full max-w-[36rem] h-full bg-surface-app shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 px-6 py-4 bg-white border-b border-[rgba(50,43,95,0.1)]">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold text-brand-primary leading-snug">{competitor.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Pill>{competitor.category}</Pill>
              {competitor.subgroup && <Pill>{competitor.subgroup}</Pill>}
            </div>
            {competitor.positioning && (
              <p className="text-[12px] text-brand-primary opacity-50 mt-1.5">{competitor.positioning}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded text-brand-primary opacity-40 hover:opacity-80 transition-opacity shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Section title="Website">
            {competitor.website ? (
              <a
                href={competitor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-brand-secondary-600 hover:underline break-all"
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                {competitor.website}
              </a>
            ) : (
              <p className="text-[14px] text-brand-primary opacity-30">—</p>
            )}
          </Section>

          {competitor.overview && (
            <Section title="Overview">
              <p className="text-[14px] text-brand-primary leading-relaxed whitespace-pre-wrap">
                {competitor.overview}
              </p>
            </Section>
          )}

          {competitor.keyFacts && (
            <Section title="Key facts">
              <p className="text-[13px] text-brand-primary leading-relaxed whitespace-pre-wrap">
                {competitor.keyFacts}
              </p>
            </Section>
          )}

          {competitor.differentiation && (
            <Section title="How we compare">
              <p className="text-[13px] text-brand-primary leading-relaxed whitespace-pre-wrap">
                {competitor.differentiation}
              </p>
            </Section>
          )}

          <Section title="Sources">
            <CompetitorSources competitor={competitor} />
          </Section>

          <Freshness competitor={competitor} />
        </div>
      </aside>
    </div>
  );
}
