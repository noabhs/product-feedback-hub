"use client";
import { useState } from "react";
import Link from "next/link";
import { Send, Check, TrendingUp, TrendingDown, Copy } from "lucide-react";
import type { RecapPick } from "@/lib/weekly-recap";

export interface RecapView {
  weekLabel: string;
  kind?: "week" | "month";
  entries: number;
  entriesPrev: number;
  clients: string[];
  newClients: string[];
  topAreas: { area: string; label: string; count: number }[];
  questions: number;
  asks: number;
  narrative: string | null;
  picks: RecapPick[];
  /** Slack-flavoured text, for the clipboard. Fetched with the period. */
  markdown?: string;
}

function Figure({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <p className="text-[22px] font-extrabold text-brand-primary leading-none tabular-nums">{value}</p>
      <p className="text-[11px] text-brand-primary opacity-45 mt-1">{label}</p>
    </div>
  );
}

/**
 * The same recap that goes to Slack on a Sunday, for the week just ended — not a
 * rolling seven days, so a number quoted from here matches the number in the
 * channel.
 */
export function WeeklyRecapCard({ recap: initial }: { recap: RecapView }) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [recap, setRecap] = useState<RecapView>(initial);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delta = recap.entries - recap.entriesPrev;

  async function pick(next: "week" | "month") {
    if (next === period) return;
    setPeriod(next);
    setSent(false);
    setCopied(false);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/recap?period=${next}`);
      if (!res.ok) throw new Error(`Couldn't load the ${next}`);
      setRecap(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    // The way to get this into Slack while the webhook is still waiting on an
    // admin: paste it. Slack renders the same markdown.
    if (!recap.markdown) return;
    await navigator.clipboard.writeText(recap.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function sendNow() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/cron/weekly-recap?period=${period}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed with ${res.status}`);
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5 mb-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-brand-primary">
            {period === "month" ? "Month" : "Week"} of {recap.weekLabel}
            {loading && <span className="ml-2 text-[12px] font-normal opacity-40">loading…</span>}
          </h2>
          <p className="text-[11px] text-brand-primary opacity-45 mt-0.5">
            {period === "month"
              ? "Everything logged this month so far"
              : "The recap posted to Slack on Sunday"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-sm border border-[rgba(50,43,95,0.15)] overflow-hidden">
            {(["week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => pick(p)}
                className={`px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                  period === p
                    ? "bg-brand-secondary-500 text-white"
                    : "bg-white text-brand-primary hover:bg-[rgba(50,43,95,0.04)]"
                }`}
              >
                {p === "week" ? "Last week" : "This month"}
              </button>
            ))}
          </div>
          <button
            onClick={copy}
            disabled={!recap.markdown}
            title="Copy as Slack-ready text — paste it into a channel yourself"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-primary border border-[rgba(50,43,95,0.15)] rounded-sm px-2.5 py-1.5 hover:bg-[rgba(50,43,95,0.04)] disabled:opacity-40 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        <button
          onClick={sendNow}
          disabled={sending || sent}
          className="inline-flex items-center gap-1.5 shrink-0 text-[12px] font-medium text-brand-secondary-600 border border-[rgba(93,7,226,0.25)] rounded-sm px-2.5 py-1.5 hover:bg-[rgba(93,7,226,0.05)] disabled:opacity-40 transition-colors"
        >
          {sent ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          {sent ? "Sent" : sending ? "Sending…" : "Send to Slack"}
        </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}

      {recap.entries === 0 ? (
        <p className="text-[13px] text-brand-primary opacity-50">
          No new feedback landed in this {period}
          {recap.entriesPrev > 0 && ` — there were ${recap.entriesPrev} in the previous ${period}`}.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-x-10 gap-y-4 pb-4 border-b border-[rgba(50,43,95,0.06)]">
            <div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-[22px] font-extrabold text-brand-primary leading-none tabular-nums">
                  {recap.entries}
                </p>
                {delta !== 0 && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                      delta > 0 ? "text-positive-strong" : "text-negative-strong"
                    }`}
                    title={`${recap.entriesPrev} the week before`}
                  >
                    {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(delta)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-brand-primary opacity-45 mt-1">
                new entries <span className="opacity-70">· {recap.entriesPrev} prior {period}</span>
              </p>
            </div>
            <Figure value={recap.clients.length} label="clients heard from" />
            <Figure value={recap.questions} label="questions added" />
            <Figure value={recap.asks} label="asked of the hub" />
            {recap.topAreas.length > 0 && (
              <div>
                <p className="text-[13px] text-brand-primary leading-snug">
                  {recap.topAreas.map((a) => `${a.label} (${a.count})`).join(" · ")}
                </p>
                <p className="text-[11px] text-brand-primary opacity-45 mt-1">top areas</p>
              </div>
            )}
          </div>

          {recap.newClients.length > 0 && (
            <p className="text-[12px] text-brand-primary mt-3">
              🎉 First feedback ever from{" "}
              <span className="font-semibold">{recap.newClients.join(", ")}</span>
            </p>
          )}

          {recap.narrative ? (
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-brand-primary opacity-45 uppercase tracking-wide mb-1.5">
                What stood out
              </p>
              <p className="text-[13.5px] text-brand-primary/80 leading-relaxed">{recap.narrative}</p>
            </div>
          ) : (
            recap.picks.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold text-brand-primary opacity-45 uppercase tracking-wide mb-1.5">
                  Highlights
                </p>
                <div className="space-y-1.5">
                  {recap.picks.map((p) => (
                    <div key={p.id}>
                      <Link
                        href={`/insights?open=${p.id}`}
                        className="text-[13px] text-brand-primary hover:text-brand-secondary-600 transition-colors leading-snug"
                      >
                        {p.oneLiner}
                      </Link>
                      <p className="text-[11px] text-brand-primary opacity-40">
                        {p.client ?? "No client"}
                        {p.areas.length > 0 && ` · ${p.areas.join(", ")}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
