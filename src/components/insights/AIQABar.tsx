"use client";
import { useEffect, useState } from "react";
import { Sparkles, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useApiKey } from "@/hooks/useApiKey";
import { NoKeyBanner } from "@/components/ui/NoKeyBanner";

interface Source {
  id: string;
  oneLiner: string;
  client: string | null;
}

export function AIQABar() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  // The question as asked. The input stays editable after an answer lands, so
  // reading `question` at copy time could caption the answer with a later one.
  const [asked, setAsked] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const { aiHeaders } = useApiKey();

  // Reset the confirmation, cancelling cleanly if the answer changes first.
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
    setCopied(false);
    setCopyError("");
    try {
      const res = await fetch("/api/ai/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...aiHeaders },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer);
      setAsked(question.trim());
      setSources(data.sources ?? []);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Plain text for pasting into Slack or a doc. The answer cites its sources as
   * [1], [2] — in the order the API returned them — so the list is numbered to
   * match and includes every source, not just the five shown here.
   */
  async function copyAnswer() {
    const lines = [asked, "", answer];
    if (sources.length > 0) {
      lines.push("", "Sources:");
      sources.forEach((s, i) =>
        lines.push(`[${i + 1}] ${s.client ? `${s.client} — ` : ""}${s.oneLiner}`),
      );
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setCopyError("");
    } catch {
      // Clipboard access can be blocked (older browser, insecure context).
      setCopyError("Couldn't copy — select the text and press Cmd+C.");
    }
  }

  return (
    <div className="bg-[#250359] rounded-lg p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-teal" />
        <span className="text-[13px] font-semibold text-teal uppercase tracking-wide">Ask the feedback</span>
      </div>

      <NoKeyBanner />
      <div className="flex gap-2 mt-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="What are the main pain points around quality gap closure?"
          className="flex-1 h-10 rounded-sm bg-white/10 border border-white/20 px-3 text-[14px] text-white placeholder:text-white/40 focus:outline-none focus:border-teal transition-all"
        />
        <Button size="sm" onClick={ask} loading={loading} className="bg-teal text-[#250359] hover:bg-mint-400 font-semibold">
          Ask
        </Button>
      </div>

      {answer && (
        <div className="mt-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <p className="text-[14px] text-white/90 leading-relaxed">{answer}</p>
            <button
              onClick={copyAnswer}
              title="Copy the answer and its sources"
              className="shrink-0 flex items-center gap-1.5 rounded-sm border border-white/20 bg-white/10 px-2.5 py-1.5 text-[12px] font-medium text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal" />
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
          {copyError && <p className="text-[12px] text-amber-200 mb-3">{copyError}</p>}
          {sources.length > 0 && (
            <div className="border-t border-white/10 pt-3">
              <p className="text-[11px] text-white/40 uppercase tracking-wide mb-2">Sources</p>
              <div className="flex flex-col gap-1">
                {sources.slice(0, 5).map((s) => (
                  <Link key={s.id} href={`/insights/${s.id}`} className="flex items-center gap-1.5 text-[12px] text-teal hover:text-mint-200 transition-colors">
                    <ChevronRight className="w-3 h-3 shrink-0" />
                    <span className="truncate">{s.client ? `${s.client} — ` : ""}{s.oneLiner}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
