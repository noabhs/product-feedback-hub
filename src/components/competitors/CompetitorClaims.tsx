"use client";
import { COMPETITOR_TOPIC_LABELS, competitorTopicLabel } from "@/lib/labels";
import { ClaimRow } from "@/components/competitors/ClaimRow";
import type { CompetitorInsightItem } from "@/lib/types";

/**
 * What the hub knows about one competitor, grouped by topic.
 *
 * Replaced a section that showed one prose summary per document. Prose could not
 * be filtered, could not be cited to a single statement, and forced one
 * sensitivity tag onto a document that mixes shareable product facts with
 * pricing that must not leave the building.
 *
 * Topics are rendered in the declared order of COMPETITOR_TOPIC_LABELS rather
 * than by claim count, so the same competitor reads the same way twice and
 * Pricing doesn't move above Capabilities because one more claim landed.
 */

const TOPIC_ORDER = Object.keys(COMPETITOR_TOPIC_LABELS);

export function CompetitorClaims({
  insights,
  loading,
}: {
  insights: CompetitorInsightItem[];
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-[12px] text-brand-primary opacity-30">Reading what we know…</p>;
  }

  if (!insights.length) {
    return (
      <p className="text-[13px] text-brand-primary opacity-40">
        Nothing read out of this competitor&rsquo;s links yet, so the ask can&rsquo;t answer from them.
      </p>
    );
  }

  // A claim can carry several topics, so it appears under each — the same fact
  // genuinely belongs in both Pricing and Packaging, and hiding it from one of
  // them would make that topic look thinner than it is.
  const byTopic = TOPIC_ORDER.map((topic) => ({
    topic,
    claims: insights.filter((i) => i.topics.includes(topic)),
  })).filter((g) => g.claims.length > 0);

  const untopiced = insights.filter((i) => !i.topics.some((t) => TOPIC_ORDER.includes(t)));

  return (
    <div className="space-y-4">
      {byTopic.map(({ topic, claims }) => (
        <div key={topic}>
          <div className="flex items-baseline gap-2 mb-1">
            <h4 className="text-[12px] font-semibold text-brand-primary uppercase tracking-wide">
              {competitorTopicLabel(topic)}
            </h4>
            <span className="text-[11px] text-brand-primary opacity-35 tabular-nums">{claims.length}</span>
          </div>
          <div>
            {claims.map((c) => (
              <ClaimRow key={`${topic}-${c.id}`} claim={c} />
            ))}
          </div>
        </div>
      ))}

      {untopiced.length > 0 && (
        <div>
          <h4 className="text-[12px] font-semibold text-brand-primary uppercase tracking-wide mb-1">
            Other
          </h4>
          {untopiced.map((c) => (
            <ClaimRow key={c.id} claim={c} />
          ))}
        </div>
      )}
    </div>
  );
}
