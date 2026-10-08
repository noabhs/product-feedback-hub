"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/**
 * The sidebar stays server-rendered (it holds the sign-out server action) and
 * arrives as `sidebar`. From md up it is a fixed column as before; below that
 * it becomes a slide-in drawer opened from a slim top bar.
 */
export function AppShell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer after navigating, and on Escape.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex flex-col md:flex-row h-dvh bg-surface-app overflow-hidden">
      {/* Mobile top bar */}
      <header
        className="md:hidden shrink-0 flex items-center gap-3 px-3 h-14"
        style={{ background: "#250359" }}
      >
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-sm text-white/80 hover:text-white hover:bg-white/10"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-sm">navina</span>
        <span className="text-teal text-[11px] font-medium">Product Insights Hub</span>
      </header>

      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar: drawer on mobile, static column on md+ */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] transition-transform duration-200 md:static md:z-auto md:w-56 md:max-w-none md:translate-x-0 md:shrink-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-sm text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebar}
      </div>

      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
