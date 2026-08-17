"use client";
import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Comment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function Comments({ insightId, currentUser }: { insightId: string; currentUser: string | null }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/insights/${insightId}/comments`);
      if (!res.ok) throw new Error("Couldn't load comments");
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [insightId]);

  useEffect(() => { load(); }, [load]);

  async function post() {
    if (!draft.trim()) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/insights/${insightId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Couldn't post comment");
      const saved = await res.json();
      setComments((prev) => [...prev, saved]);
      setDraft("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPosting(false);
    }
  }

  async function saveEdit(id: string) {
    if (!editDraft.trim()) return;
    const snapshot = comments;
    setError("");
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, body: editDraft } : c)));
    setEditingId(null);
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editDraft }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Couldn't save edit");
      const saved = await res.json();
      setComments((prev) => prev.map((c) => (c.id === id ? saved : c)));
    } catch (e) {
      setComments(snapshot);
      setError((e as Error).message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this comment?")) return;
    const snapshot = comments;
    setError("");
    setComments((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Couldn't delete comment");
    } catch (e) {
      setComments(snapshot);
      setError((e as Error).message);
    }
  }

  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-6 mt-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-brand-primary opacity-40" />
        <h2 className="text-[14px] font-semibold text-brand-primary">
          Comments{comments.length > 0 ? ` (${comments.length})` : ""}
        </h2>
      </div>

      {error && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-[13px] text-red-700">{error}</p>
          <button onClick={() => setError("")} className="text-[13px] text-red-700 opacity-60 hover:opacity-100 shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-brand-primary opacity-40">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-[13px] text-brand-primary opacity-40 mb-4">
          No comments yet. Add context, follow-ups, or decisions here.
        </p>
      ) : (
        <div className="space-y-4 mb-5">
          {comments.map((c) => {
            const mine = currentUser != null && c.author === currentUser;
            return (
              <div key={c.id} className="border-b border-[rgba(50,43,95,0.06)] pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[13px] font-semibold text-brand-primary">{c.author}</span>
                  <span className="text-[11px] text-brand-primary opacity-35">{fmtWhen(c.createdAt)}</span>
                  {c.updatedAt !== c.createdAt && (
                    <span className="text-[11px] text-brand-primary opacity-35">· edited</span>
                  )}
                  {mine && editingId !== c.id && (
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => { setEditingId(c.id); setEditDraft(c.body); }}
                        className="p-1 rounded text-brand-primary opacity-30 hover:opacity-70 transition-opacity"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => remove(c.id)}
                        className="p-1 rounded text-brand-primary opacity-30 hover:opacity-70 hover:text-negative-strong transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {editingId === c.id ? (
                  <div>
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      rows={3}
                      className="w-full rounded-sm bg-white border border-black/15 px-3 py-2 text-[14px] text-brand-primary focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none transition-all"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => saveEdit(c.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[14px] text-brand-primary leading-relaxed whitespace-pre-wrap">{c.body}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Add a comment…"
          className="w-full rounded-sm bg-white border border-black/15 px-3 py-2.5 text-[14px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none transition-all"
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" loading={posting} onClick={post} disabled={!draft.trim()}>
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
