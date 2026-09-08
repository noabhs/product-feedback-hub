import { Sparkles } from "lucide-react";

/**
 * A placeholder for the planned "ask your feedback" chat box. Rendered disabled
 * so the feature is discoverable before it exists, instead of appearing out of
 * nowhere once it ships.
 */
export function AskBox() {
  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-brand-secondary-500" />
        <h2 className="text-[14px] font-semibold text-brand-primary">Ask the hub</h2>
        <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-semibold uppercase tracking-wide bg-lavender text-brand-primary">
          Coming soon
        </span>
      </div>
      <input
        type="text"
        disabled
        placeholder="Ask anything about client feedback, themes, or trends…"
        className="w-full rounded-md border border-[rgba(50,43,95,0.12)] bg-[rgba(50,43,95,0.02)] px-4 py-3 text-[13px] text-brand-primary placeholder:text-brand-primary/40 cursor-not-allowed"
      />
    </div>
  );
}
