"use client";
import { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useApiKey } from "@/hooks/useApiKey";

/**
 * Sidebar row + modal for the personal Anthropic API key. Lives in the sidebar
 * so it's reachable from anywhere; the key itself is per-browser localStorage.
 */
export function ApiKeyControl() {
  const { apiKey, saveKey } = useApiKey();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const openModal = () => { setDraft(apiKey); setOpen(true); };

  const save = () => { saveKey(draft); setOpen(false); };
  const clear = () => { saveKey(""); setDraft(""); setOpen(false); };

  return (
    <>
      <button
        onClick={openModal}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150"
        title={apiKey ? "Anthropic API key is set" : "No Anthropic API key set"}
      >
        <KeyRound className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">API key</span>
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${apiKey ? "bg-teal" : "bg-white/25"}`}
          aria-label={apiKey ? "set" : "not set"}
        />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div
            className="relative bg-white rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(50,43,95,0.1)]">
              <h2 className="text-[16px] font-bold text-brand-primary">Anthropic API key</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-brand-primary opacity-40 hover:opacity-80 transition-opacity"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              <p className="text-[13px] text-brand-primary opacity-60 leading-relaxed">
                Used by AI extract, the Q&amp;A bar, and the discovery doc generator. Stored in this
                browser only — it is never saved to the database, and teammates set their own.
              </p>
              <Input
                type="password"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="sk-ant-…"
                className="w-full font-mono"
              />
              <p className="text-[12px] text-brand-primary opacity-40">
                Leave blank to fall back to the server&apos;s key, if one is configured.
              </p>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(50,43,95,0.1)]">
              {apiKey ? (
                <Button variant="text" size="sm" onClick={clear}>Remove key</Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={save}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
