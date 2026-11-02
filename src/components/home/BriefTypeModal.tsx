"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import type { BriefKind } from "@/components/home/BriefModal";

export interface BriefType {
  /** A brief kind opens its modal; "discovery" goes to the discovery doc page. */
  id: BriefKind | "discovery";
  title: string;
  sub: string;
  Icon: React.FC<{ className?: string }>;
  tint: string;
}

/** Step one of "Generate brief": what kind of brief. */
export function BriefTypeModal({ types, onPick, onClose }: { types: BriefType[]; onPick: (t: BriefType) => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label="Generate brief" className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(50,43,95,0.08)]">
          <div>
            <h2 className="text-[17px] font-extrabold text-brand-primary">Generate brief</h2>
            <p className="text-[12px] text-brand-primary opacity-50 mt-0.5">What do you need?</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-brand-primary opacity-40 hover:opacity-80 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ul className="p-3">
          {types.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onPick(t)}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-[rgba(93,7,226,0.05)] transition-colors cursor-pointer"
              >
                <span className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-lg ${t.tint}`}>
                  <t.Icon className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold text-brand-primary">{t.title}</span>
                  <span className="block text-[12.5px] text-brand-primary opacity-60">{t.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
