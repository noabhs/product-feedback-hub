"use client";
import { useEffect } from "react";
import { clsx } from "clsx";
import { X, Lock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CONFIDENCE_STYLE, day } from "@/components/competitors/ClaimRow";
import { competitorTopicLabel, confidenceLabel } from "@/lib/labels";
import type { CompetitorInsightItem } from "@/lib/types";

interface ClaimPanelProps {
  claim: CompetitorInsightItem;
  /** Opens the competitor's own panel (overview, sources, all its claims). */
  onOpenCompetitor: (competitorId: string) => void;
  onClose: () => void;
}

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1">{label}</p>
      {children}
    </div>
  );
}

/** One claim as a right-hand drawer, mirroring the feedback panel on /insights. */
export function ClaimPanel({ claim, onOpenCompetitor, onClose }: ClaimPanelProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const internal = claim.sensitivity === "internal";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" onClick={onClose} />

      <aside
        role="dialog"
        aria-label="Claim detail"
        className="relative w-full max-w-[36rem] h-full bg-surface-app shadow-2xl flex flex-col"
      >
        <div className="shrink-0 flex items-start justify-between gap-3 px-6 py-4 bg-white border-b border-[rgba(50,43,95,0.1)]">
          <div className="min-w-0">
            <button
              onClick={() => onOpenCompetitor(claim.competitorId)}
              className="text-[12px] font-semibold text-brand-secondary-600 hover:underline mb-1"
            >
              {claim.competitorName}
            </button>
            <h2 className="text-[18px] font-bold text-brand-primary leading-snug">{claim.oneLiner}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={clsx(
                  "text-[10.5px] font-medium px-1.5 py-0.5 rounded-full",
                  CONFIDENCE_STYLE[claim.confidence] ?? "bg-gray-50 text-gray-600",
                )}
              >
                {confidenceLabel(claim.confidence)}
              </span>
              {internal && (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  <Lock className="w-2.5 h-2.5" />
                  Internal
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded text-brand-primary opacity-40 hover:opacity-80 transition-opacity shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5">
            <p className="text-[14px] text-brand-primary leading-relaxed whitespace-pre-wrap">{claim.content}</p>

            <div className="border-t border-[rgba(50,43,95,0.08)] mt-5 pt-5 grid grid-cols-2 gap-x-4 gap-y-4">
              <Prop label="Topics">
                <div className="flex flex-wrap gap-1">
                  {claim.topics.length ? (
                    claim.topics.map((t) => (
                      <span
                        key={t}
                        className="text-[10.5px] font-medium px-1.5 py-0.5 rounded-full bg-secondary-50 text-brand-secondary-600"
                      >
                        {competitorTopicLabel(t)}
                      </span>
                    ))
                  ) : (
                    <span className="text-[14px] text-brand-primary opacity-30">—</span>
                  )}
                </div>
              </Prop>
              <Prop label="Product areas">
                <div className="flex flex-wrap gap-1">
                  {claim.productAreas.length ? (
                    claim.productAreas.map((a) => <Badge key={a} type="area" value={a} />)
                  ) : (
                    <span className="text-[14px] text-brand-primary opacity-30">—</span>
                  )}
                </div>
              </Prop>
              <Prop label="As of">
                <p className="text-[14px] text-brand-primary">{day(claim.asOf) ?? "—"}</p>
              </Prop>
              <Prop label="Source document">
                {claim.documentUrl && claim.documentTitle ? (
                  <a
                    href={claim.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[14px] text-brand-secondary-600 hover:underline break-words"
                  >
                    {claim.documentTitle}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-[14px] text-brand-primary opacity-30">—</p>
                )}
              </Prop>
              {internal && claim.sensitivityReason && (
                <div className="col-span-2">
                  <Prop label="Why internal">
                    <p className="text-[14px] text-brand-primary">{claim.sensitivityReason}</p>
                  </Prop>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
