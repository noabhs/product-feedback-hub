"use client";
import { KeyRound } from "lucide-react";
import { useApiKey } from "@/hooks/useApiKey";

export function NoKeyBanner() {
  const { canUseAi, ready } = useApiKey();

  // Stay quiet until we know, so the warning doesn't flash on every load —
  // and never show it when a shared server key already covers this user.
  if (!ready || canUseAi) return null;

  return (
    <div className="flex items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
      <KeyRound className="w-3.5 h-3.5 shrink-0" />
      <span>
        AI features aren&apos;t available — no Anthropic key is configured. Add a personal one via{" "}
        <span className="font-semibold">API key</span> at the bottom of the sidebar, or ask an admin
        to set one for everyone.
      </span>
    </div>
  );
}
