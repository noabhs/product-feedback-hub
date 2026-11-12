/**
 * How the sidebar remembers being collapsed, in two places that agree.
 *
 * The URL (`?sidebar=collapsed` / `?sidebar=expanded`) makes a view reproducible:
 * reload it, bookmark it, paste it. The cookie (`1` collapsed, `0` open) carries
 * the choice to pages whose URL doesn't mention it, and lets the server render
 * the right width on first paint instead of flashing open and snapping shut.
 * Either one being absent means "never chosen" — which is why neither is ever
 * written for someone who hasn't touched the button.
 *
 * Plain module, not part of AppShell: the layout reads the cookie on the server,
 * and a value exported from a "use client" file reaches a server component as a
 * client reference, not as the string.
 */
export const SIDEBAR_COOKIE = "sidebar_collapsed";
export const SIDEBAR_PARAM = "sidebar";

export type SidebarMode = "collapsed" | "expanded";

/** `?sidebar=…`. Anything else — a typo, a stale link — is "not specified". */
export function modeFromParam(raw: string | null | undefined): SidebarMode | null {
  return raw === "collapsed" || raw === "expanded" ? raw : null;
}

/** The cookie's `1` / `0`. */
export function modeFromCookie(raw: string | null | undefined): SidebarMode | null {
  return raw === "1" ? "collapsed" : raw === "0" ? "expanded" : null;
}
