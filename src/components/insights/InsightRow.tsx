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
        <Badge type="area" value={insight.productArea} />
      </td>
      <td className="py-3 px-4 align-top">
        <Badge type="theme" value={insight.theme} />
      </td>
      <td className="py-3 px-4 align-top">
        {insight.persona && (
          <span className="text-[12px] text-brand-primary opacity-60 line-clamp-2">{insight.persona}</span>
        )}
      </td>
      <td className="py-3 px-4 align-top max-w-xs">
        <span className="text-[14px] text-brand-primary font-medium group-hover:text-brand-secondary-600 transition-colors leading-snug line-clamp-2">
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
