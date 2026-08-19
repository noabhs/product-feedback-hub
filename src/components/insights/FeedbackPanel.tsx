"use client";
import { useEffect } from "react";
import { X, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Comments } from "@/components/insights/Comments";
import { sourceCategory } from "@/lib/sources";
import type { InsightItem } from "@/lib/types";

interface FeedbackPanelProps {
  item: InsightItem;
  /** Signed-in address, for comment ownership. */
  currentUser: string | null;
  onEdit: (item: InsightItem) => void;
  onDelete: (id: string) => void;
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

function fmtMonth(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function fmtDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Feedback detail as a right-hand drawer rather than its own page, so reading an
 * entry doesn't lose the reader's place in the table — filters, sort and scroll
 * are all still there behind it.
 */
export function FeedbackPanel({ item, currentUser, onEdit, onDelete, onClose }: FeedbackPanelProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const date = fmtMonth(item.date);
  const added = fmtDay(item.createdAt);
  // Only worth showing when the remap changed it — otherwise it's the same string twice.
  const originalClient =
    item.clientRaw && item.clientRaw !== item.client ? item.clientRaw : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" onClick={onClose} />

      <aside
        role="dialog"
        aria-label="Feedback detail"
        className="relative w-full max-w-[36rem] h-full bg-surface-app shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 px-6 py-4 bg-white border-b border-[rgba(50,43,95,0.1)]">
          <div className="flex flex-wrap gap-2 pt-0.5">
            {item.productAreas.map((area) => (
              <Badge key={area} type="area" value={area} />
            ))}
            <Badge type="theme" value={item.theme} />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
            <button
              onClick={() => {
                if (confirm("Delete this feedback entry?")) onDelete(item.id);
              }}
              className="p-2 rounded text-brand-primary opacity-40 hover:opacity-100 hover:text-red-600 transition-all"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded text-brand-primary opacity-40 hover:opacity-80 transition-opacity"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5">
            <h2 className="text-[18px] font-bold text-brand-primary leading-snug mb-3">{item.oneLiner}</h2>

            {item.content && item.content !== item.oneLiner && (
              <p className="text-[14px] text-brand-primary/80 leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>
            )}

            <div className="border-t border-[rgba(50,43,95,0.08)] mt-5 pt-5 grid grid-cols-2 gap-x-4 gap-y-4">
              <Prop label="Client">
                {item.client ? (
                  <p className="text-[14px] font-semibold text-brand-secondary-600">{item.client}</p>
                ) : (
                  <p className="text-[14px] text-brand-primary opacity-30">—</p>
                )}
                {originalClient && (
                  <p className="text-[11px] text-brand-primary opacity-40 mt-0.5">
                    recorded as “{originalClient}”
                  </p>
                )}
              </Prop>

              <Prop label="Persona / POC">
                <p className={item.persona ? "text-[14px] text-brand-primary" : "text-[14px] text-brand-primary opacity-30"}>
                  {item.persona || "—"}
                </p>
              </Prop>

              <Prop label="Date">
                <p className={date ? "text-[14px] text-brand-primary" : "text-[14px] text-brand-primary opacity-30"}>
                  {date || "—"}
                </p>
              </Prop>

              <Prop label="WTP">
                <p className={item.wtp ? "text-[14px] text-brand-primary" : "text-[14px] text-brand-primary opacity-30"}>
                  {item.wtp || "—"}
                </p>
              </Prop>

              <Prop label="Source">
                {item.sourceName ? (
                  item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[14px] text-brand-secondary-600 hover:underline break-all"
                    >
                      {item.sourceName}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-[14px] text-brand-primary break-words">{item.sourceName}</p>
                  )
                ) : (
                  <p className="text-[14px] text-brand-primary opacity-30">—</p>
                )}
              </Prop>

              <Prop label="Captured via">
                <p className="text-[14px] text-brand-primary">
                  {sourceCategory(item.sourceName, item.sourceType)}
                </p>
              </Prop>

              <Prop label="Reporter">
                <p className={item.createdBy ? "text-[14px] text-brand-primary" : "text-[14px] text-brand-primary opacity-30"}>
                  {item.createdBy || "Imported"}
                </p>
              </Prop>

              <Prop label="Added">
                <p className={added ? "text-[14px] text-brand-primary" : "text-[14px] text-brand-primary opacity-30"}>
                  {added || "—"}
                </p>
              </Prop>
            </div>
          </div>

          <Comments insightId={item.id} currentUser={currentUser} />
        </div>
      </aside>
    </div>
  );
}
