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
  examples = true,
  compact = false,
}: {
  /** Deals the example chips in one after another. Only the /ask empty state
   *  asks for this — on the home page the box is one card among many. */
  stagger?: boolean;
  /** The "Try …" chips. Off on the home page, which has its own quick actions
   *  below the box and doesn't need a second row of suggestions. */
  examples?: boolean;
  autoFocus?: boolean;
  /** One roomy input with the button inside it, and the "search web" tip only
   *  while it has focus. For the home page, where less around the box is better. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

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

  if (compact) {
    return (
      <div>
        <NoKeyBanner />
        <div className="relative">
          <input
            value={question}
            autoFocus={autoFocus}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask Q anything about feedback, competitors or the roadmap…"
            className="h-14 w-full rounded-pill border border-[rgba(50,43,95,0.12)] bg-white pl-6 pr-28 text-[15px] text-brand-primary shadow-sm transition-all placeholder:text-brand-primary/40 focus:border-brand-secondary-500 focus:shadow-[0_0_0_4px_rgba(93,7,226,0.08)] focus:outline-none"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button size="sm" onClick={() => start()} loading={starting}>
              Ask
            </Button>
          </div>
        </div>
        {(focused || question) && (
          <p className="mt-2 px-6 text-[11.5px] text-brand-primary/45">
            Add <span className="font-medium">&quot;search web&quot;</span> to also search the web.
          </p>
        )}
        {error && <p className="mt-2 px-6 text-[12px] text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <NoKeyBanner />
      {/* The button sits inside the field rather than beside it, so the pair
          reads as one control — and the hint and the chips below can all start
          from the same left edge. */}
      <div className="relative mt-3">
        <input
          value={question}
          autoFocus={autoFocus}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && start()}
          placeholder="Ask anything about client feedback, competitors, or the roadmap…"
          className="h-12 w-full rounded-pill border border-[rgba(50,43,95,0.12)] bg-white pl-5 pr-24 text-[14px] text-brand-primary transition-all placeholder:text-brand-primary/40 focus:border-brand-secondary-500 focus:shadow-[0_0_0_3px_rgba(93,7,226,0.07)] focus:outline-none"
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
          <Button size="sm" onClick={() => start()} loading={starting}>
            Ask
          </Button>
        </div>
      </div>
      <p className="mt-2 pl-5 text-[11.5px] text-brand-primary/40">
        Add <span className="font-medium">&quot;search web&quot;</span> anywhere in your question to also search the web, not just the hub.
      </p>
      {error && <p className="mt-2 pl-5 text-[12px] text-red-700">{error}</p>}

      {examples && (
        <div className="mt-5 border-t border-[rgba(50,43,95,0.07)] pt-4">
          {/* A label above the chips, not inline with the first one: inline, it
              indented row one and left the stack looking ragged. */}
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-brand-primary/35">
            Try one of these
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((q, i) => (
              <button
                key={q}
                type="button"
                onClick={() => start(q)}
                disabled={starting}
                style={stagger ? { animationDelay: `${260 + i * 80}ms` } : undefined}
                className={`max-w-full cursor-pointer rounded-pill border border-[rgba(50,43,95,0.12)] px-3 py-1.5 text-left text-[12.5px] text-brand-primary/70 transition-all hover:-translate-y-0.5 hover:border-brand-secondary-500 hover:text-brand-secondary-600 disabled:opacity-50${
                  stagger ? " animate-rise" : ""
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
