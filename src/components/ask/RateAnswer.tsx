"use client";
import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { clsx } from "clsx";

export type Rating = "up" | "down" | null;

interface RateAnswerProps {
  askId: string;
  rating: Rating;
  note: string | null;
  /** "dark" sits on the purple ask bar, "light" on the Feedback insights log page. */
  tone?: "dark" | "light";
  /** Lets a list keep its own copy of the row in step with what was saved. */
  onChange?: (rating: Rating, note: string | null) => void;
}

/**
 * Shared by the ask bar and the Feedback insights log page so the rules for rating an
 * answer live in one place. The note is the point of this control: a thumb tells
 * you an answer was bad, the note tells you what to change.
 */
export function RateAnswer({ askId, rating: initialRating, note: initialNote, tone = "light", onChange }: RateAnswerProps) {
  const [rating, setRating] = useState<Rating>(initialRating);
  const [note, setNote] = useState(initialNote ?? "");
  const [draft, setDraft] = useState(initialNote ?? "");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dark = tone === "dark";

  async function save(nextRating: Rating, nextNote: string): Promise<boolean> {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/ask-log/${askId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: nextRating, note: nextNote }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      setRating(data.rating ?? null);
      setNote(data.ratingNote ?? "");
      setDraft(data.ratingNote ?? "");
      onChange?.(data.rating ?? null, data.ratingNote ?? null);
      return true;
    } catch {
      setError("Couldn't save that — try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function pick(choice: Exclude<Rating, null>) {
    // Clicking the thumb that's already lit takes the rating back off, so a
    // misclick is undoable without a second control.
    const undo = rating === choice;
    const ok = await save(undo ? null : choice, undo ? "" : note);
    if (ok) setOpen(!undo);
  }

  const thumb = (choice: Exclude<Rating, null>) => {
    const active = rating === choice;
    const Icon = choice === "up" ? ThumbsUp : ThumbsDown;
    const activeLight = choice === "up" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700";
    return (
      <button
        key={choice}
        onClick={() => pick(choice)}
        disabled={saving}
        aria-pressed={active}
        title={choice === "up" ? "This answer was good" : "This answer was wrong or unhelpful"}
        className={clsx(
          "flex items-center rounded-sm border px-2 py-1.5 transition-colors disabled:opacity-50",
          dark
            ? active
              ? "border-teal bg-teal/20 text-teal"
              : "border-white/20 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            : active
              ? activeLight
              : "border-[rgba(50,43,95,0.12)] bg-white text-brand-primary opacity-60 hover:opacity-100",
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </button>
    );
  };

  return (
    <div className={dark ? "" : "w-full"}>
      <div className="flex items-center gap-1.5">
        {thumb("up")}
        {thumb("down")}
        {rating && !open && (
          <button
            onClick={() => setOpen(true)}
            className={clsx(
              "text-[11.5px] underline underline-offset-2",
              dark ? "text-white/50 hover:text-white/80" : "text-brand-secondary-600 hover:text-brand-secondary-500",
            )}
          >
            {note ? "Edit reason" : "Add a reason"}
          </button>
        )}
      </div>

      {rating && open && (
        <div className="flex items-center gap-1.5 mt-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void save(rating, draft).then((ok) => ok && setOpen(false));
              if (e.key === "Escape") { setDraft(note); setOpen(false); }
            }}
            autoFocus
            placeholder={rating === "down" ? "What was wrong with it?" : "What made it good?"}
            className={clsx(
              "flex-1 h-8 rounded-sm px-2.5 text-[12.5px] focus:outline-none",
              dark
                ? "bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-teal"
                : "bg-white border border-[rgba(50,43,95,0.12)] text-brand-primary placeholder:text-brand-primary/40 focus:border-brand-secondary-500",
            )}
          />
          <button
            onClick={() => void save(rating, draft).then((ok) => ok && setOpen(false))}
            disabled={saving}
            className={clsx(
              "text-[12px] font-semibold px-2.5 py-1.5 rounded-sm disabled:opacity-50",
              dark ? "bg-teal text-[#250359] hover:bg-mint-400" : "bg-brand-secondary-500 text-white hover:bg-brand-secondary-400",
            )}
          >
            Save
          </button>
        </div>
      )}

      {note && !open && (
        <p className={clsx("text-[12px] mt-1.5 italic", dark ? "text-white/55" : "text-brand-primary opacity-55")}>
          &ldquo;{note}&rdquo;
        </p>
      )}

      {error && (
        <p className={clsx("text-[12px] mt-1.5", dark ? "text-amber-200" : "text-red-700")}>{error}</p>
      )}
    </div>
  );
}
