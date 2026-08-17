"use client";
import { useState } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
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
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const { aiHeaders } = useApiKey();

  async function ask() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer("");
    setSources([]);
    try {
      const res = await fetch("/api/ai/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...aiHeaders },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer);
      setSources(data.sources ?? []);
    } finally {
      setLoading(false);
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
          <p className="text-[14px] text-white/90 leading-relaxed mb-3">{answer}</p>
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
