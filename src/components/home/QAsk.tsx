"use client";
import { useEffect, useState } from "react";
import { MessageSquare, Building2, Lightbulb, Copy, Check, ChevronDown, ChevronUp, Globe, GraduationCap, FileText, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useApiKey } from "@/hooks/useApiKey";
import { NoKeyBanner } from "@/components/ui/NoKeyBanner";
import { RateAnswer } from "@/components/ask/RateAnswer";
import { AnswerBody } from "@/components/ask/AnswerBody";
import { plainAnswer, citedSourceNumbers } from "@/lib/answer-format";
import { QAvatar } from "@/components/home/QAvatar";

type SourceKind = "insight" | "competitor" | "feature-request" | "domain" | "web";

interface Source {
  id: string;
  kind: SourceKind;
  label: string;
  client: string | null;
  /** Only "web" sources carry this — the live page the search actually found. */
  url?: string;
  /** Only "domain" sources carry this — the path to the term or topic in the hub. */
  href?: string;
}

/** Where a citation chip and the source list send someone for each kind. */
function hrefFor(source: Source): string {
  if (source.kind === "web") return source.url ?? "#";
  if (source.kind === "competitor") return `/competitors?open=${source.id}`;
  if (source.kind === "feature-request") return "/feature-requests";
  if (source.kind === "domain") return source.href ?? "/know-your-domain";
  return `/insights/${source.id}`;
}

const KIND_ICON: Record<SourceKind, typeof MessageSquare> = {
  insight: MessageSquare,
  competitor: Building2,
  "feature-request": Lightbulb,
  domain: GraduationCap,
  web: Globe,
};

const KIND_LABEL: Record<SourceKind, string> = {
  insight: "Feedback",
  competitor: "Competitor",
  "feature-request": "Feature request",
  domain: "Know your domain",
  web: "Web",
};

/**
 * Three questions worth asking, for the blank box. They are the kind Q is
 * actually good at — a pattern across clients rather than a lookup — and
 * clicking one asks it, so the first use costs nothing to think up.
 */
const EXAMPLES = [
  "What are clients saying about coding workflows?",
  "Which themes came up across more than one client?",
  "Where do we lose to competitors on risk adjustment?",
];

/** Past this many, the rest collapse behind "Show more" — a long tail of
 *  matched feedback shouldn't push the sources list taller than the answer. */
const VISIBLE_SOURCES = 5;

/** The three answer actions are one control repeated, so they share a class. */
const BTN =
  "shrink-0 flex items-center gap-1.5 rounded-sm border border-[rgba(50,43,95,0.12)] bg-[rgba(50,43,95,0.02)] px-2.5 py-1.5 text-[12px] font-medium text-brand-primary/70 hover:bg-[rgba(50,43,95,0.06)] hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-default";

/**
 * The home page's ask box — "Q" over the whole hub (feedback, competitors,
 * feature requests, the client table), not just feedback. Structurally the
 * same flow as AIQABar on /insights: ask, show the answer, let it be rated
 * and copied. Kept separate because the sources here span three kinds, each
 * linking somewhere different, where AIQABar only ever links to /insights.
 */
export function QAsk({ canSendToSlack = false }: { canSendToSlack?: boolean }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asked, setAsked] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [askId, setAskId] = useState<string | null>(null);
  const [usedWebSearch, setUsedWebSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [showAllSources, setShowAllSources] = useState(false);
  const [doc, setDoc] = useState<
    { state: "idle" } | { state: "creating" } | { state: "created"; url: string } | { state: "reconnect" } | { state: "error"; message: string }
  >({ state: "idle" });
  const [slack, setSlack] = useState<"idle" | "sending" | "sent">("idle");
  const [slackError, setSlackError] = useState("");
  const { aiHeaders } = useApiKey();

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function ask(preset?: string) {
    const asking = (preset ?? question).trim();
    if (!asking || loading) return;
    if (preset) setQuestion(preset);
    setLoading(true);
    setAnswer("");
    setSources([]);
    setAskId(null);
    setUsedWebSearch(false);
    setCopied(false);
    setCopyError("");
    setShowAllSources(false);
    setDoc({ state: "idle" });
    setSlack("idle");
    setSlackError("");
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...aiHeaders },
        body: JSON.stringify({ question: asking }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? "");
      setAsked(asking);
      setSources(data.sources ?? []);
      setAskId(data.askId ?? null);
      setUsedWebSearch(!!data.usedWebSearch);
    } finally {
      setLoading(false);
    }
  }

  // Retrieval can hand the model 50+ matches for a broad question, and most
  // of them never make it into the answer — listing all of them below reads
  // as noise. [n]'s position in `sources` is the citation number itself (a
  // trimmed array would renumber everything after the first cut), so this
  // keeps the full array for that lookup and only filters what gets shown.
  const cited = citedSourceNumbers(answer);
  const visibleSources = sources
    .map((s, i) => ({ source: s, number: i + 1 }))
    .filter(({ number }) => cited.has(number));

  /** The answer and its sources as text. Shared by copy, doc and Slack, so
   *  the three can't drift into saying different things. */
  function answerText(withQuestion: boolean): string {
    const lines = withQuestion ? [asked, ""] : [];
    lines.push(plainAnswer(answer));
    if (visibleSources.length > 0) {
      lines.push("", "Sources:");
      visibleSources.forEach(({ source: s, number }) =>
        lines.push(`[${number}] ${KIND_LABEL[s.kind]} — ${s.client ? `${s.client} — ` : ""}${s.label}`),
      );
    }
    return lines.join("\n");
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(answerText(true));
      setCopied(true);
      setCopyError("");
    } catch {
      setCopyError("Couldn't copy — select the text and press Cmd+C.");
    }
  }

  async function createDoc() {
    // Once made, the button reopens that doc rather than making a duplicate.
    if (doc.state === "created") {
      window.open(doc.url, "_blank", "noreferrer");
      return;
    }
    if (!answer || doc.state === "creating") return;
    setDoc({ state: "creating" });
    try {
      const res = await fetch("/api/briefs/doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: asked, markdown: answerText(false) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.reconnect) {
        setDoc({ state: "reconnect" });
        return;
      }
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setDoc({ state: "created", url: data.url });
      window.open(data.url, "_blank", "noreferrer");
    } catch (e) {
      setDoc({ state: "error", message: (e as Error).message });
    }
  }

  async function sendToSlack() {
    if (!answer || slack !== "idle") return;
    setSlack("sending");
    setSlackError("");
    try {
      const res = await fetch("/api/briefs/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: asked, markdown: answerText(false) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setSlack("sent");
    } catch (e) {
      setSlack("idle");
      setSlackError((e as Error).message);
    }
  }

  const answerSources = sources.map((s) => ({ id: s.id, href: hrefFor(s) }));

  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <QAvatar />
        <h2 className="text-[14px] font-semibold text-brand-primary leading-tight">Ask Q</h2>
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
        <Button size="sm" onClick={() => ask()} loading={loading}>
          Ask
        </Button>
      </div>
      <p className="text-[11px] text-brand-primary/40 mt-1.5">
        Add <span className="font-medium">&quot;search web&quot;</span> anywhere in your question to also search the web, not just the hub.
      </p>

      {!answer && !loading && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="text-[11px] text-brand-primary/40">Try</span>
          {EXAMPLES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="rounded-pill border border-[rgba(50,43,95,0.12)] px-2.5 py-1 text-[12px] text-brand-primary/70 hover:border-brand-secondary-500 hover:text-brand-secondary-600 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {answer && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            {usedWebSearch ? (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-brand-secondary-600">
                <Globe className="w-3.5 h-3.5" />
                Also searched the web
              </span>
            ) : (
              <span />
            )}
            {/* Three ways out of an answer, same text in each: the clipboard,
                a Google Doc in your own Drive, and the team's Slack channel.
                Slack is owner-only, and the endpoint checks that too. */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={copyAnswer} title="Copy the answer and its sources" className={BTN}>
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

              <button
                onClick={createDoc}
                disabled={doc.state === "creating"}
                title="Put this answer in a Google Doc in your Drive"
                className={BTN}
              >
                {doc.state === "created" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Open doc
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    {doc.state === "creating" ? "Generating…" : "Generate doc"}
                  </>
                )}
              </button>

              {canSendToSlack && (
                <button
                  onClick={sendToSlack}
                  disabled={slack !== "idle"}
                  title="Post this answer to the team's Slack channel"
                  className={BTN}
                >
                  {slack === "sent" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Sent
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      {slack === "sending" ? "Sending…" : "Send to Slack"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <AnswerBody answer={answer} sources={answerSources} tone="light" />
          {copyError && <p className="text-[12px] text-red-700 mt-3">{copyError}</p>}
          {doc.state === "reconnect" && (
            <a
              href={`/api/docs/connect?to=${encodeURIComponent("/home")}`}
              className="block text-[12px] text-brand-secondary-600 hover:underline mt-3"
            >
              Allow Google Docs access (one-time), then try again
            </a>
          )}
          {doc.state === "error" && <p className="text-[12px] text-red-700 mt-3">{doc.message}</p>}
          {slackError && <p className="text-[12px] text-red-700 mt-3">{slackError}</p>}

          {askId && (
            <div className="flex items-start gap-3 mt-4 mb-3">
              <RateAnswer key={askId} askId={askId} rating={null} note={null} tone="light" />
              <p className="text-[11.5px] text-brand-primary/40 leading-relaxed pt-1.5">
                Rate it — questions and answers are kept on{" "}
                <Link href="/feedback-insights" className="text-brand-secondary-600 hover:text-brand-secondary-500 underline underline-offset-2">
                  Asks log
                </Link>
                .
              </p>
            </div>
          )}

          {visibleSources.length > 0 && (
            <div className="border-t border-[rgba(50,43,95,0.08)] pt-3">
              <p className="text-[11px] text-brand-primary/40 uppercase tracking-wide mb-2">Sources</p>
              <div className="flex flex-col gap-1">
                {(showAllSources ? visibleSources : visibleSources.slice(0, VISIBLE_SOURCES)).map(({ source: s, number }) => {
                  const Icon = KIND_ICON[s.kind];
                  return (
                    <Link
                      key={`${s.kind}-${s.id}`}
                      href={hrefFor(s)}
                      target={s.kind === "web" ? "_blank" : undefined}
                      rel={s.kind === "web" ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-1.5 text-[12px] text-brand-primary/70 hover:text-brand-secondary-500 transition-colors"
                    >
                      <span className="shrink-0 w-5 text-right text-brand-primary/35 tabular-nums">{number}</span>
                      <Icon className="w-3.5 h-3.5 shrink-0 text-brand-primary/35" />
                      <span className="truncate">
                        {s.client ? `${s.client} — ` : ""}
                        {s.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
              {visibleSources.length > VISIBLE_SOURCES && (
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
                      Show {visibleSources.length - VISIBLE_SOURCES} more{" "}
                      {visibleSources.length - VISIBLE_SOURCES === 1 ? "source" : "sources"}
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
