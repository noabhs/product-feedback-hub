"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, ChevronRight, Copy, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useApiKey } from "@/hooks/useApiKey";
import type { StoredWeeklyBrief } from "@/lib/competitor-weekly-brief";

const PROSE =
  "text-[13.5px] text-brand-primary/80 leading-relaxed " +
  "[&_h2]:text-[12px] [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-brand-primary [&_h2]:mt-4 [&_h2]:mb-1 " +
  "[&_p]:m-0 [&_p+p]:mt-2 [&_strong]:font-semibold [&_strong]:text-brand-primary " +
  "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mt-1 [&_ul]:space-y-1 [&_li]:leading-relaxed";

/** Only http(s) becomes a link; these URLs come from imports and the web. */
const isWebUrl = (u: string | null): u is string => !!u && /^https?:\/\//i.test(u);

/** The brief as plain text for the clipboard, with its sources listed after it. */
function plainText(b: StoredWeeklyBrief): string {
  const sources = [
    ...b.hubSources.map((s) => `[${s.n}] ${s.title} (${s.meta})${s.url ? ` ${s.url}` : ""}`),
    ...b.webSources.map((s, i) => `[${b.hubSources.length + i + 1}] ${s.title ?? s.url} ${s.url}`),
  ];
  return `${b.markdown ?? ""}${sources.length ? `\n\nSources\n${sources.join("\n")}` : ""}`;
}

/**
 * The latest completed week's competitor brief, written by the Sunday job.
 *
 * Loading the page only reads what is stored. A week nobody has written yet
 * shows a button instead of calling the model, since opening a page is not a
 * request to spend credits.
 */
export function WeeklyCompetitorBrief() {
  const { apiKey } = useApiKey();
  const [weekLabel, setWeekLabel] = useState<string | null>(null);
  const [brief, setBrief] = useState<StoredWeeklyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/competitors/weekly-brief");
        const d = await res.json();
        if (!cancelled) {
          setWeekLabel(d.weekLabel ?? null);
          setBrief(d.brief ?? null);
        }
      } catch {
        // The card is optional; a failed read leaves the empty state with its button.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function writeNow() {
    setWriting(true);
    setError(null);
    const abort = new AbortController();
    // Web search runs several model turns; give up at the function's own limit.
    const timer = setTimeout(() => abort.abort(), 120_000);
    try {
      const res = await fetch("/api/competitors/weekly-brief", {
        method: "POST",
        headers: apiKey ? { "x-anthropic-key": apiKey } : undefined,
        signal: abort.signal,
      });
      const d = await res.json().catch(() => null);
      if (!res.ok || !d) throw new Error(d?.error ?? `Failed with ${res.status}`);
      setWeekLabel(d.weekLabel);
      setBrief(d.brief);
    } catch (e) {
      setError(
        (e as Error).name === "AbortError"
          ? "The brief took over two minutes and was cancelled. Try again."
          : (e as Error).message,
      );
    } finally {
      clearTimeout(timer);
      setWriting(false);
    }
  }

  async function copy() {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(plainText(brief));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be refused; nothing useful to say beyond not showing the tick.
    }
  }

  if (loading) {
    return <div className="h-24 mb-6 bg-white rounded-md animate-pulse border border-[rgba(50,43,95,0.08)]" />;
  }

  const sourceCount = brief ? brief.hubSources.length + brief.webSources.length : 0;

  return (
    <section className="mb-6 bg-white rounded-md border border-[rgba(50,43,95,0.08)] px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-brand-primary">
            <Sparkles className="w-3.5 h-3.5 text-brand-secondary-600" />
            Weekly competitor brief{weekLabel ? ` · ${weekLabel}` : ""}
          </p>
          {brief && (
            <p className="text-[11px] text-brand-primary opacity-40 mt-0.5">
              Written {new Date(brief.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {brief.usedWebSearch ? " · includes web news" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {brief?.markdown && (
            <Button variant="ghost" size="sm" onClick={copy}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          {brief && (
            <Button variant="ghost" size="sm" onClick={writeNow} disabled={writing}>
              <RefreshCw className={`w-3.5 h-3.5 ${writing ? "animate-spin" : ""}`} />
              {writing ? "Writing…" : "Rewrite"}
            </Button>
          )}
        </div>
      </div>

      {!brief ? (
        <div className="mt-2">
          <p className="text-[13px] text-brand-primary opacity-60 max-w-xl">
            Not written yet for this week. The Sunday job writes it from what clients said about competitors,
            new claims, and recent news.
          </p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={writeNow} disabled={writing}>
            <Sparkles className={`w-3.5 h-3.5 ${writing ? "animate-pulse" : ""}`} />
            {writing ? "Writing… this can take a minute" : "Write it now"}
          </Button>
        </div>
      ) : brief.markdown ? (
        <div className="mt-2">
          <div className={`${PROSE} max-h-52 overflow-hidden [mask-image:linear-gradient(black_70%,transparent)]`}>
            <ReactMarkdown>{brief.markdown}</ReactMarkdown>
          </div>
          <details
            className="group mt-1"
            onToggle={(e) => {
              // The preview above is clipped; opening this shows everything.
              const body = (e.currentTarget.previousElementSibling as HTMLElement | null);
              if (body) {
                body.style.maxHeight = e.currentTarget.open ? "none" : "";
                body.style.maskImage = e.currentTarget.open ? "none" : "";
              }
            }}
          >
            <summary className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-secondary-600 cursor-pointer list-none hover:underline">
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
              <span className="group-open:hidden">Read the full brief{sourceCount ? ` and ${sourceCount} sources` : ""}</span>
              <span className="hidden group-open:inline">Show less</span>
            </summary>
            {sourceCount > 0 && (
              <ol className="mt-3 space-y-1 text-[12px] text-brand-primary opacity-70">
                {brief.hubSources.map((s) => (
                  <li key={`h${s.n}`} className="flex gap-1.5">
                    <span className="opacity-50 shrink-0">[{s.n}]</span>
                    <span className="min-w-0">
                      {isWebUrl(s.url) ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand-secondary-600 hover:underline">
                          {s.title}
                          <ExternalLink className="inline w-2.5 h-2.5 ml-1" />
                        </a>
                      ) : (
                        s.title
                      )}
                      <span className="opacity-60"> · {s.meta}</span>
                    </span>
                  </li>
                ))}
                {brief.webSources.map((s, i) => (
                  <li key={`w${i}`} className="flex gap-1.5">
                    <span className="opacity-50 shrink-0">[{brief.hubSources.length + i + 1}]</span>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand-secondary-600 hover:underline min-w-0">
                      {s.title ?? s.url}
                      <ExternalLink className="inline w-2.5 h-2.5 ml-1" />
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </details>
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-brand-primary opacity-60">
          A quiet week: no client feedback named a competitor, and no competitor claims or source documents were added.
        </p>
      )}

      {error && <p className="mt-2 text-[12px] text-red-700">{error}</p>}
    </section>
  );
}
