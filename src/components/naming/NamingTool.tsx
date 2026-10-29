"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import type { DeliveryLink, IdeaRow, ItemData, ReleaseLink } from "@/lib/naming/types";

type Item = { id: string; key: string; order: number; current: string; proposed: string; state: string; data: ItemData };
type Review = { id: string; title: string; viewUrl: string; createdAt: string; createdBy: string; items?: Item[]; _count?: { items: number } };
type Audit = { id: string; at: string; by: string; action: string; key: string; itemKey: string | null; from: string; to: string; result: string; error: string | null; reverted: boolean };

const CARD = "rounded-lg bg-white border border-[rgba(50,43,95,0.08)]";
const BTN = "inline-flex items-center justify-center gap-1.5 rounded-pill border border-[rgba(50,43,95,0.18)] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-brand-primary hover:bg-surface-app disabled:opacity-40 disabled:cursor-not-allowed";
const BTN_PRIMARY = "inline-flex items-center justify-center gap-1.5 rounded-pill bg-brand-primary px-4 py-1.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed";
const INPUT = "w-full rounded-sm border border-[rgba(50,43,95,0.2)] bg-white px-3 py-2 text-[14px]";
const JIRA = "https://navina.atlassian.net/browse";
const DEFAULT_VIEW = "https://navina.atlassian.net/jira/polaris/projects/PRODUCT/ideas/view/b96c8dd0-d89f-4b92-80b3-f3139c83eaf0";
const DEFAULT_STATUS = "New Idea";

const STATE_LABEL: Record<string, string> = { pending: "Ready for review", needs_context: "Needs context", rejected: "Rejected", applied: "Applied", failed: "Failed" };
const STATE_TONE: Record<string, string> = {
  pending: "bg-sky-50 text-sky-800", needs_context: "bg-amber-100 text-amber-800", rejected: "bg-slate-100 text-slate-600",
  applied: "bg-emerald-50 text-emerald-800", failed: "bg-rose-50 text-rose-800",
};
const ACTION_LABEL: Record<string, string> = {
  rename_idea: "Idea renamed", rename_delivery: "Epic renamed", rename_release: "Release Event renamed", rename_release_step: "Release step renamed",
  revert: "Reverted", clear_view: "View cleared",
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body as T;
}

/** Words of `a` that do not appear in `b`, to highlight what changed. */
function diffWords(a: string, b: string) {
  const set = new Set(b.toLowerCase().split(/\s+/));
  return a.split(/(\s+)/).map((w, i) => (w.trim() && !set.has(w.toLowerCase()) ? { w, hit: true, i } : { w, hit: false, i }));
}

export default function NamingTool() {
  const [tab, setTab] = useState<"review" | "audit">("review");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [err, setErr] = useState("");
  const [canEdit, setCanEdit] = useState(true);

  const loadReviews = useCallback(async () => {
    try {
      const { reviews } = await api<{ reviews: Review[] }>("/api/naming/reviews");
      setReviews(reviews);
      return reviews;
    } catch (e) { setErr((e as Error).message); return []; }
  }, []);
  const openReview = useCallback(async (id: string) => {
    try { setReview((await api<{ review: Review }>(`/api/naming/reviews/${id}`)).review); } catch (e) { setErr((e as Error).message); }
  }, []);
  const loadAudit = useCallback(async () => {
    try { setAudit((await api<{ audit: Audit[] }>("/api/naming/audit")).audit); } catch (e) { setErr((e as Error).message); }
  }, []);

  useEffect(() => {
    // Loading what the server holds on first view; setState happens after the fetch resolves.
    Promise.all([api<{ reviews: Review[]; canEdit: boolean }>("/api/naming/reviews"), api<{ audit: Audit[] }>("/api/naming/audit")])
      .then(([r, a]) => { setReviews(r.reviews); setCanEdit(r.canEdit); setAudit(a.audit); if (r.reviews[0]) openReview(r.reviews[0].id); })
      .catch((e: Error) => setErr(e.message));
  }, [openReview]);

  return (
    <div>
      <div className="flex items-center gap-1 rounded-pill bg-surface-app p-1 w-fit mb-5">
        {(["review", "audit"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); if (t === "audit") loadAudit(); }}
            className={`rounded-pill px-4 py-1.5 text-[13px] font-semibold ${tab === t ? "bg-white text-brand-primary shadow-sm" : "text-brand-primary/60"}`}>
            {t === "review" ? "Review" : "Audit log"}
          </button>
        ))}
      </div>
      {err && <p className="mb-4 rounded-sm bg-rose-50 px-3 py-2 text-[13px] text-rose-800">{err}</p>}
      {tab === "review" ? (
        <ReviewTab canEdit={canEdit} reviews={reviews} review={review} setErr={setErr}
          onCreated={async (id) => { await loadReviews(); await openReview(id); }}
          onPick={openReview} onChanged={() => { if (review) openReview(review.id); loadAudit(); }}
          onCleared={async () => { setReview(null); const r = await loadReviews(); if (r[0]) openReview(r[0].id); loadAudit(); }} />
      ) : (
        <AuditTab canEdit={canEdit} audit={audit} onReverted={() => { loadAudit(); if (review) openReview(review.id); }} setErr={setErr} />
      )}
    </div>
  );
}

/* ---------- Review tab ---------- */

function ReviewTab({ canEdit, reviews, review, setErr, onCreated, onPick, onChanged, onCleared }: {
  canEdit: boolean; reviews: Review[]; review: Review | null; setErr: (s: string) => void;
  onCreated: (id: string) => void; onPick: (id: string) => void; onChanged: () => void; onCleared: () => void;
}) {
  const [url, setUrl] = useState(DEFAULT_VIEW);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<IdeaRow[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ product: "", team: "", status: "", q: "" });
  const [building, setBuilding] = useState(false);

  async function loadIdeas() {
    setErr(""); setLoading(true); setIdeas(null);
    try {
      const r = await api<{ ideas: IdeaRow[] }>("/api/naming/ideas", { method: "POST", body: JSON.stringify({ url }) });
      setIdeas(r.ideas); setPicked(new Set());
      setFilters({ product: "", team: "", status: r.ideas.some((i) => i.status === DEFAULT_STATUS) ? DEFAULT_STATUS : "", q: "" });
    } catch (e) { setErr((e as Error).message); }
    setLoading(false);
  }
  const shown = useMemo(() => (ideas ?? []).filter((i) =>
    (!filters.product || i.product === filters.product) && (!filters.team || i.team === filters.team) &&
    (!filters.status || i.status === filters.status) && (!filters.q || i.summary.toLowerCase().includes(filters.q.toLowerCase()) || i.key.toLowerCase() === filters.q.toLowerCase())), [ideas, filters]);
  const opts = (f: keyof IdeaRow) => [...new Set((ideas ?? []).map((i) => i[f]).filter(Boolean))].sort();

  async function build() {
    setErr(""); setBuilding(true);
    try {
      const { id } = await api<{ id: string }>("/api/naming/reviews", {
        method: "POST", body: JSON.stringify({ url, keys: [...picked], title: filters.product || filters.team || "Review" }),
      });
      setIdeas(null); setPicked(new Set()); await onCreated(id);
    } catch (e) { setErr((e as Error).message); }
    setBuilding(false);
  }

  return (
    <div className="space-y-5">
      {!canEdit && (
        <p className="rounded-sm bg-amber-50 px-4 py-3 text-[13.5px]">You can read reviews and the audit log. Only people on the editors list can start a review or change tickets in Jira. Ask Noa to add you.</p>
      )}
      {canEdit && <div className={`${CARD} p-5`}>
        <label className="block text-[13px] font-semibold text-brand-primary/70 mb-2" htmlFor="viewlink">Paste the link to a Jira view</label>
        <div className="flex gap-2 flex-col sm:flex-row">
          <input id="viewlink" className={INPUT} placeholder="https://navina.atlassian.net/jira/polaris/projects/PRODUCT/ideas/view/…"
            value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && url && loadIdeas()} />
          <button className={BTN_PRIMARY} disabled={!url.trim() || loading} onClick={loadIdeas}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Load ideas
          </button>
        </div>
        <p className="mt-2 text-[12.5px] text-brand-primary/55">
          Jira does not let the hub read a view&apos;s own filter, so the hub loads the view&apos;s project and you choose which ideas to review.
        </p>

        {ideas && (
          <div className="mt-5 border-t border-[rgba(50,43,95,0.08)] pt-4">
            <div className="grid gap-2 sm:grid-cols-4">
              <select className={INPUT} value={filters.product} onChange={(e) => setFilters({ ...filters, product: e.target.value })}><option value="">Any product</option>{opts("product").map((o) => <option key={o}>{o}</option>)}</select>
              <select className={INPUT} value={filters.team} onChange={(e) => setFilters({ ...filters, team: e.target.value })}><option value="">Any team</option>{opts("team").map((o) => <option key={o}>{o}</option>)}</select>
              <select className={INPUT} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Any status</option>{opts("status").map((o) => <option key={o}>{o}</option>)}</select>
              <input className={INPUT} placeholder="Search title or key" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-[13px]">
              <button className={BTN} onClick={() => setPicked(new Set([...picked, ...shown.map((i) => i.key)]))}>Select the {shown.length} shown</button>
              <button className={BTN} onClick={() => setPicked(new Set())} disabled={!picked.size}>Clear selection</button>
              <span className="text-brand-primary/60">{picked.size} selected of {ideas.length}</span>
            </div>
            <ul className="mt-3 max-h-80 overflow-y-auto divide-y divide-[rgba(50,43,95,0.06)] rounded-sm border border-[rgba(50,43,95,0.08)]">
              {shown.map((i) => (
                <li key={i.key}>
                  <label className="flex items-start gap-3 px-3 py-2 text-[13.5px] cursor-pointer hover:bg-surface-app">
                    <input type="checkbox" className="mt-1" checked={picked.has(i.key)}
                      onChange={(e) => { const n = new Set(picked); if (e.target.checked) n.add(i.key); else n.delete(i.key); setPicked(n); }} />
                    <span className="min-w-0"><span className="font-mono text-[12px] text-brand-primary/50 mr-2">{i.key}</span>{i.summary}
                      <span className="block text-[12px] text-brand-primary/50">{[i.product, i.team, i.status].filter(Boolean).join(" · ")}</span></span>
                  </label>
                </li>
              ))}
              {!shown.length && <li className="px-3 py-6 text-center text-[13px] text-brand-primary/50">No ideas match.</li>}
            </ul>
            <div className="mt-3 flex items-center gap-3">
              <button className={BTN_PRIMARY} disabled={!picked.size || building} onClick={build}>
                {building && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Propose names for {picked.size || "…"} ideas
              </button>
              {building && <span className="text-[13px] text-brand-primary/60">Reading Jira and writing names. This takes about a minute.</span>}
            </div>
          </div>
        )}
      </div>}

      {review ? (
        <ReviewList canEdit={canEdit} review={review} reviews={reviews} onPick={onPick} onChanged={onChanged} onCleared={onCleared} setErr={setErr} />
      ) : (
        <p className="text-center text-[14px] text-brand-primary/50 py-10">No review yet. Paste a view link above to start.</p>
      )}
    </div>
  );
}

type Filter = "pending" | "needs_context" | "applied" | "rejected" | "all";

function ReviewList({ canEdit, review, reviews, onPick, onChanged, onCleared, setErr }: {
  canEdit: boolean; review: Review; reviews: Review[]; onPick: (id: string) => void; onChanged: () => void; onCleared: () => void; setErr: (s: string) => void;
}) {
  const items = review.items ?? [];
  const [filter, setFilter] = useState<Filter>("pending");
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);
  const [confirm, setConfirm] = useState<"all" | "clear" | null>(null);
  const count = (s: string) => items.filter((i) => i.state === s).length;
  const pending = items.filter((i) => i.state === "pending" && i.proposed);
  const shown = items.filter((i) => filter === "all" || i.state === filter);
  const touched = (i: Item) => 1 + i.data.delivery.filter((d) => d.action === "rename").length + i.data.releases.filter((r) => r.action === "rename").reduce((n, r) => n + 1 + r.children.filter((c) => c.suffix != null).length, 0);

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusy((b) => new Set(b).add(id));
    try { await fn(); } catch (e) { setErr((e as Error).message); }
    setBusy((b) => { const n = new Set(b); n.delete(id); return n; });
  }
  const accept = (i: Item) => run(i.id, async () => { await api(`/api/naming/items/${i.id}/accept`, { method: "POST" }); onChanged(); });
  const patch = (i: Item, body: object) => run(i.id, async () => { await api(`/api/naming/items/${i.id}`, { method: "PATCH", body: JSON.stringify(body) }); onChanged(); });

  async function acceptAll() {
    setConfirm(null); setBulk({ done: 0, total: pending.length });
    const q = [...pending];
    const worker = async () => { while (q.length) { const it = q.shift()!; await accept(it); setBulk((b) => b && { ...b, done: b.done + 1 }); } };
    await Promise.all([worker(), worker()]);
    setBulk(null);
  }
  async function rejectAll() {
    const todo = items.filter((i) => i.state === "pending" || i.state === "needs_context");
    setBulk({ done: 0, total: todo.length });
    for (const i of todo) { await patch(i, { op: "reject" }); setBulk((b) => b && { ...b, done: b.done + 1 }); }
    setBulk(null);
  }
  async function clearView() {
    setConfirm(null);
    try { await api(`/api/naming/reviews/${review.id}`, { method: "DELETE" }); onCleared(); } catch (e) { setErr((e as Error).message); }
  }
  const total = pending.reduce((n, i) => n + touched(i), 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-extrabold text-brand-primary leading-tight">{review.title}</h2>
          <p className="text-[13px] text-brand-primary/60 mt-1">{items.length} ideas · {count("applied")} applied · {count("pending")} waiting · started by {review.createdBy.split("@")[0]}</p>
        </div>
        <div className="flex items-center gap-2">
          {reviews.length > 1 && (
            <select className="rounded-pill border border-[rgba(50,43,95,0.18)] bg-white px-3 py-1.5 text-[13px] font-semibold" value={review.id} onChange={(e) => onPick(e.target.value)}>
              {reviews.map((r) => <option key={r.id} value={r.id}>{r.title} · {new Date(r.createdAt).toLocaleDateString()}</option>)}
            </select>
          )}
          {canEdit && <button className={BTN} onClick={() => setConfirm("clear")}><Trash2 className="w-3.5 h-3.5" /> Clear view</button>}
        </div>
      </div>

      {confirm === "clear" && (
        <div className="mt-3 rounded-sm bg-rose-50 px-4 py-3 text-[13.5px] flex flex-wrap items-center gap-3">
          <p className="flex-1">Remove this review from the page? Nothing changes in Jira, and the audit log keeps what was renamed.</p>
          <button className={BTN} onClick={() => setConfirm(null)}>Keep it</button>
          <button className="rounded-pill bg-rose-600 px-4 py-1.5 text-[13px] font-semibold text-white" onClick={clearView}>Clear view</button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-sm bg-surface-app p-1">
          {([["pending", "To review"], ["needs_context", "Needs context"], ["applied", "Applied"], ["rejected", "Rejected"], ["all", "All"]] as const).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-sm px-3 py-1 text-[13px] font-semibold ${filter === f ? "bg-white shadow-sm text-brand-primary" : "text-brand-primary/60"}`}>
              {label} <span className="text-brand-primary/40">{f === "all" ? items.length : count(f)}</span>
            </button>
          ))}
        </div>
        {canEdit && <div className="flex gap-2">
          <button className={BTN} onClick={rejectAll} disabled={!!bulk}>Reject all</button>
          <button className={BTN_PRIMARY} onClick={() => setConfirm("all")} disabled={!pending.length || !!bulk}>Accept all ({pending.length})</button>
        </div>}
      </div>

      {confirm === "all" && (
        <div className="mt-3 rounded-sm bg-amber-50 px-4 py-3 text-[13.5px] flex flex-wrap items-center gap-3">
          <p className="flex-1">This renames {pending.length} ideas and their linked items in Jira, about {total} tickets in all. Each change is saved in the audit log and can be reverted.</p>
          <button className={BTN} onClick={() => setConfirm(null)}>Cancel</button>
          <button className={BTN_PRIMARY} onClick={acceptAll}>Rename in Jira</button>
        </div>
      )}
      {bulk && <p className="mt-3 text-[13px] text-brand-primary/60">Working… {bulk.done} of {bulk.total}</p>}

      <div className="mt-4 space-y-3">
        {shown.map((i) => <Row key={i.id} canEdit={canEdit} item={i} busy={busy.has(i.id)} onAccept={() => accept(i)} onPatch={(b) => patch(i, b)} />)}
        {!shown.length && <p className="py-10 text-center text-[14px] text-brand-primary/50">Nothing here.</p>}
      </div>
    </div>
  );
}

function Row({ canEdit, item, busy, onAccept, onPatch }: { canEdit: boolean; item: Item; busy: boolean; onAccept: () => void; onPatch: (b: object) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.proposed);
  const d = item.data;
  const open = canEdit && (item.state === "pending" || item.state === "needs_context" || item.state === "failed");
  const tick = (label: string, on: boolean, op: "delivery" | "release", index: number) => (
    <label key={op + index} className="flex flex-wrap items-center gap-2 text-[13px] text-brand-primary/70 py-0.5">
      <input type="checkbox" disabled={!open || busy} checked={on} onChange={(e) => onPatch({ op, index, on: e.target.checked })} />
      <span>{label}</span>
    </label>
  );
  const dRow = (x: DeliveryLink, idx: number) => tick(`Also rename ${x.key} (${x.type}, ${x.status})${x.reason ? ` · ${x.reason}` : ""}${x.done ? ` · ${x.done}` : ""}`, x.action === "rename", "delivery", idx);
  const rRow = (x: ReleaseLink, idx: number) => tick(`Also rename release item ${x.key} · ${x.children.filter((c) => c.suffix != null).length} steps keep their suffix${x.reason ? ` · ${x.reason}` : ""}${x.done ? ` · ${x.done}` : ""}`, x.action === "rename", "release", idx);

  return (
    <div className={`${CARD} p-4 grid gap-3 md:grid-cols-[1fr_auto] ${item.state === "rejected" ? "opacity-60" : ""}`}>
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <a className="font-mono text-brand-primary/55 hover:underline" href={`${JIRA}/${item.key}`} target="_blank" rel="noopener noreferrer">{item.key}</a>
          <span className={`rounded-pill px-2 py-0.5 font-semibold ${STATE_TONE[item.state] ?? ""}`}>{STATE_LABEL[item.state] ?? item.state}</span>
          <span className="rounded-pill bg-surface-app px-2 py-0.5 text-brand-primary/60">{d.level}</span>
          {d.inferred && <span className="rounded-pill bg-amber-100 px-2 py-0.5 text-amber-800">Inferred, check it</span>}
        </div>
        <p className="text-[14px] text-brand-primary/60"><span className="mr-3 text-[10.5px] font-bold uppercase tracking-wider text-brand-primary/40">Now</span>
          {item.proposed ? diffWords(item.current, item.proposed).map((p) => p.hit ? <del key={p.i} className="bg-rose-50 text-rose-700">{p.w}</del> : p.w) : item.current}</p>
        {editing ? (
          <div className="rounded-sm bg-surface-app p-3">
            <textarea className={INPUT} rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className={`text-right text-[12px] ${draft.length > 90 ? "text-rose-700 font-semibold" : "text-brand-primary/50"}`}>{draft.length}/90</div>
            <div className="mt-2 flex gap-2">
              <button className={BTN_PRIMARY} disabled={!draft.trim() || busy} onClick={async () => { await onPatch({ op: "edit", proposed: draft }); setEditing(false); }}>Save</button>
              <button className={BTN} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : item.proposed ? (
          <p className="text-[16px] font-bold text-brand-primary leading-snug"><span className="mr-3 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">New</span>
            {diffWords(item.proposed, item.current).map((p) => p.hit ? <ins key={p.i} className="bg-emerald-50 text-emerald-800 no-underline">{p.w}</ins> : p.w)}</p>
        ) : (
          <p className="text-[14px] italic text-brand-primary/50"><span className="mr-3 text-[10.5px] font-bold uppercase tracking-wider not-italic">New</span>No name yet</p>
        )}
        {d.question && !item.proposed && <p className="rounded-sm bg-amber-50 px-3 py-2 text-[13.5px]"><b>To name this we need to know:</b> {d.question}</p>}
        {(d.delivery.length > 0 || d.releases.length > 0) && (
          <div className="rounded-sm bg-surface-app px-3 py-2">
            {d.delivery.map(dRow)}
            {d.releases.map(rRow)}
          </div>
        )}
        {d.error && <p className="text-[13px] text-rose-700">{d.error}</p>}
      </div>
      <div className="flex md:flex-col gap-2 md:items-end">
        {busy ? <Loader2 className="w-4 h-4 animate-spin text-brand-primary/50" /> : open ? (
          <>
            <button className={BTN_PRIMARY} disabled={!item.proposed} onClick={onAccept}><Check className="w-3.5 h-3.5" /> Accept</button>
            <button className={BTN} onClick={() => { setDraft(item.proposed || item.current); setEditing(true); }}><Pencil className="w-3.5 h-3.5" /> Edit</button>
            <button className={BTN} onClick={() => onPatch({ op: "reject" })}><X className="w-3.5 h-3.5" /> Reject</button>
          </>
        ) : !canEdit ? null : item.state === "rejected" ? (
          <button className={BTN} onClick={() => onPatch({ op: "reopen" })}>Reopen</button>
        ) : <span className="text-[13px] font-semibold text-emerald-700">Done in Jira</span>}
      </div>
    </div>
  );
}

/* ---------- Audit tab ---------- */

function AuditTab({ canEdit, audit, onReverted, setErr }: { canEdit: boolean; audit: Audit[]; onReverted: () => void; setErr: (s: string) => void }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const rows = audit.filter((a) => !q || `${a.key} ${a.itemKey ?? ""} ${a.from} ${a.to} ${a.by}`.toLowerCase().includes(q.toLowerCase()));
  async function revert(id: string) {
    setBusy(id);
    try { await api(`/api/naming/audit/${id}/revert`, { method: "POST" }); onReverted(); } catch (e) { setErr((e as Error).message); }
    setBusy("");
  }
  return (
    <div className={`${CARD} p-5`}>
      <h2 className="text-[20px] font-extrabold text-brand-primary">Everything this tool changed in Jira</h2>
      <p className="text-[13px] text-brand-primary/60 mt-1 mb-3">Each rename is recorded with who did it and the before and after. Revert puts an old name back.</p>
      <input className={`${INPUT} max-w-xs mb-3`} placeholder="Search key, name or person" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="overflow-x-auto rounded-sm border border-[rgba(50,43,95,0.08)]">
        <table className="w-full min-w-[760px] text-[13.5px]">
          <thead><tr className="bg-surface-app text-left text-[11px] uppercase tracking-wider text-brand-primary/55">
            <th className="px-3 py-2">When</th><th className="px-3 py-2">Who</th><th className="px-3 py-2">What</th><th className="px-3 py-2">Ticket</th><th className="px-3 py-2">Change</th><th className="px-3 py-2" /></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-[rgba(50,43,95,0.08)] align-top">
                <td className="px-3 py-2 whitespace-nowrap text-brand-primary/60">{new Date(a.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="px-3 py-2">{a.by.split("@")[0]}</td>
                <td className="px-3 py-2">{ACTION_LABEL[a.action] ?? a.action}{a.result !== "ok" && <span className="ml-1 text-rose-700">· failed</span>}</td>
                <td className="px-3 py-2 font-mono text-[12px]">{a.action === "clear_view" ? "" : <a className="hover:underline" href={`${JIRA}/${a.key}`} target="_blank" rel="noopener noreferrer">{a.key}</a>}</td>
                <td className="px-3 py-2"><span className="text-brand-primary/50 line-through">{a.from}</span>{a.from && " "}<b>{a.to}</b>{a.error && <span className="block text-rose-700">{a.error}</span>}</td>
                <td className="px-3 py-2">{canEdit && a.action.startsWith("rename_") && a.result === "ok" && !a.reverted && (
                  <button className={BTN} disabled={busy === a.id} onClick={() => revert(a.id)}>{busy === a.id ? "Reverting…" : "Revert"}</button>)}
                  {a.reverted && <span className="text-brand-primary/50">Reverted</span>}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-brand-primary/50">No changes yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
