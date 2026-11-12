"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { Comments } from "@/components/insights/Comments";

/**
 * Free-form comments on the page you are looking at (not on one record).
 * A round button sits bottom-right on every page; it opens a side panel with the
 * thread for the current pathname. The count on the button loads once per page.
 */
export function PageComments({ currentUser }: { currentUser: string | null }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const count = counts[pathname];

  // Fetch the badge count for each page we land on.
  useEffect(() => {
    if (counts[pathname] !== undefined) return;
    let cancelled = false;
    fetch(`/api/page-comments?path=${encodeURIComponent(pathname)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setCounts((c) => ({ ...c, [pathname]: d.comments?.length ?? 0 }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, counts]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Comment on this page"
        aria-expanded={open}
        title="Comment on this page"
        className="fixed bottom-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-brand-secondary-500 text-white shadow-lg hover:opacity-90 transition-opacity"
      >
        <MessageSquare className="w-5 h-5" />
        {!!count && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-brand-secondary-500 border border-brand-secondary-500 text-[10px] font-semibold flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/20 md:bg-transparent" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-[rgba(50,43,95,0.12)] bg-white shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(50,43,95,0.08)]">
          <div>
            <p className="text-[14px] font-semibold text-brand-primary">Page comments</p>
            <p className="text-[11px] text-brand-primary opacity-40">Visible to everyone on this page</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close comments"
            className="w-8 h-8 flex items-center justify-center rounded-sm text-brand-primary opacity-50 hover:opacity-100 hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {open && (
            <Comments
              key={pathname}
              scope={{ kind: "page", id: pathname }}
              currentUser={currentUser}
              embedded
              onCountChange={(n) => setCounts((c) => ({ ...c, [pathname]: n }))}
            />
          )}
        </div>
      </aside>
    </>
  );
}
