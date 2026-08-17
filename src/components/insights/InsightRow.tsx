"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink, Trash2, Pencil, MessageSquare } from "lucide-react";
import { shortName } from "@/lib/people";
import type { InsightItem } from "@/lib/types";

interface InsightRowProps {
  insight: InsightItem;
  onDelete?: (id: string) => void;
  onEdit?: (item: InsightItem) => void;
}

export function InsightRow({ insight, onDelete, onEdit }: InsightRowProps) {
  const dateStr = insight.date
    ? new Date(insight.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this feedback entry?")) onDelete?.(insight.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(insight);
  };

  return (
    <tr className="group border-b border-[rgba(50,43,95,0.07)] hover:bg-[rgba(93,7,226,0.03)] transition-colors">
      <td className="py-3 px-4 align-top">
        <Badge type="area" value={insight.productArea} />
      </td>
      <td className="py-3 px-4 align-top">
        <Badge type="theme" value={insight.theme} />
      </td>
      <td className="py-3 px-4 align-top">
        {insight.client && (
          <span className="text-[13px] font-medium text-brand-secondary-600">{insight.client}</span>
        )}
      </td>
      <td className="py-3 px-4 align-top max-w-xs">
        <Link
          href={`/insights/${insight.id}`}
          className="text-[14px] text-brand-primary font-medium hover:text-brand-secondary-600 transition-colors leading-snug line-clamp-2"
        >
          {insight.oneLiner}
        </Link>
        {insight.persona && (
          <p className="text-[12px] text-brand-primary opacity-40 mt-0.5">{insight.persona}</p>
        )}
      </td>
      <td className="py-3 px-4 align-top whitespace-nowrap">
        {insight.sourceName && (
          insight.sourceUrl ? (
            <a
              href={insight.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
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
        <Link
          href={`/insights/${insight.id}`}
          className={`inline-flex items-center gap-1 text-[12px] transition-opacity ${
            insight.commentCount
              ? "text-brand-secondary-600 opacity-80 hover:opacity-100"
              : "text-brand-primary opacity-25 hover:opacity-50"
          }`}
          title={
            insight.commentCount
              ? `${insight.commentCount} comment${insight.commentCount === 1 ? "" : "s"}`
              : "No comments yet — click to add one"
          }
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {insight.commentCount ?? 0}
        </Link>
      </td>
      <td className="py-3 px-4 align-top">
        <div className="flex items-center justify-end gap-1">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1.5 rounded text-brand-primary opacity-0 group-hover:opacity-30 hover:!opacity-80 hover:text-brand-secondary-500 transition-all"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded text-brand-primary opacity-0 group-hover:opacity-30 hover:!opacity-80 hover:text-red-500 transition-all"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
