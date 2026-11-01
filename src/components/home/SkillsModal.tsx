"use client";
import { useEffect } from "react";
import { X, ExternalLink, AlertCircle } from "lucide-react";
import { PM_SKILLS } from "@/lib/pm-skills";

export function SkillsModal({ onClose }: { onClose: () => void }) {
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
      <div role="dialog" aria-modal="true" aria-label="Useful skills for PMs" className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(50,43,95,0.08)]">
          <div>
            <h2 className="text-[17px] font-extrabold text-brand-primary">Useful skills for PMs</h2>
            <p className="text-[12px] text-brand-primary opacity-50 mt-0.5">Claude skills shared by the product team. Each opens in Claude.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-brand-primary opacity-40 hover:opacity-80 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul className="px-6 py-4 overflow-y-auto divide-y divide-[rgba(50,43,95,0.08)]">
          {PM_SKILLS.map(({ name, description, url, extra, note, Icon }) => (
            <li key={name} className="flex items-start gap-3 py-3.5">
              <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-lg bg-violet-100 text-violet-700">
                <Icon className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-brand-primary">{name}</div>
                <p className="text-[12.5px] text-brand-primary opacity-65 mt-0.5">{description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-secondary-600 hover:underline">
                    Open skill <ExternalLink className="w-3 h-3" />
                  </a>
                  {extra && (
                    <a href={extra.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-brand-secondary-600 hover:underline">
                      {extra.label} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {note && (
                  <p className="flex items-start gap-1.5 text-[11.5px] text-amber-700 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    {note}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
