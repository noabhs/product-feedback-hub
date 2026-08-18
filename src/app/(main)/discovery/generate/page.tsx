"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useApiKey } from "@/hooks/useApiKey";
import { NoKeyBanner } from "@/components/ui/NoKeyBanner";
import { AREA_OPTIONS as AREAS } from "@/lib/labels";

export default function GenerateDocPage() {
  const { aiHeaders } = useApiKey();
  const [topic, setTopic] = useState("");
  const [productAreas, setProductAreas] = useState<string[]>([]);
  const [persona, setPersona] = useState("");
  const [clientContext, setClientContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; sections: { title: string; questions: string[] }[]; sessionContext: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function toggleArea(val: string) {
    setProductAreas((prev) => prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]);
  }

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/generate-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...aiHeaders },
        body: JSON.stringify({ topic, productAreas, persona: persona || null, clientContext: clientContext || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/discovery" className="inline-flex items-center gap-1.5 text-[13px] text-brand-primary opacity-50 hover:opacity-100 mb-6 transition-opacity">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to questions
      </Link>

      <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Generate discovery doc</h1>
      <p className="text-[14px] text-brand-primary opacity-50 mb-8">
        AI selects and organizes relevant questions, enriches them with client feedback, and formats a ready-to-use doc.
      </p>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
        <div>
          <label className="block text-[13px] font-semibold text-brand-primary mb-1.5">
            Topic / session focus <span className="text-negative-strong">*</span>
          </label>
          <Input placeholder="e.g. TCM & chart prep for ACO clients" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full" />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-brand-primary mb-2">Product areas</label>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <button key={a.value} onClick={() => toggleArea(a.value)}
                className={`px-3 py-1.5 rounded-pill text-[13px] font-medium border transition-all duration-150 ${productAreas.includes(a.value) ? "bg-brand-secondary-500 text-white border-brand-secondary-500" : "bg-white text-brand-primary border-[rgba(50,43,95,0.2)] hover:border-brand-secondary-500"}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-brand-primary mb-1.5">Persona focus (optional)</label>
          <Input placeholder="e.g. VBC Leader, Care Coordinator" value={persona} onChange={(e) => setPersona(e.target.value)} className="w-full" />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-brand-primary mb-1.5">Client context (optional)</label>
          <Input placeholder="e.g. ACO with downside risk, ~100K members" value={clientContext} onChange={(e) => setClientContext(e.target.value)} className="w-full" />
        </div>

        <NoKeyBanner />

        {error && <p className="text-[13px] text-negative-strong">{error}</p>}

        <Button size="lg" onClick={generate} loading={loading} disabled={!topic.trim()} className="w-full">
          <Sparkles className="w-4 h-4" />
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>

      {result && (
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(50,43,95,0.08)]">
            <p className="text-[14px] font-semibold text-brand-primary">Discovery questions — {topic}</p>
            <Button variant="ghost" size="sm" onClick={copy}>
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy all</>}
            </Button>
          </div>

          <div className="p-5 space-y-5">
            <div className="bg-[#f6f6fa] rounded-sm p-3">
              <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1">Session context</p>
              <p className="text-[13px] text-brand-primary">{result.sessionContext}</p>
            </div>

            {result.sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[14px] font-semibold text-brand-primary mb-2">{section.title}</h3>
                <div className="space-y-2">
                  {section.questions.map((q, i) => (
                    <p key={i} className="text-[13px] text-brand-primary/80 pl-3 border-l-2 border-brand-secondary-500/20">{q}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
