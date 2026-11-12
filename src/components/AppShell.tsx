"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SIDEBAR_COOKIE, SIDEBAR_PARAM, modeFromParam, type SidebarMode } from "@/lib/sidebar-state";

/**
 * The sidebar stays server-rendered (it holds the sign-out server action) and
 * arrives as `sidebar`. From md up it is a fixed column as before; below that
 * it becomes a slide-in drawer opened from a slim top bar.
 *
 * On md and up the column can also fold down to a rail of icons. The choice is
 * kept in the URL and in a cookie — see lib/sidebar-state.ts for why both.
 * Below md the drawer is the only mode, and folding doesn't apply.
 */
export function AppShell({
  sidebar,
  defaultMode = null,
  children,
}: {
  sidebar: React.ReactNode;
  /** What the cookie said when the page was rendered; null if never chosen. */
  defaultMode?: SidebarMode | null;
  children: React.ReactNode;
}) {
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

  const close = () => setOpen(false);

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
          onClick={close}
          aria-hidden
        />
      )}

      {/* Reading the URL needs a Suspense boundary when a page is prerendered
          (Next.js will fail the build otherwise), and scoping it to the column
          keeps a bailout from touching the page. The fallback is the same
          column, drawn from the cookie alone. */}
      <Suspense
        fallback={
          <SidebarFrame collapsed={defaultMode === "collapsed"} open={open} onClose={close} onToggle={() => {}}>
            {sidebar}
          </SidebarFrame>
        }
      >
        <SidebarColumn defaultMode={defaultMode} open={open} onClose={close}>
          {sidebar}
        </SidebarColumn>
      </Suspense>

      <main id="hub-main" className="relative flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}

/**
 * Owns the collapsed state and keeps the cookie and the URL in step with it.
 *
 * `pref` is the source of truth and the URL is a mirror, the same arrangement as
 * useUrlState for filters. The one place the arrow points the other way is
 * arriving on a page whose URL names a mode — a pasted link — which is adopted.
 */
function SidebarColumn({
  defaultMode,
  open,
  onClose,
  children,
}: {
  defaultMode: SidebarMode | null;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const urlMode = modeFromParam(useSearchParams().get(SIDEBAR_PARAM));
  const [pref, setPref] = useState<SidebarMode | null>(defaultMode);

  // Adopt the URL's mode on arrival at a page, and only then. Adopting whenever
  // the URL changes would undo a click: the mirror below writes the URL a beat
  // after the click, and a second click inside that beat would be reverted by
  // the first one's echo. Also runs on the very first render, so a server
  // render of a link carrying `?sidebar=collapsed` comes out collapsed.
  const [arrivedAt, setArrivedAt] = useState<string | null>(null);
  if (pathname !== arrivedAt) {
    setArrivedAt(pathname);
    if (urlMode !== null) setPref(urlMode);
  }

  // The cookie: carries the choice to pages whose URL doesn't mention it, and
  // lets the layout render the right width on first paint.
  useEffect(() => {
    if (pref) document.cookie = `${SIDEBAR_COOKIE}=${pref === "collapsed" ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  }, [pref]);

  // The URL: a page that rewrites its own query (filters, router.replace) drops
  // the param, and a Link to another page never had it. Putting it back here
  // means every page, once a mode has been chosen, carries it.
  useEffect(() => {
    if (pref === null || urlMode === pref) return;
    const url = new URL(window.location.href);
    url.searchParams.set(SIDEBAR_PARAM, pref);
    window.history.replaceState(null, "", url);
  }, [pref, urlMode]);

  const collapsed = pref === "collapsed";
  return (
    <SidebarFrame
      collapsed={collapsed}
      open={open}
      onClose={onClose}
      onToggle={() => setPref(collapsed ? "expanded" : "collapsed")}
    >
      {children}
    </SidebarFrame>
  );
}

/** The column itself — markup only, so the Suspense fallback can reuse it. */
function SidebarFrame({
  collapsed,
  open,
  onClose,
  onToggle,
  children,
}: {
  collapsed: boolean;
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    // Drawer on mobile, a column on md+ that can fold to a rail. `md:relative`
    // rather than static, so the toggle can be positioned against it, and the
    // data attribute is what the `rail:` variant keys off. The column carries the
    // colour itself, not just the aside inside it, so it is never page-coloured
    // beside or behind its content.
    <div
      data-sidebar-collapsed={collapsed ? "true" : "false"}
      className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] transition-transform duration-200 md:relative md:z-auto md:max-w-none md:translate-x-0 md:shrink-0 md:overflow-hidden md:transition-[width] ${
        collapsed ? "md:w-12" : "md:w-56"
      } ${open ? "translate-x-0" : "-translate-x-full"}`}
      style={{ background: "#250359" }}
    >
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="md:hidden absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-sm text-white/70 hover:text-white hover:bg-white/10"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="h-full">{children}</div>

      {/* On the logo's line when open; under the logo mark in the rail, where
          the sidebar header leaves room for it. */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`hidden md:flex absolute z-10 h-7 w-7 items-center justify-center rounded-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors ${
          collapsed ? "left-2.5 top-[52px]" : "right-3 top-6"
        }`}
      >
        {collapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
      </button>
    </div>
  );
}
