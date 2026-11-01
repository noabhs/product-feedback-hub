"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { NoKeyBanner } from "@/components/ui/NoKeyBanner";
import { EXAMPLES } from "@/components/ask/source-ui";

/**
 * The box that starts a chat — on the home page and on /ask. It creates the
 * conversation and goes to it; the chat page sends the question. Answering here
 * and then navigating would mean a refresh, or a slow connection, either asks it
 * twice or loses it.
 */
export function StartChatBox({
  autoFocus = false,
  stagger = false,
}: {
  /** Deals the example chips in one after another. Only the /ask empty state
   *  asks for this — on the home page the box is one card among many. */
  stagger?: boolean;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function start(preset?: string) {
    const asking = (preset ?? question).trim();
    if (!asking || starting) return;
    if (preset) setQuestion(preset);
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/ask/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: asking }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      // Left in the "starting" state on success: the page is about to change.
      router.push(`/ask/${data.id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setStarting(false);
    }
  }

  return (
    <div>
      <NoKeyBanner />
      <div className="mt-3 flex gap-2">
        <input
          value={question}
          autoFocus={autoFocus}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && start()}
          placeholder="Ask anything about client feedback, competitors, or the roadmap…"
          className="h-10 flex-1 rounded-md border border-[rgba(50,43,95,0.12)] bg-[rgba(50,43,95,0.02)] px-4 text-[13px] text-brand-primary transition-all placeholder:text-brand-primary/40 focus:border-brand-secondary-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(93,7,226,0.08)] focus:outline-none"
        />
        <Button size="sm" onClick={() => start()} loading={starting}>
          Ask
        </Button>
      </div>
      <p className="mt-1.5 text-[11px] text-brand-primary/40">
        Add <span className="font-medium">&quot;search web&quot;</span> anywhere in your question to also search the web, not just the hub.
      </p>
      {error && <p className="mt-2 text-[12px] text-red-700">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-brand-primary/40">Try</span>
        {EXAMPLES.map((q, i) => (
          <button
            key={q}
            type="button"
            onClick={() => start(q)}
            disabled={starting}
            style={stagger ? { animationDelay: `${260 + i * 80}ms` } : undefined}
            className={`cursor-pointer rounded-pill border border-[rgba(50,43,95,0.12)] px-2.5 py-1 text-[12px] text-brand-primary/70 transition-all hover:-translate-y-0.5 hover:border-brand-secondary-500 hover:text-brand-secondary-600 disabled:opacity-50${
              stagger ? " animate-rise" : ""
            }`}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
