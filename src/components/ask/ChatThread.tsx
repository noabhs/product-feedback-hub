"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, RotateCcw, SendHorizontal } from "lucide-react";
import { ChatMessage } from "@/components/ask/ChatMessage";
import type { Rating } from "@/components/ask/RateAnswer";
import { AttachButton, FileChips, MAX_FILES, fileProblem } from "@/components/ask/AttachedFiles";
import { NoKeyBanner } from "@/components/ui/NoKeyBanner";
import { QAvatar } from "@/components/home/QAvatar";
import { useApiKey } from "@/hooks/useApiKey";
import { MAX_TURNS, type QSource } from "@/lib/ask-history";
import type { ConversationView } from "@/lib/ask-conversation";

interface LocalTurn {
  /** Stable React key — the AskLog id once there is one. */
  key: string;
  askId: string | null;
  question: string;
  answer: string | null;
  status: "pending" | "done" | "error";
  error?: string;
  standaloneQuestion: string | null;
  rating: Rating;
  ratingNote: string | null;
}

const fromServer = (t: ConversationView["turns"][number]): LocalTurn => ({
  key: t.id,
  askId: t.id,
  question: t.question,
  answer: t.answer,
  status: "done",
  standaloneQuestion: t.standaloneQuestion,
  rating: (t.rating as Rating) ?? null,
  ratingNote: t.ratingNote,
});

/**
 * A chat with Q. The conversation is stored server-side, so this only holds
 * what is in flight: the turns it was given, the one being answered, and the
 * pool of sources that turn's citations point into. A chat started from the
 * home box arrives with its first question pending and sends it on load.
 */
export function ChatThread({
  conversation,
  canSendToSlack,
}: {
  conversation: ConversationView;
  canSendToSlack: boolean;
}) {
  const router = useRouter();
  const { aiHeaders } = useApiKey();
  const [turns, setTurns] = useState<LocalTurn[]>(() => conversation.turns.map(fromServer));
  const [pool, setPool] = useState<QSource[]>(conversation.pool);
  const [draft, setDraft] = useState("");
  const [docs, setDocs] = useState<{ key: string; name: string; busy?: boolean }[]>(() =>
    conversation.documents.map((d) => ({ key: d.id, name: d.name })),
  );
  const [docError, setDocError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startedPending = useRef(false);

  const busy = turns.some((t) => t.status === "pending");
  const answered = turns.filter((t) => t.status === "done").length;
  const full = answered >= MAX_TURNS;
  const canWrite = conversation.canWrite;

  async function attach(files: File[]) {
    setDocError("");
    for (const file of files) {
      if (docs.length >= MAX_FILES) return setDocError(`A chat can hold ${MAX_FILES} documents — remove one first.`);
      const problem = fileProblem(file);
      if (problem) return setDocError(problem);
      const tmp = `up-${Date.now()}-${file.name}`;
      setDocs((d) => [...d, { key: tmp, name: file.name, busy: true }]);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`/api/ask/conversations/${conversation.id}/documents`, { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
        setDocs((d) => d.map((x) => (x.key === tmp ? { key: data.document.id, name: data.document.name } : x)));
      } catch (e) {
        setDocs((d) => d.filter((x) => x.key !== tmp));
        setDocError((e as Error).message);
        return;
      }
    }
  }

  async function detach(key: string) {
    setDocError("");
    const res = await fetch(`/api/ask/conversations/${conversation.id}/documents/${key}`, { method: "DELETE" });
    if (res.ok) setDocs((d) => d.filter((x) => x.key !== key));
    else setDocError("Couldn't remove that document.");
  }

  const send = useCallback(
    async (question: string, retryKey?: string) => {
      const key = retryKey ?? `local-${Date.now()}`;
      setTurns((prev) => [
        ...prev.filter((t) => t.key !== retryKey),
        {
          key,
          askId: null,
          question,
          answer: null,
          status: "pending",
          standaloneQuestion: null,
          rating: null,
          ratingNote: null,
        },
      ]);
      try {
        const res = await fetch(`/api/ask/conversations/${conversation.id}/turns`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...aiHeaders },
          body: JSON.stringify({ question }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
        setPool(data.sources ?? []);
        setTurns((prev) =>
          prev.map((t) =>
            t.key === key
              ? {
                  ...t,
                  key: data.askId ?? key,
                  askId: data.askId ?? null,
                  answer: data.answer ?? "",
                  status: "done",
                  standaloneQuestion: data.standaloneQuestion ?? null,
                }
              : t,
          ),
        );
        // The sidebar's order and counts come from the server.
        router.refresh();
      } catch (e) {
        setTurns((prev) =>
          prev.map((t) => (t.key === key ? { ...t, status: "error", error: (e as Error).message } : t)),
        );
      }
    },
    [conversation.id, aiHeaders, router],
  );

  // Pick up the question the home box left pending. The ref, not state, so a
  // dev-mode double effect can't send it twice.
  useEffect(() => {
    const pending = conversation.pendingQuestion?.trim();
    if (!canWrite || !pending || conversation.turns.length > 0 || startedPending.current) return;
    startedPending.current = true;
    void send(pending);
  }, [canWrite, conversation.pendingQuestion, conversation.turns.length, send]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  function submit() {
    const question = draft.trim();
    if (!question || busy || full) return;
    setDraft("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    void send(question);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <h1 className="truncate text-[15px] font-semibold text-brand-primary" title={conversation.title}>
            {conversation.title}
          </h1>

          {!canWrite && (
            <div className="flex items-center gap-2 rounded-sm border border-[rgba(50,43,95,0.12)] bg-[rgba(50,43,95,0.03)] px-3 py-2 text-[12.5px] text-brand-primary/70">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              Read-only — {conversation.actor ?? "another person"}&apos;s conversation.
            </div>
          )}

          <NoKeyBanner />

          {turns.map((t) =>
            t.status === "done" && t.answer !== null ? (
              <ChatMessage
                key={t.key}
                question={t.question}
                answer={t.answer}
                pool={pool}
                askId={t.askId}
                rating={t.rating}
                ratingNote={t.ratingNote}
                standaloneQuestion={t.standaloneQuestion}
                canSendToSlack={canSendToSlack}
              />
            ) : (
              <div key={t.key} className="flex flex-col gap-3">
                <div className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-lg rounded-br-sm bg-brand-secondary-500 px-3.5 py-2 text-[13.5px] leading-relaxed text-white">
                    {t.question}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <QAvatar size={26} />
                  {t.status === "pending" ? (
                    <p className="rounded-lg rounded-tl-sm border border-[rgba(50,43,95,0.08)] bg-white px-4 py-3 text-[13px] text-brand-primary/55">
                      Checking the hub…
                    </p>
                  ) : (
                    <div className="rounded-lg rounded-tl-sm border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                      <p>{t.error}</p>
                      <button
                        onClick={() => void send(t.question, t.key)}
                        disabled={busy}
                        className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-red-800 underline underline-offset-2 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Try again
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {canWrite && (
        <div className="shrink-0 border-t border-[rgba(50,43,95,0.08)] bg-surface-app px-4 py-3 md:px-8">
          <div className="mx-auto max-w-3xl">
            {full ? (
              <p className="text-[13px] text-brand-primary/70">
                This chat has reached {MAX_TURNS} questions.{" "}
                <Link href="/ask" className="font-medium text-brand-secondary-600 hover:underline">
                  Start a new one
                </Link>{" "}
                to keep going.
              </p>
            ) : (
              <>
                {docs.length > 0 && (
                  <div className="mb-2">
                    <FileChips files={docs} onRemove={detach} />
                  </div>
                )}
                {docError && <p className="mb-2 text-[12px] text-red-700">{docError}</p>}
                <div className="flex items-end gap-2">
                  <AttachButton onPick={attach} disabled={busy || docs.length >= MAX_FILES} className="h-10 w-10" />
                  <textarea
                    ref={inputRef}
                    value={draft}
                    rows={1}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                      }
                    }}
                    placeholder={busy ? "Waiting for an answer…" : "Ask a follow-up…"}
                    disabled={busy}
                    className="min-h-10 flex-1 resize-none rounded-md border border-[rgba(50,43,95,0.12)] bg-white px-4 py-2.5 text-[13px] leading-snug text-brand-primary placeholder:text-brand-primary/40 transition-colors focus:border-brand-secondary-500 focus:outline-none disabled:opacity-60"
                  />
                  <button
                    onClick={submit}
                    disabled={busy || !draft.trim()}
                    aria-label="Send"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-secondary-500 text-white transition-colors hover:bg-brand-secondary-600 disabled:opacity-40"
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-brand-primary/40">
                  Add <span className="font-medium">&quot;search web&quot;</span> to a question to also search the web.
                  Attached documents are read with every question in this chat.
                  Chats are private to you and the hub owner; the first question of each is kept on the{" "}
                  <Link href="/analytics?tab=asks" className="underline underline-offset-2 hover:text-brand-secondary-600">
                    Asks log
                  </Link>
                  .
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
