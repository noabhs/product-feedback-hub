"use client";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { X, Copy, Check, Send, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { NoKeyBanner } from "@/components/ui/NoKeyBanner";
import { useApiKey } from "@/hooks/useApiKey";
import { AREA_OPTIONS } from "@/lib/labels";

export type BriefKind = "client" | "competitor" | "area";

interface Option {
  value: string;
  label: string;
}

interface BriefResult {
  title: string;
  markdown: string;
  usedWebSearch: boolean;
  webSources: { title: string | null; url: string }[];
  hubEntries: number;
}

const COPY: Record<BriefKind, { title: string; pick: string; placeholder: string; web: boolean; source: string }> = {
  client: {
    title: "Generate client brief",
    pick: "Client",
    placeholder: "Select a client…",
    web: false,
    source: "Written from what the hub holds on this client.",
  },
  competitor: {
    title: "Generate competitor brief",
    pick: "Competitor",
    placeholder: "Select a competitor…",
    web: true,
    source: "Written from the hub and a live web search.",
  },
  area: {
    title: "Generate product area brief",
    pick: "Product areas",
    placeholder: "Select one or more areas…",
    web: true,
    source: "Written from the hub and a live web search.",
  },
};

/** Bold spans and [n] hub citations inside one line. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[\d{1,3}\])/g).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (/^\[\d+\]$/.test(part)) return <sup key={i} className="text-brand-secondary-600 opacity-70 ml-0.5">{part}</sup>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Just enough markdown for a brief: ## headings, bullets, paragraphs. */
function BriefBody({ markdown }: { markdown: string }) {
  return (
    <div className="text-[13.5px] leading-relaxed text-brand-primary space-y-2">
      {markdown.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return null;
        const h = t.match(/^#{1,4}\s+(.*)$/);
        if (h) return <h3 key={i} className="text-[14px] font-bold pt-2">{inline(h[1])}</h3>;
        const b = t.match(/^[-*•]\s+(.*)$/);
        if (b) return <p key={i} className="pl-4 -indent-3">• {inline(b[1])}</p>;
        return <p key={i}>{inline(t)}</p>;
      })}
    </div>
  );
}

/** The copy-ready text: the brief plus its web sources as a plain list. */
function bodyText(r: BriefResult): string {
  const sources = r.webSources.length
    ? `\n\nWeb sources:\n${r.webSources.map((s, i) => `${i + 1}. ${s.title ?? s.url} — ${s.url}`).join("\n")}`
    : "";
  return `${r.markdown}${sources}`;
}

const copyText = (r: BriefResult) => `${r.title}\n\n${bodyText(r)}`;

export function BriefModal({
  kind,
  canSendToSlack = false,
  subject,
  subjectLabel,
  onClose,
}: {
  kind: BriefKind;
  canSendToSlack?: boolean;
  /**
   * Opened from somewhere that already knows the subject — a client's own
   * panel, say. The picker is skipped and the brief starts writing on open,
   * because picking the client you just opened is a step with no decision in it.
   */
  subject?: string;
  /** What to call the subject on screen, when the value isn't the name. */
  subjectLabel?: string;
  onClose: () => void;
}) {
  const copy = COPY[kind];
  const { aiHeaders } = useApiKey();
  const [options, setOptions] = useState<Option[]>(kind === "area" ? AREA_OPTIONS : []);
  const [loadingOptions, setLoadingOptions] = useState(kind !== "area" && !subject);
  const [single, setSingle] = useState(subject ?? "");
  const [multi, setMulti] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BriefResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [slack, setSlack] = useState<"idle" | "sending" | "sent">("idle");
  const [slackError, setSlackError] = useState("");

  useEffect(() => {
    // Nothing to pick from when the subject is already known.
    if (kind === "area" || subject) return;
    let cancelled = false;
    const url = kind === "client" ? "/api/accounts" : "/api/competitors";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setOptions(
          kind === "client"
            ? (data as string[]).map((n) => ({ value: n, label: n }))
            : (data.competitors as { id: string; name: string }[]).map((c) => ({ value: c.id, label: c.name })),
        );
      })
      .catch(() => !cancelled && setError("Couldn't load the list."))
      .finally(() => !cancelled && setLoadingOptions(false));
    return () => {
      cancelled = true;
    };
  }, [kind, subject]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const ready = kind === "area" ? multi.length > 0 : !!single;

  async function generate() {
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    setSlack("idle");
    setSlackError("");
    try {
      const res = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...aiHeaders },
        body: JSON.stringify({ kind, subject: kind === "area" ? multi : single }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Starts on open when the subject came with the click. Guarded by a ref
  // rather than the busy flag: in dev the effect runs twice, and that would be
  // two model calls for one click.
  const started = useRef(false);
  useEffect(() => {
    if (!subject || started.current) return;
    started.current = true;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on open
  }, [subject]);

  async function copyBrief() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(copyText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select the text and copy it by hand.");
    }
  }

  async function sendToSlack() {
    if (!result || slack === "sending") return;
    setSlack("sending");
    setSlackError("");
    try {
      const res = await fetch("/api/briefs/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: result.title, markdown: bodyText(result) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setSlack("sent");
    } catch (e) {
      setSlack("idle");
      setSlackError((e as Error).message);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={copy.title} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(50,43,95,0.08)]">
          <h2 className="text-[17px] font-extrabold text-brand-primary">{copy.title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-brand-primary opacity-40 hover:opacity-80 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          <label className="block text-[12px] font-semibold uppercase tracking-wide text-brand-primary opacity-70 mb-1.5">
            {copy.pick}
          </label>
          {subject ? (
            <p className="text-[15px] font-semibold text-brand-primary">{subjectLabel ?? subject}</p>
          ) : kind === "area" ? (
            // Chips, not a dropdown: a dropdown panel opens inside this
            // scrolling body and gets clipped by it.
            <div className="flex flex-wrap gap-2">
              {options.map((o) => {
                const on = multi.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setMulti(on ? multi.filter((v) => v !== o.value) : [...multi, o.value])}
                    className={
                      "rounded-pill border px-3 py-1 text-[13px] cursor-pointer transition-colors " +
                      (on
                        ? "bg-brand-secondary-500 border-brand-secondary-500 text-white"
                        : "border-black/15 text-brand-primary hover:border-brand-secondary-500")
                    }
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <Select
              value={single}
              onChange={setSingle}
              options={options}
              placeholder={loadingOptions ? "Loading…" : copy.placeholder}
              className="w-full"
            />
          )}
          <div className="mt-3">
            <Button onClick={generate} disabled={!ready} loading={busy}>
              {busy ? "Writing…" : result ? "Regenerate" : "Generate"}
            </Button>
          </div>
          <p className="text-[11.5px] text-brand-primary opacity-45 mt-2">{copy.source}</p>

          <div className="mt-3">
            <NoKeyBanner />
          </div>

          {busy && (
            <p className="text-[13px] text-brand-primary opacity-60 mt-5">
              {copy.web ? "Reading the hub and searching the web — this can take up to a minute…" : "Reading the hub…"}
            </p>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}

          {result && !busy && (
            <div className="mt-5 rounded-lg border border-[rgba(50,43,95,0.1)] p-5">
              <h3 className="text-[16px] font-extrabold text-brand-primary mb-1">{result.title}</h3>
              <p className="text-[11.5px] text-brand-primary opacity-45 mb-3 flex items-center gap-1.5">
                {result.usedWebSearch && <Globe className="w-3 h-3" />}
                {result.hubEntries} hub {result.hubEntries === 1 ? "entry" : "entries"}
                {result.usedWebSearch ? " + live web search" : ""}
              </p>
              <BriefBody markdown={result.markdown} />
              {result.webSources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[rgba(50,43,95,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary opacity-50 mb-1.5">Web sources</p>
                  <ol className="text-[12px] space-y-1 list-decimal pl-4">
                    {result.webSources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-brand-secondary-600 hover:underline break-all">
                          {s.title ?? s.url}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {result && !busy && (
          <div className="px-6 py-3 border-t border-[rgba(50,43,95,0.08)] flex items-center gap-2">
            <Button variant="ghost" onClick={copyBrief}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            {canSendToSlack && (
              <>
            <Button variant="ghost" onClick={sendToSlack} loading={slack === "sending"} disabled={slack === "sent"}>
              {slack === "sent" ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {slack === "sent" ? "Sent to Slack" : "Send to Slack"}
            </Button>
            {slackError && <span className="text-[12px] text-red-700">{slackError}</span>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
