"use client";
import { clsx } from "clsx";
import { Check, AlertTriangle } from "lucide-react";

/**
 * A brief confirmation, bottom-centre of the viewport.
 *
 * Deliberately not a provider-and-queue toast system: the app has exactly one
 * thing to confirm this way, and a single rendered element is far less machinery
 * than a context, a portal and a stack for one message. Sits above the modals and
 * side panels, which are z-50 — a confirmation the panel covered would be useless.
 */
export function Toast({
  message,
  tone = "success",
  /** Changes to replay the entrance animation when the same toast fires again. */
  replayKey,
}: {
  message: string;
  tone?: "success" | "error";
  replayKey?: number;
}) {
  return (
    <div
      key={replayKey}
      // `status` rather than `alert`: this confirms something the user just did,
      // so it shouldn't interrupt whatever a screen reader is partway through.
      role="status"
      aria-live="polite"
      className={clsx(
        "fixed bottom-6 left-1/2 z-[60] flex items-center gap-2 rounded-pill px-4 py-2.5",
        "text-[13px] font-medium text-white shadow-lg animate-toast-in",
        // Horizontal centring, via Tailwind's `translate` property — kept out of
        // the keyframes, which animate `transform` so the two don't compound.
        "-translate-x-1/2",
        tone === "success" ? "bg-navy" : "bg-negative-strong"
      )}
    >
      {tone === "success" ? (
        <Check className="w-4 h-4 text-teal shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 shrink-0" />
      )}
      {message}
    </div>
  );
}
