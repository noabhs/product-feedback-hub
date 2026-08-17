"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink, Trash2, Pencil, MessageSquare } from "lucide-react";

export interface InsightItem {
  id: string;
  productArea: string;
  theme: string;
  persona?: string | null;
  oneLiner: string;
  content?: string | null;
  client?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  date?: string | null;
  wtp?: string | null;
  createdBy?: string | null;
  commentCount?: number;
}

interface InsightCardProps {
  insight: InsightItem;
  onDelete?: (id: string) => void;
  onEdit?: (item: InsightItem) => void;
}

export function InsightCard({ insight, onDelete, onEdit }: InsightCardProps) {
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
    <Link
      href={`/insights/${insight.id}`}
      className="block bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-[rgba(50,43,95,0.08)] hover:border-[rgba(93,7,226,0.2)] group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge type="area" value={insight.productArea} />
          <Badge type="theme" value={insight.theme} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!!insight.commentCount && (
            <span
              className="flex items-center gap-1 text-[12px] text-brand-primary opacity-45 mr-1"
              title={`${insight.commentCount} comment${insight.commentCount === 1 ? "" : "s"}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {insight.commentCount}
            </span>
          )}
          {dateStr && <span className="text-[12px] text-brand-primary opacity-40 mr-1">{dateStr}</span>}
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1 rounded text-brand-primary opacity-0 group-hover:opacity-30 hover:!opacity-80 hover:text-brand-secondary-500 transition-all"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1 rounded text-brand-primary opacity-0 group-hover:opacity-30 hover:!opacity-80 hover:text-red-500 transition-all"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-[15px] font-medium text-brand-primary leading-snug mb-3 group-hover:text-brand-secondary-600 transition-colors">
        {insight.oneLiner}
      </p>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {insight.client && (
            <span className="text-[13px] font-medium text-brand-secondary-600 shrink-0">{insight.client}</span>
          )}
          {insight.persona && (
            <span className="text-[12px] text-brand-primary opacity-50 truncate">{insight.persona}</span>
          )}
        </div>
        {insight.sourceName && (
          insight.sourceUrl ? (
            <a
              href={insight.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[12px] text-brand-secondary-600 opacity-60 hover:opacity-100 shrink-0 transition-opacity"
            >
              <span className="max-w-[140px] truncate">{insight.sourceName}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-[12px] text-brand-primary opacity-30 shrink-0 max-w-[160px] truncate">
              {insight.sourceName}
            </span>
          )
        )}
      </div>
    </Link>
  );
}
