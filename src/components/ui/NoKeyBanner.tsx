"use client";
import { KeyRound } from "lucide-react";
import { useApiKey } from "@/hooks/useApiKey";

export function NoKeyBanner() {
  const { apiKey } = useApiKey();
  if (apiKey) return null;

  return (
    <div className="flex items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
      <KeyRound className="w-3.5 h-3.5 shrink-0" />
      <span>
        No Anthropic API key set. Add one via <span className="font-semibold">API key</span> at the
        bottom of the sidebar to use AI features.
      </span>
    </div>
  );
}
