"use client";
import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

const SKILL_URL = "/skills/client-brief-dm/SKILL.md";

/** Copy or download the skill text, served from /public so there is one source. */
export function CopySkill() {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  const copy = async () => {
    try {
      const res = await fetch(SKILL_URL);
      if (!res.ok) throw new Error(String(res.status));
      await navigator.clipboard.writeText(await res.text());
      setState("copied");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={copy}>
        {state === "copied" ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
        {state === "copied" ? "Copied" : "Copy the skill"}
      </Button>
      <a
        href={SKILL_URL}
        download="SKILL.md"
        className="inline-flex items-center text-[13px] font-medium text-brand-secondary-600 hover:underline"
      >
        <Download className="w-4 h-4 mr-1.5" />
        Download SKILL.md
      </a>
      {state === "error" && <span className="text-[13px] text-red-600">Couldn&apos;t copy. Use the download link.</span>}
    </div>
  );
}
