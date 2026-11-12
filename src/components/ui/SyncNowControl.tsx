"use client";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type Status = {
  configured: boolean;
  running: boolean;
  run: { firedAt: string; sessionUrl?: string; finishedAt?: string } | null;
};

/**
 * Sidebar row that starts the daily feedback sync on demand. Only rendered for
 * the owner (see the sidebar), and /api/sync/run checks again on every call.
 * While a run is in flight it polls so the row goes back to "Sync now" by itself.
 */
export function SyncNowControl() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status is a nicety; the button still works without it, so failures are swallowed.
  const load = useCallback(
    () =>
      fetch("/api/sync/run", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<Status>) : null))
        .catch(() => null),
    [],
  );

  useEffect(() => {
    let live = true;
    void load().then((s) => live && s && setStatus(s));
    return () => {
      live = false;
    };
  }, [load]);

  const running = status?.running ?? false;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => void load().then((s) => s && setStatus(s)), 20_000);
    return () => clearInterval(t);
  }, [running, load]);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sync/run", { method: "POST" });
      const body = await res.json();
      if (!res.ok) setError(body.error ?? "Couldn't start the sync.");
      const s = await load();
      if (s) setStatus(s);
    } catch {
      setError("Couldn't reach the hub.");
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || running || status?.configured === false;
  const label = busy ? "Starting…" : running ? "Sync running…" : "Sync now";
  const hint =
    status?.configured === false
      ? "Not set up yet — add SYNC_ROUTINE_ID and SYNC_ROUTINE_TOKEN in Vercel"
      : "Pull new Slack and Jira feedback into the hub now";

  return (
    <div>
      <button
        onClick={start}
        disabled={disabled}
        title={hint}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white/70 transition-all duration-150"
      >
        <RefreshCw className={`w-4 h-4 shrink-0 ${busy || running ? "animate-spin" : ""}`} />
        <span className="flex-1 text-left">{label}</span>
      </button>
      {running && status?.run?.sessionUrl && (
        <a
          href={status.run.sessionUrl}
          target="_blank"
          rel="noreferrer"
          className="block px-3 pb-1 text-[11px] text-teal hover:underline"
        >
          Watch the run
        </a>
      )}
      {error && <p className="px-3 pb-1 text-[11px] text-red-300">{error}</p>}
    </div>
  );
}
