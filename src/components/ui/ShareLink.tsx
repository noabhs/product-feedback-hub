"use client";
import { useEffect, useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Idle, or the outcome of the last attempt — a refusal has to say so rather
 *  than sit there looking like a successful copy. */
export type CopyState = "copied" | "failed" | null;

/**
 * Copies the address bar, which the filter bars keep in step with what's on
 * screen — so the link carries the filters, the sort and any open panel, not
 * just the page name.
 *
 * A hook rather than only a component because the event log's header uses its
 * own compact button chrome; the clipboard handling is the part worth sharing.
 *
 * Reads `window.location` at click time rather than holding the URL in state,
 * because the URL is rewritten by `useUrlState` outside of React's knowledge and
 * a held copy would go stale the moment a filter changed.
 */
export function useCopyLink(): { state: CopyState; copy: () => Promise<void> } {
  const [state, setState] = useState<CopyState>(null);

  // Cleared on a timer so the button returns to its resting label. A failure
  // lingers longer, because "Press ⌘C" is an instruction to act on.
  useEffect(() => {
    if (!state) return;
    const t = setTimeout(() => setState(null), state === "copied" ? 2000 : 4000);
    return () => clearTimeout(t);
  }, [state]);

  async function copy() {
    const url = window.location.href;
    try {
      // Absent on http origins and refusable even on https, so this is a real
      // failure path rather than a defensive catch.
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState(fallbackCopy(url) ? "copied" : "failed");
    }
  }

  return { state, copy };
}

/** The label for a copy button in each state, so the two call sites word it the same. */
export function copyLinkLabel(state: CopyState): string {
  return state === "copied" ? "Copied" : state === "failed" ? "Press ⌘C" : "Copy link";
}

export function ShareLink({ title = "Copy a link to this view" }: { title?: string }) {
  const { state, copy } = useCopyLink();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copy}
      title={title}
      // Announced rather than only shown, since the label change is the only
      // feedback that the click did anything.
      aria-live="polite"
    >
      {state === "copied" ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      {copyLinkLabel(state)}
    </Button>
  );
}

/**
 * The pre-clipboard-API route, for when `navigator.clipboard` is missing or
 * refused. `execCommand` is deprecated but still the only synchronous copy every
 * browser honours; if it fails too, the button falls back to advertising the
 * keyboard shortcut.
 */
function fallbackCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  // Kept in the layout but out of sight: a `display: none` element can't be
  // selected, and scrolling to a focused off-screen one would jump the page.
  area.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(area);
  }
}
