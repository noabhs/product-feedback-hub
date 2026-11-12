/**
 * Name of the cookie that remembers a collapsed sidebar: "1" collapsed, "0" open.
 *
 * Lives here, not in AppShell, because the layout reads it on the server and
 * AppShell writes it in the browser — and a value exported from a "use client"
 * file arrives in a server component as a client reference, not as the string.
 * A cookie rather than localStorage for the same reason: the server can read it,
 * so a collapsed sidebar is collapsed in the first paint instead of flashing open.
 */
export const SIDEBAR_COOKIE = "sidebar_collapsed";
