"use client";
import { Badge } from "@/components/ui/Badge";
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
      <td className="py-3 px-4 align-top">
        {/* Wraps rather than truncates: which areas an entry spans is the point
            of the column, and hiding the second one would defeat it. */}
        <div className="flex flex-wrap gap-1">
          {insight.productAreas.map((area) => (
            <Badge key={area} type="area" value={area} />
          ))}
        </div>
      </td>
      <td className="py-3 px-4 align-top">
        <Badge type="theme" value={insight.theme} />
      </td>
      <td className="py-3 px-4 align-top">
        {insight.persona && (
          <span className="text-[12px] text-brand-primary opacity-60 line-clamp-2">{insight.persona}</span>
        )}
      </td>
      {/* The widest column by intent: it holds the only free text on the row, and
          every other column is short or nowrap, so this is where the space goes.
          min-w claims it under table-auto, max-w stops it swallowing the row. */}
      <td className="py-3 px-4 align-top min-w-[26rem] max-w-[34rem]">
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
      <td className="py-3 px-4 align-top">
        {insight.client && (
          <span className="text-[13px] font-medium text-brand-secondary-600">{insight.client}</span>
        )}
      </td>
      <td className="py-3 px-4 align-top whitespace-nowrap">
        {insight.sourceName && (
          insight.sourceUrl ? (
            <a
              href={insight.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[12px] text-brand-secondary-600 hover:underline"
            >
              <span className="max-w-[160px] truncate">{insight.sourceName}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          ) : (
            <span className="text-[12px] text-brand-primary opacity-40 max-w-[180px] block truncate">
              {insight.sourceName}
            </span>
          )
        )}
      </td>
      <td className="py-3 px-4 align-top whitespace-nowrap text-[12px] text-brand-primary opacity-40">
        {dateStr}
      </td>
      <td className="py-3 px-4 align-top whitespace-nowrap">
        <span
          className="text-[12px] text-brand-primary opacity-50"
          title={insight.createdBy ?? "Imported before author tracking"}
        >
          {shortName(insight.createdBy)}
        </span>
      </td>
      <td className="py-3 px-4 align-top whitespace-nowrap">
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
