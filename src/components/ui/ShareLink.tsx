"use client";
import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

/** Idle, or the outcome of the last attempt — a refusal has to say so rather
 *  than sit there looking like a successful copy. */
export type CopyState = "copied" | "failed" | null;

interface CopyLink {
  state: CopyState;
  /** Bumped per attempt, so clicking again replays the toast animation instead
   *  of leaving an already-visible toast looking unresponsive. */
  attempt: number;
  copy: () => Promise<void>;
}

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
export function useCopyLink(): CopyLink {
  const [state, setState] = useState<CopyState>(null);
  const [attempt, setAttempt] = useState(0);

  // Cleared on a timer so the toast doesn't sit on screen. A failure lingers
  // longer, because it asks the user to go and do something.
  useEffect(() => {
    if (!state) return;
    const t = setTimeout(() => setState(null), state === "copied" ? 2500 : 5000);
    return () => clearTimeout(t);
  }, [state, attempt]);

  async function copy() {
    const url = window.location.href;
    setAttempt((n) => n + 1);
    try {
      // Absent on http origins and refusable even on https, so this is a real
      // failure path rather than a defensive catch.
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState(fallbackCopy(url) ? "copied" : "failed");
    }
  }

  return { state, attempt, copy };
}

/**
 * The confirmation for a copy attempt. Rendered by each call site next to its own
 * button, so the two share the wording without sharing the button chrome.
 */
export function CopyToast({ state, attempt }: { state: CopyState; attempt: number }) {
  if (!state) return null;
  return state === "copied" ? (
    <Toast message="Link copied to clipboard" replayKey={attempt} />
  ) : (
    // Names the recovery rather than the error: the clipboard was refused, so
    // telling the user to press ⌘C would send them at a selection that's gone.
    <Toast message="Couldn't copy — copy the link from the address bar" tone="error" replayKey={attempt} />
  );
}

/**
 * The page-header version. The label stays "Share" through a copy — the toast is
 * the feedback, so swapping the label too would say the same thing twice and make
 * the button width jump.
 */
export function ShareLink({ title = "Copy a link to this view" }: { title?: string }) {
  const { state, attempt, copy } = useCopyLink();
  return (
    <>
      <Button variant="ghost" size="sm" onClick={copy} title={title}>
        <Link2 className="w-4 h-4" />
        Share
      </Button>
      <CopyToast state={state} attempt={attempt} />
    </>
  );
}

/**
 * The pre-clipboard-API route, for when `navigator.clipboard` is missing or
 * refused. `execCommand` is deprecated but still the only synchronous copy every
 * browser honours.
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
