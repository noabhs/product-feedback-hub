"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, FileQuestion } from "lucide-react";
import { ExtractInsights } from "@/components/extract/ExtractInsights";
import { ExtractQuestions } from "@/components/extract/ExtractQuestions";

type Mode = "feedback" | "questions";

const MODES: { value: Mode; label: string; hint: string; Icon: React.FC<{ className?: string }> }[] = [
  {
    value: "feedback",
    label: "Feedback",
    hint: "Pull client insights out of notes, threads, or a doc",
    Icon: MessageSquare,
  },
  {
    value: "questions",
    label: "Discovery questions",
    hint: "Pull discovery questions out of a doc, and register the doc as a source",
    Icon: FileQuestion,
  },
];

function ExtractShell() {
  const router = useRouter();
  const params = useSearchParams();
  const mode: Mode = params.get("mode") === "questions" ? "questions" : "feedback";

  // Mode lives in the URL so the Sources library can deep-link straight into
  // question extraction with a doc prefilled.
  const setMode = (next: Mode) => {
    const q = new URLSearchParams(params.toString());
    if (next === "feedback") q.delete("mode");
    else q.set("mode", next);
    const qs = q.toString();
    router.replace(qs ? `/upload?${qs}` : "/upload");
  };

  const active = MODES.find((m) => m.value === mode)!;

  return (
    <div>
      <div className="px-8 pt-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">AI extract</h1>
          <p className="text-[14px] text-brand-primary opacity-50 mb-4">{active.hint}. You review everything before it&apos;s saved.</p>

          <div className="inline-flex items-center gap-1 bg-white border border-[rgba(50,43,95,0.12)] rounded-sm p-0.5">
            {MODES.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${
                  mode === value
                    ? "bg-brand-secondary-500 text-white"
                    : "text-brand-primary opacity-50 hover:opacity-80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyed so switching modes starts clean rather than leaving stale state. */}
      {mode === "questions" ? <ExtractQuestions key="questions" /> : <ExtractInsights key="feedback" />}
    </div>
  );
}

export default function ExtractPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={<div className="p-8" />}>
      <ExtractShell />
    </Suspense>
  );
}
