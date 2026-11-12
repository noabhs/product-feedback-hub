"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SIDEBAR_COOKIE } from "@/lib/sidebar-state";

/**
 * The sidebar stays server-rendered (it holds the sign-out server action) and
 * arrives as `sidebar`. From md up it is a fixed column as before; below that
 * it becomes a slide-in drawer opened from a slim top bar.
 *
 * On md and up the column can also be collapsed to a slim rail holding only the
 * button that brings it back. That choice is remembered in a cookie the layout
 * reads, so it survives a reload without a flash. Below md the drawer is the
 * only mode, and collapsing doesn't apply.
 */
export function AppShell({
  sidebar,
  defaultCollapsed = false,
  children,
}: {
  sidebar: React.ReactNode;
  /** What the cookie said when the page was rendered. */
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const setSidebarCollapsed = (next: boolean) => {
    setCollapsed(next);
    // A year: this is a preference, not a session.
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };
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

      {/* Sidebar: drawer on mobile, a column on md+ that can fold down to a rail.
          `md:relative` rather than static, so the toggle below can be positioned
          against it. */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] transition-transform duration-200 md:relative md:z-auto md:max-w-none md:translate-x-0 md:shrink-0 md:overflow-hidden md:transition-[width] ${
          collapsed ? "md:w-12" : "md:w-56"
        } ${open ? "translate-x-0" : "-translate-x-full"}`}
        // The column carries the colour itself, not just the aside inside it:
        // once the aside is hidden the rail would otherwise be page-coloured,
        // and the expand button — white — would vanish into it.
        style={{ background: "#250359" }}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-sm text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
        {/* Held at the expanded width so the column is clipped, not squashed,
            while it animates; `invisible` once collapsed, which also takes its
            links out of the tab order. */}
        <div className={`h-full md:w-56 ${collapsed ? "md:invisible" : ""}`}>{sidebar}</div>

        {/* Sits on the logo's line when open and in the middle of the rail when
            collapsed, so it doesn't jump between the two. */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`hidden md:flex absolute top-6 z-10 h-7 w-7 items-center justify-center rounded-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors ${
            collapsed ? "left-2.5" : "right-3"
          }`}
        >
          {collapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
        </button>
      </div>

      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
