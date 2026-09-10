"use client";
import { useEffect, useState } from "react";
import { MessageSquare, Building2, Lightbulb, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useApiKey } from "@/hooks/useApiKey";
import { NoKeyBanner } from "@/components/ui/NoKeyBanner";
import { RateAnswer } from "@/components/ask/RateAnswer";
import { AnswerBody } from "@/components/ask/AnswerBody";
import { plainAnswer } from "@/lib/answer-format";
import { QAvatar } from "@/components/home/QAvatar";

type SourceKind = "insight" | "competitor" | "feature-request";

interface Source {
  id: string;
  kind: SourceKind;
  label: string;
  client: string | null;
}

/** Where a citation chip and the source list send someone for each kind. */
function hrefFor(source: Source): string {
  if (source.kind === "competitor") return `/competitors?open=${source.id}`;
  if (source.kind === "feature-request") return "/feature-requests";
  return `/insights/${source.id}`;
}

const KIND_ICON: Record<SourceKind, typeof MessageSquare> = {
  insight: MessageSquare,
  competitor: Building2,
  "feature-request": Lightbulb,
};

const KIND_LABEL: Record<SourceKind, string> = {
  insight: "Feedback",
  competitor: "Competitor",
  "feature-request": "Feature request",
};

/** Past this many, the rest collapse behind "Show more" — a long tail of
 *  matched feedback shouldn't push the sources list taller than the answer. */
const VISIBLE_SOURCES = 5;

/**
 * The home page's ask box — "Q" over the whole hub (feedback, competitors,
 * feature requests, the client table), not just feedback. Structurally the
 * same flow as AIQABar on /insights: ask, show the answer, let it be rated
 * and copied. Kept separate because the sources here span three kinds, each
 * linking somewhere different, where AIQABar only ever links to /insights.
 */
export function QAsk() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asked, setAsked] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [askId, setAskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [showAllSources, setShowAllSources] = useState(false);
  const { aiHeaders } = useApiKey();

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function ask() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer("");
    setSources([]);
    setAskId(null);
    setCopied(false);
    setCopyError("");
    setShowAllSources(false);
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...aiHeaders },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? "");
      setAsked(question.trim());
      setSources(data.sources ?? []);
      setAskId(data.askId ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function copyAnswer() {
    const lines = [asked, "", plainAnswer(answer)];
    if (sources.length > 0) {
      lines.push("", "Sources:");
      sources.forEach((s, i) =>
        lines.push(`[${i + 1}] ${KIND_LABEL[s.kind]} — ${s.client ? `${s.client} — ` : ""}${s.label}`),
      );
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setCopyError("");
    } catch {
      setCopyError("Couldn't copy — select the text and press Cmd+C.");
    }
  }

  const answerSources = sources.map((s) => ({ id: s.id, href: hrefFor(s) }));

  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <QAvatar />
        <div>
          <h2 className="text-[14px] font-semibold text-brand-primary leading-tight">Ask Q</h2>
          <p className="text-[11.5px] text-brand-primary/50 leading-tight">
            Feedback, clients, competitors and feature requests — one answer.
          </p>
        </div>
      </div>

      <NoKeyBanner />

      <div className="flex gap-2 mt-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Ask anything about client feedback, competitors, or the roadmap…"
          className="flex-1 h-10 rounded-md border border-[rgba(50,43,95,0.12)] bg-[rgba(50,43,95,0.02)] px-4 text-[13px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500 transition-colors"
        />
        <Button size="sm" onClick={ask} loading={loading}>
          Ask
        </Button>
      </div>

      {answer && (
        <div className="mt-4">
          <div className="flex justify-end mb-2">
            <button
              onClick={copyAnswer}
              title="Copy the answer and its sources"
              className="shrink-0 flex items-center gap-1.5 rounded-sm border border-[rgba(50,43,95,0.12)] bg-[rgba(50,43,95,0.02)] px-2.5 py-1.5 text-[12px] font-medium text-brand-primary/70 hover:bg-[rgba(50,43,95,0.06)] hover:text-brand-primary transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          <AnswerBody answer={answer} sources={answerSources} tone="light" />
          {copyError && <p className="text-[12px] text-red-700 mt-3">{copyError}</p>}

          {askId && (
            <div className="flex items-start gap-3 mt-4 mb-3">
              <RateAnswer key={askId} askId={askId} rating={null} note={null} tone="light" />
              <p className="text-[11.5px] text-brand-primary/40 leading-relaxed pt-1.5">
                Rate it — questions and answers are kept on{" "}
                <Link href="/feedback-insights" className="text-brand-secondary-600 hover:text-brand-secondary-500 underline underline-offset-2">
                  Feedback insights log
                </Link>
                .
              </p>
            </div>
          )}

          {sources.length > 0 && (
            <div className="border-t border-[rgba(50,43,95,0.08)] pt-3">
              <p className="text-[11px] text-brand-primary/40 uppercase tracking-wide mb-2">Sources</p>
              <div className="flex flex-col gap-1">
                {(showAllSources ? sources : sources.slice(0, VISIBLE_SOURCES)).map((s, i) => {
                  const Icon = KIND_ICON[s.kind];
                  return (
                    <Link
                      key={`${s.kind}-${s.id}`}
                      href={hrefFor(s)}
                      className="flex items-center gap-1.5 text-[12px] text-brand-primary/70 hover:text-brand-secondary-500 transition-colors"
                    >
                      <span className="shrink-0 w-5 text-right text-brand-primary/35 tabular-nums">{i + 1}</span>
                      <Icon className="w-3.5 h-3.5 shrink-0 text-brand-primary/35" />
                      <span className="truncate">
                        {s.client ? `${s.client} — ` : ""}
                        {s.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
              {sources.length > VISIBLE_SOURCES && (
                <button
                  onClick={() => setShowAllSources((v) => !v)}
                  className="flex items-center gap-1 mt-2 text-[12px] font-medium text-brand-secondary-600 hover:text-brand-secondary-500 transition-colors"
                >
                  {showAllSources ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Show fewer
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Show {sources.length - VISIBLE_SOURCES} more {sources.length - VISIBLE_SOURCES === 1 ? "source" : "sources"}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
