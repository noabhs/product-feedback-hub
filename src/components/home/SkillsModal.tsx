"use client";
import { useEffect } from "react";
import { X, ExternalLink, AlertCircle } from "lucide-react";
import { PM_SKILLS, SKILL_CATEGORIES } from "@/lib/pm-skills";

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
            <p className="text-[12px] text-brand-primary opacity-50 mt-0.5">Claude skills shared by the product team. Click a skill to open it in Claude.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-brand-primary opacity-40 hover:opacity-80 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-6">
          {SKILL_CATEGORIES.map((category) => {
            const skills = PM_SKILLS.filter((k) => k.category === category);
            if (!skills.length) return null;
            return (
              <section key={category}>
                {/* A filled band, not a faint label: the list is long enough that
                    the groups are what someone scans for first. */}
                <h3 className="flex items-center justify-between rounded-md bg-[rgba(93,7,226,0.08)] px-3 py-1.5 mb-2 text-[13px] font-extrabold uppercase tracking-wide text-brand-secondary-600">
                  {category}
                  <span className="text-[11px] font-semibold opacity-70">{skills.length}</span>
                </h3>
                <ul className="space-y-1">
                  {skills.map(({ name, description, url, extra, note, Icon }) => (
                    <li
                      key={name}
                      // The whole row is the link (the name's ::after stretches
                      // over it); the spec-format link sits above that overlay.
                      className={`group relative flex items-start gap-3 rounded-lg px-3 py-3 transition-colors ${
                        url ? "hover:bg-[rgba(93,7,226,0.05)]" : ""
                      }`}
                    >
                      <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-lg bg-violet-100 text-violet-700">
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-brand-primary">
                          {url ? (
                            <a href={url} target="_blank" rel="noreferrer" className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                              {name}
                            </a>
                          ) : (
                            name
                          )}
                        </div>
                        <p className="text-[12.5px] text-brand-primary opacity-65 mt-0.5">{description}</p>
                        {!url && <p className="text-[12px] text-brand-primary opacity-40 mt-1">Link coming soon</p>}
                        {extra && (
                          <a href={extra.url} target="_blank" rel="noreferrer" className="relative z-10 inline-flex items-center gap-1 text-[12.5px] text-brand-secondary-600 hover:underline mt-1.5">
                            {extra.label} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {note && (
                          <p className="flex items-start gap-1.5 text-[11.5px] text-amber-700 mt-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                            {note}
                          </p>
                        )}
                      </div>
                      {url && (
                        <ExternalLink className="w-4 h-4 shrink-0 mt-1 text-brand-secondary-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
