"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Copy, FileText, Send } from "lucide-react";
import { AnswerBody } from "@/components/ask/AnswerBody";
import { RateAnswer, type Rating } from "@/components/ask/RateAnswer";
import { KIND_ICON, KIND_LABEL, hrefFor } from "@/components/ask/source-ui";
import { QAvatar } from "@/components/home/QAvatar";
import { citedSourceNumbers, plainAnswer } from "@/lib/answer-format";
import type { QSource } from "@/lib/ask-history";

/** Past this many, the rest collapse behind "Show more" — a long tail of
 *  matched feedback shouldn't push the sources list taller than the answer. */
const VISIBLE_SOURCES = 5;

/** The answer actions are one control repeated, so they share a class. */
const BTN =
  "shrink-0 flex items-center gap-1.5 rounded-sm border border-[rgba(50,43,95,0.12)] bg-[rgba(50,43,95,0.02)] px-2.5 py-1.5 text-[12px] font-medium text-brand-primary/70 hover:bg-[rgba(50,43,95,0.06)] hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-default";

type DocState =
  | { state: "idle" }
  | { state: "creating" }
  | { state: "created"; url: string }
  | { state: "reconnect" }
  | { state: "error"; message: string };

interface ChatMessageProps {
  question: string;
  answer: string;
  /** The conversation's whole pool: [n] in `answer` is pool[n - 1]. */
  pool: QSource[];
  askId: string | null;
  rating: Rating;
  ratingNote: string | null;
  /** What retrieval ran on, when it differs from what was typed (follow-ups only). */
  standaloneQuestion: string | null;
  canSendToSlack: boolean;
}

/**
 * One question and its answer in a chat. The answer actions that used to sit on
 * the home page's single answer — copy, Google Doc, Slack, rating, sources —
 * live here, once per answer, so every turn can be taken out of the chat.
 */
export function ChatMessage({
  question,
  answer,
  pool,
  askId,
  rating,
  ratingNote,
  standaloneQuestion,
  canSendToSlack,
}: ChatMessageProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [showAllSources, setShowAllSources] = useState(false);
  const [doc, setDoc] = useState<DocState>({ state: "idle" });
  const [slack, setSlack] = useState<"idle" | "sending" | "sent">("idle");
  const [slackError, setSlackError] = useState("");

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  // [n]'s position in the pool is the citation number itself, so the pool is
  // never trimmed — only what gets listed is filtered to what was cited.
  const cited = citedSourceNumbers(answer);
  const visibleSources = pool.map((source, i) => ({ source, number: i + 1 })).filter(({ number }) => cited.has(number));
  const answerSources = pool.map((s) => ({ id: s.id, href: hrefFor(s) }));

  /** The answer and its sources as text. Shared by copy, doc and Slack, so
   *  the three can't drift into saying different things. */
  function answerText(withQuestion: boolean): string {
    const lines = withQuestion ? [question, ""] : [];
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
    if (doc.state === "creating") return;
    setDoc({ state: "creating" });
    try {
      const res = await fetch("/api/briefs/doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: question, markdown: answerText(false) }),
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
    if (slack !== "idle") return;
    setSlack("sending");
    setSlackError("");
    try {
      const res = await fetch("/api/briefs/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: question, markdown: answerText(false) }),
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
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-lg rounded-br-sm bg-brand-secondary-500 px-3.5 py-2 text-[13.5px] leading-relaxed text-white">
          {question}
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <QAvatar size={26} />
        <div className="min-w-0 flex-1 rounded-lg rounded-tl-sm border border-[rgba(50,43,95,0.08)] bg-white px-4 py-3">
          {standaloneQuestion && standaloneQuestion.trim() !== question.trim() && (
            <p className="mb-2 text-[11.5px] leading-snug text-brand-primary/45">
              Searched for: <span className="italic">{standaloneQuestion}</span>
            </p>
          )}

          <AnswerBody answer={answer} sources={answerSources} tone="light" />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={copyAnswer} title="Copy the answer and its sources" className={BTN}>
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
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
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Open doc
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
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
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Sent
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    {slack === "sending" ? "Sending…" : "Send to Slack"}
                  </>
                )}
              </button>
            )}
          </div>
          {copyError && <p className="mt-2 text-[12px] text-red-700">{copyError}</p>}
          {doc.state === "reconnect" && (
            <a
              href={`/api/docs/connect?to=${encodeURIComponent(pathname)}`}
              className="mt-2 block text-[12px] text-brand-secondary-600 hover:underline"
            >
              Allow Google Docs access (one-time), then try again
            </a>
          )}
          {doc.state === "error" && <p className="mt-2 text-[12px] text-red-700">{doc.message}</p>}
          {slackError && <p className="mt-2 text-[12px] text-red-700">{slackError}</p>}

          {askId && (
            <div className="mt-3">
              <RateAnswer key={askId} askId={askId} rating={rating} note={ratingNote} tone="light" />
            </div>
          )}

          {visibleSources.length > 0 && (
            <div className="mt-3 border-t border-[rgba(50,43,95,0.08)] pt-3">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-brand-primary/40">Sources</p>
              <div className="flex flex-col gap-1">
                {(showAllSources ? visibleSources : visibleSources.slice(0, VISIBLE_SOURCES)).map(
                  ({ source: s, number }) => {
                    const Icon = KIND_ICON[s.kind];
                    return (
                      <Link
                        key={`${s.kind}-${s.id}`}
                        href={hrefFor(s)}
                        target={s.kind === "web" ? "_blank" : undefined}
                        rel={s.kind === "web" ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-1.5 text-[12px] text-brand-primary/70 transition-colors hover:text-brand-secondary-500"
                      >
                        <span className="w-5 shrink-0 text-right tabular-nums text-brand-primary/35">{number}</span>
                        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-primary/35" />
                        <span className="truncate">
                          {s.client ? `${s.client} — ` : ""}
                          {s.label}
                        </span>
                      </Link>
                    );
                  },
                )}
              </div>
              {visibleSources.length > VISIBLE_SOURCES && (
                <button
                  onClick={() => setShowAllSources((v) => !v)}
                  className="mt-2 flex items-center gap-1 text-[12px] font-medium text-brand-secondary-600 transition-colors hover:text-brand-secondary-500"
                >
                  {showAllSources ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      Show fewer
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      Show {visibleSources.length - VISIBLE_SOURCES} more{" "}
                      {visibleSources.length - VISIBLE_SOURCES === 1 ? "source" : "sources"}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
