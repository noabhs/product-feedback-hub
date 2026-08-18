"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  /** 1-based, and already clamped by the caller via `pageCount`. */
  page: number;
  pageCount: number;
  /** Index of the first row on this page, 0-based. */
  start: number;
  pageSize: number;
  total: number;
  noun: string;
  onPage: (page: number) => void;
}

/**
 * Footer for a client-side paginated table: which rows you're looking at, and
 * the two controls to move. Shared by the feedback table and the event log so
 * the two don't drift into looking like different components.
 */
export function Pagination({ page, pageCount, start, pageSize, total, noun, onPage }: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-[rgba(50,43,95,0.08)]">
      <p className="text-[12px] text-brand-primary opacity-45 tabular-nums">
        {start + 1}–{Math.min(start + pageSize, total)} of {total.toLocaleString()} {noun}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 text-[12px] text-brand-primary px-2 py-1 rounded-sm disabled:opacity-25 enabled:hover:bg-[rgba(50,43,95,0.05)] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>
        <span className="text-[12px] text-brand-primary opacity-60 px-2 tabular-nums">
          Page {page} of {pageCount}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          className="inline-flex items-center gap-1 text-[12px] text-brand-primary px-2 py-1 rounded-sm disabled:opacity-25 enabled:hover:bg-[rgba(50,43,95,0.05)] transition-colors"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
