"use client";
import { Badge } from "@/components/ui/Badge";
import { areaLabel } from "@/lib/labels";
import { ExternalLink, MessageSquare } from "lucide-react";
import { shortName } from "@/lib/people";
import type { InsightItem } from "@/lib/types";

interface InsightRowProps {
  insight: InsightItem;
  /** Opens the detail panel. Edit and delete live in there now. */
  onOpen: (item: InsightItem) => void;
}

/** One-liner, plus the detail underneath when it says something more. */
function fullText(insight: InsightItem): string {
  const detail = insight.content?.trim();
  return detail && detail !== insight.oneLiner.trim()
    ? `${insight.oneLiner}\n\n${detail}`
    : insight.oneLiner;
}

export function InsightRow({ insight, onOpen }: InsightRowProps) {
  const dateStr = insight.date
    ? new Date(insight.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <tr
      onClick={() => onOpen(insight)}
      className="group border-b border-[rgba(50,43,95,0.07)] hover:bg-[rgba(93,7,226,0.03)] transition-colors cursor-pointer"
    >
      <td className="py-3 px-3 align-top">
        {/* Two badges, then a count. Which areas an entry spans is the point of
            the column, but an entry tagged with five of them was making a
            five-line row — the rest are one hover or one click away. */}
        <div className="flex flex-wrap gap-1">
          {insight.productAreas.slice(0, 2).map((area) => (
            <Badge key={area} type="area" value={area} />
          ))}
          {insight.productAreas.length > 2 && (
            <span
              className="text-[11px] text-brand-primary opacity-40 self-center"
              title={insight.productAreas.map(areaLabel).join(", ")}
            >
              +{insight.productAreas.length - 2}
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-3 align-top">
        <Badge type="theme" value={insight.theme} />
      </td>
      <td className="py-3 px-3 align-top">
        {insight.persona && (
          <span
            className="text-[12px] text-brand-primary opacity-60 line-clamp-2 break-words"
            title={insight.persona}
          >
            {insight.persona}
          </span>
        )}
      </td>
      {/* The widest column by intent: it holds the only free text on the row.
          Its width comes from the colgroup — it is the one column with none set,
          so it absorbs whatever the fixed ones leave. */}
      <td className="py-3 px-3 align-top">
        <span
          className="text-[14px] text-brand-primary font-medium group-hover:text-brand-secondary-600 transition-colors leading-snug line-clamp-2"
          // line-clamp still bites on a long one-liner, so hovering gives the
          // untruncated text — and the detail below it, when there's more to read
          // than the one-liner repeats.
          title={fullText(insight)}
        >
          {insight.oneLiner}
        </span>
      </td>
      <td className="py-3 px-3 align-top">
        {insight.client && (
          <span
            className="text-[13px] font-medium text-brand-secondary-600 line-clamp-2 break-words"
            title={insight.client}
          >
            {insight.client}
          </span>
        )}
      </td>
      <td className="py-3 px-3 align-top whitespace-nowrap">
        {insight.sourceName && (
          insight.sourceUrl ? (
            <a
              href={insight.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[12px] text-brand-secondary-600 hover:underline"
            >
              <span className="truncate" title={insight.sourceName}>{insight.sourceName}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          ) : (
            <span
              className="text-[12px] text-brand-primary opacity-40 block truncate"
              title={insight.sourceName}
            >
              {insight.sourceName}
            </span>
          )
        )}
      </td>
      <td className="py-3 px-3 align-top whitespace-nowrap text-[12px] text-brand-primary opacity-40">
        {dateStr}
      </td>
      <td className="py-3 px-3 align-top whitespace-nowrap">
        <span
          className="text-[12px] text-brand-primary opacity-50 block truncate"
          title={insight.createdBy ?? "Imported before author tracking"}
        >
          {shortName(insight.createdBy)}
        </span>
      </td>
      <td className="py-3 px-3 align-top whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 text-[12px] ${
            insight.commentCount ? "text-brand-secondary-600 opacity-80" : "text-brand-primary opacity-25"
          }`}
          title={
            insight.commentCount
              ? `${insight.commentCount} comment${insight.commentCount === 1 ? "" : "s"}`
              : "No comments yet"
          }
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {insight.commentCount ?? 0}
        </span>
      </td>
    </tr>
  );
}
