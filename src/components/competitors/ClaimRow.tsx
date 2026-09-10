"use client";
import { useState } from "react";
import { clsx } from "clsx";
import { ChevronRight, ChevronDown, Lock, ExternalLink } from "lucide-react";
import { competitorTopicLabel, confidenceLabel, areaLabel } from "@/lib/labels";
import type { CompetitorInsightItem } from "@/lib/types";

/**
 * One claim about a competitor, shared by the panel and the claims table so the
 * two never drift on how confidence and sensitivity are shown.
 *
 * The confidence chip is not decoration. These claims come from documents that
 * mix corroborated fact with a competitor's own marketing, and the source
 * documents tag themselves VERIFIED / REPORTED / CLAIMED. Rendering them
 * identically would let a landing-page boast read with the authority of a
 * verified figure.
 */

const CONFIDENCE_STYLE: Record<string, string> = {
  VERIFIED: "bg-green-50 text-green-700",
  REPORTED: "bg-blue-50 text-blue-700",
  // Amber on purpose: the competitor's own claim about itself, unverified.
  CLAIMED: "bg-amber-50 text-amber-700",
};

function day(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface ClaimRowProps {
  claim: CompetitorInsightItem;
  /** Shown on the cross-competitor table, redundant inside a single panel. */
  showCompetitor?: boolean;
}

export function ClaimRow({ claim, showCompetitor = false }: ClaimRowProps) {
  const [open, setOpen] = useState(false);
  const internal = claim.sensitivity === "internal";

  return (
    <div className="border-b border-[rgba(50,43,95,0.06)] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-2 py-2 text-left group"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-primary opacity-40" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-primary opacity-40 group-hover:opacity-70" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {showCompetitor && (
              <span className="text-[12px] font-semibold text-brand-secondary-600 shrink-0">
                {claim.competitorName}
              </span>
            )}
            <span className="text-[13.5px] text-brand-primary group-hover:text-brand-secondary-600">
              {claim.oneLiner}
            </span>
          </div>
        </div>

        <span
          title={`Confidence: ${confidenceLabel(claim.confidence)}`}
          className={clsx(
            "shrink-0 text-[10.5px] font-medium px-1.5 py-0.5 rounded-full",
            CONFIDENCE_STYLE[claim.confidence] ?? "bg-gray-50 text-gray-600",
          )}
        >
          {confidenceLabel(claim.confidence)}
        </span>
        {internal && (
          <span
            title={claim.sensitivityReason ?? "Not for sharing outside Navina"}
            className="shrink-0 inline-flex items-center gap-1 text-[10.5px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700"
          >
            <Lock className="w-2.5 h-2.5" />
            Internal
          </span>
        )}
      </button>

      {open && (
        <div className="pl-5 pb-3 pr-1">
          <p className="text-[13px] text-brand-primary opacity-80 leading-relaxed whitespace-pre-wrap">
            {claim.content}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {claim.topics.map((t) => (
              <span
                key={t}
                className="text-[10.5px] font-medium px-1.5 py-0.5 rounded-full bg-secondary-50 text-brand-secondary-600"
              >
                {competitorTopicLabel(t)}
              </span>
            ))}
            {claim.productAreas.map((a) => (
              <span
                key={a}
                title="Navina product area this bears on"
                className="text-[10.5px] font-medium px-1.5 py-0.5 rounded-full bg-[rgba(50,43,95,0.05)] text-brand-primary opacity-70"
              >
                {areaLabel(a)}
              </span>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-brand-primary opacity-40">
            {claim.documentUrl && claim.documentTitle && (
              <a
                href={claim.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="The document this claim was read out of"
                className="inline-flex items-center gap-1 text-brand-secondary-600 opacity-100 hover:underline"
              >
                {claim.documentTitle}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            {claim.asOf && <span>as of {day(claim.asOf)}</span>}
            {internal && claim.sensitivityReason && <span>internal: {claim.sensitivityReason}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
