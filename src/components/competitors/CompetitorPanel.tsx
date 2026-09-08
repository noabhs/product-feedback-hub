"use client";
import { useEffect } from "react";
import { X, ExternalLink, Globe } from "lucide-react";
import { sourceTypeLabel, sourceTypeColor } from "@/lib/competitor-sources";
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

          {/*
           * Future integration point: the "Ask" feature (src/app/api/ai/qa) could
           * retrieve from Competitor rows the same way it already blends Insight
           * feedback with the Account table. Not designed here.
           */}
          <Section title="Sources">
            {competitor.sources.length ? (
              <div className="space-y-2">
                {competitor.sources.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border border-[rgba(50,43,95,0.08)] px-3 py-2 hover:bg-[rgba(93,7,226,0.03)] transition-colors"
                  >
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${sourceTypeColor(s.type)}`}
                    >
                      {sourceTypeLabel(s.type)}
                    </span>
                    <span className="text-[14px] text-brand-primary flex-1 truncate">{s.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-brand-primary opacity-40 shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-brand-primary opacity-40">
                No sources added yet — CI Launcher links are still being collected for this one.
              </p>
            )}
          </Section>

          {competitor.lastUpdated && (
            <p className="text-[11px] text-brand-primary opacity-30 text-center">
              Last updated {new Date(competitor.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
