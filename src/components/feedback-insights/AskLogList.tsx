"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Search, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { RateAnswer, type Rating } from "@/components/ask/RateAnswer";
import { AnswerBody } from "@/components/ask/AnswerBody";
import { plainAnswer } from "@/lib/answer-format";
import { RowCount } from "@/components/ui/RowCount";
import { shortName } from "@/lib/people";

export interface AskRow {
  id: string;
  /** Null for everyone but the hub owner — see lib/people.ts. */
  actor: string | null;
  question: string;
  answer: string;
  matchedCount: number;
  rating: Rating;
  ratingNote: string | null;
  /** ISO string — Dates don't survive the server→client boundary as Dates. */
  createdAt: string;
  sources: { id: string; oneLiner: string; client: string | null }[];
}

type Filter = "all" | "up" | "down" | "unrated";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All questions" },
  { value: "down", label: "Rated bad" },
  { value: "up", label: "Rated good" },
  { value: "unrated", label: "Not rated yet" },
];

const SELECT =
  "text-[13px] border border-[rgba(50,43,95,0.12)] rounded-sm px-2.5 py-1.5 bg-white text-brand-primary focus:outline-none focus:border-brand-secondary-500";

function fmtWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function AskLogList({
  rows,
  showAskers,
  canDelete = false,
}: {
  rows: AskRow[];
  showAskers: boolean;
  /** Owner only. The server checks this too — see api/ask-log/[id]. */
  canDelete?: boolean;
}) {
  const [items, setItems] = useState(rows);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [asker, setAsker] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const askers = useMemo(
    () => Array.from(new Set(items.map((r) => r.actor).filter((a): a is string => !!a))).sort(),
    [items],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((r) => {
      // The open row always stays. Rating it under "Not rated yet" would
      // otherwise drop it out of the list mid-edit, taking the reason box with
      // it — and the reason is the part worth collecting.
      if (r.id === expanded) return true;
      if (filter === "unrated" && r.rating !== null) return false;
      if ((filter === "up" || filter === "down") && r.rating !== filter) return false;
      if (asker && r.actor !== asker) return false;
      if (needle && !`${r.question} ${r.answer} ${r.ratingNote ?? ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [items, q, filter, asker, expanded]);

  /** Keep the row in step with what the API saved, so filters re-evaluate. */
  function applyRating(id: string, rating: Rating, note: string | null) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, rating, ratingNote: note } : r)));
  }

  async function remove(id: string, question: string) {
    if (!confirm(`Delete this question and its answer?\n\n${question}`)) return;
    const snapshot = items;
    setDeleteError(null);
    setItems((prev) => prev.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/ask-log/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? `Server returned ${res.status}`);
      }
    } catch (e) {
      // Rolled back, because a delete that failed but looks successful is worse
      // than one that visibly didn't happen.
      setItems(snapshot);
      setDeleteError(`Couldn't delete that — ${(e as Error).message}. It's still there.`);
    }
  }

  if (items.length === 0) {
  return (
      <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-8 text-center">
        <p className="text-[14px] text-brand-primary opacity-60">
          Nothing here yet. Ask a question from the bar at the top of{" "}
          <Link href="/insights" className="text-brand-secondary-600 hover:underline">Feedback</Link>{" "}
          and it will land on this page.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)]">
      <div className="p-5 pb-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-primary opacity-35" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search questions and answers"
              className="text-[13px] border border-[rgba(50,43,95,0.12)] rounded-sm pl-8 pr-2.5 py-1.5 w-64 bg-white text-brand-primary focus:outline-none focus:border-brand-secondary-500"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className={SELECT}>
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          {/* Only the owner gets this filter, because only the owner has names. */}
          {showAskers && askers.length > 1 && (
            <select value={asker} onChange={(e) => setAsker(e.target.value)} className={SELECT}>
              <option value="">Everyone</option>
              {askers.map((a) => (
                <option key={a} value={a}>{shortName(a)}</option>
              ))}
            </select>
          )}
          {(q || filter !== "all" || asker) && (
            <button
              onClick={() => { setQ(""); setFilter("all"); setAsker(""); }}
              className="text-[12px] text-brand-secondary-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <RowCount shown={visible.length} total={items.length} noun="questions" />
      </div>

      {deleteError && (
        <div className="mx-5 mb-3 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-[13px] text-red-700">{deleteError}</p>
          <button
            onClick={() => setDeleteError(null)}
            className="text-[13px] text-red-700 opacity-60 hover:opacity-100 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="border-t border-[rgba(50,43,95,0.08)]">
        {visible.map((r) => {
          const open = expanded === r.id;
          return (
            <div key={r.id} className="border-b border-[rgba(50,43,95,0.05)] last:border-b-0">
              <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-[rgba(50,43,95,0.015)]">
                <button
                  onClick={() => setExpanded(open ? null : r.id)}
                  className="flex-1 text-left flex items-start gap-2.5 cursor-pointer"
                  aria-expanded={open}
                >
                  {open ? (
                    <ChevronDown className="w-4 h-4 shrink-0 mt-0.5 text-brand-secondary-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-brand-primary opacity-35" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-brand-primary leading-snug">{r.question}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11.5px] text-brand-primary opacity-45">
                      <span>{fmtWhen(r.createdAt)}</span>
                      <span>·</span>
                      <span>{r.matchedCount === 0 ? "no sources found" : `${r.matchedCount} sources`}</span>
                      {r.actor && (
                        <>
                          <span>·</span>
                          <span title={r.actor}>{shortName(r.actor)}</span>
                        </>
                      )}
                    </div>
                    {!open && (
                      <p className="text-[13px] text-brand-primary opacity-60 mt-1.5 line-clamp-1">{plainAnswer(r.answer)}</p>
                    )}
                  </div>
                </button>
                {canDelete && (
                  <button
                    onClick={() => remove(r.id, r.question)}
                    title="Delete this question and answer"
                    className="shrink-0 mt-0.5 p-1 rounded text-brand-primary opacity-20 hover:opacity-100 hover:text-red-600 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {r.rating && !open && (
                  <span
                    className={`shrink-0 mt-0.5 ${r.rating === "up" ? "text-emerald-600" : "text-red-600"}`}
                    title={r.ratingNote ?? (r.rating === "up" ? "Rated good" : "Rated bad")}
                  >
                    {r.rating === "up" ? <ThumbsUp className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
                  </span>
                )}
              </div>

              {open && (
                <div className="px-5 pb-4 pl-12">
                  <AnswerBody answer={r.answer} sources={r.sources} tone="light" />

                  {r.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[rgba(50,43,95,0.06)]">
                      <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1.5">
                        Sources it read
                      </p>
                      <div className="flex flex-col gap-1">
                        {r.sources.map((s) => (
                          <Link
                            key={s.id}
                            href={`/insights/${s.id}`}
                            className="text-[12.5px] text-brand-secondary-600 hover:underline truncate"
                          >
                            {s.client ? `${s.client} — ` : ""}{s.oneLiner}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-[rgba(50,43,95,0.06)]">
                    <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1.5">
                      Was this answer right?
                    </p>
                    <RateAnswer
                      askId={r.id}
                      rating={r.rating}
                      note={r.ratingNote}
                      onChange={(rating, note) => applyRating(r.id, rating, note)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <p className="text-[13px] text-brand-primary opacity-45 px-5 py-8 text-center">
            No questions match these filters.
          </p>
        )}
      </div>
    </div>
  );
}
