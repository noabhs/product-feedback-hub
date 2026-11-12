"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, MessageSquare, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MentionTextarea, loadPeople } from "@/components/insights/MentionTextarea";
import { splitBody } from "@/lib/mentions";
import type { Anchor } from "@/lib/page-comments";

type PC = Anchor & {
  id: string;
  path: string;
  parentId: string | null;
  author: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

type Pos = { x: number; y: number };
const POP_W = 320;
const INPUT =
  "w-full rounded-sm bg-white border border-black/15 px-3 py-2 text-[14px] text-brand-primary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-secondary-500 focus:ring-1 focus:ring-brand-secondary-500 resize-none transition-all";

// ---- Anchoring -----------------------------------------------------------

/** Child-index path from `root` down to `el`, e.g. "div:nth-child(2)>section:nth-child(1)". */
function pathTo(el: Element, root: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== root && cur.parentElement) {
    const idx = Array.prototype.indexOf.call(cur.parentElement.children, cur) + 1;
    parts.unshift(`${cur.tagName.toLowerCase()}:nth-child(${idx})`);
    cur = cur.parentElement;
  }
  return parts.join(">");
}

function snippetOf(el: Element): string {
  return (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
}

/** Where a click landed, expressed so it can be found again later. */
function makeAnchor(main: HTMLElement, target: Element, clientX: number, clientY: number): Anchor {
  const m = main.getBoundingClientRect();
  const r = target.getBoundingClientRect();
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return {
    selector: pathTo(target, main),
    snippet: snippetOf(target),
    relX: r.width ? clamp((clientX - r.left) / r.width) : 0,
    relY: r.height ? clamp((clientY - r.top) / r.height) : 0,
    absX: m.width ? (clientX - m.left) / m.width : 0,
    absY: clientY - m.top + main.scrollTop,
  };
}

/** Position of an anchor in <main>'s scrolling content, or the page-position fallback if the element moved or changed. */
function locate(main: HTMLElement, a: Anchor): Pos {
  const m = main.getBoundingClientRect();
  let el: Element | null = null;
  if (a.selector) {
    try {
      el = main.querySelector(`:scope > ${a.selector}`);
    } catch {
      el = null;
    }
  }
  if (el && (!a.snippet || snippetOf(el).startsWith(a.snippet.slice(0, 40)))) {
    const r = el.getBoundingClientRect();
    if (r.width || r.height) {
      return { x: r.left - m.left + a.relX * r.width, y: r.top - m.top + main.scrollTop + a.relY * r.height };
    }
  }
  return { x: a.absX * m.width, y: a.absY };
}

// ---- Small helpers -------------------------------------------------------

function initials(email: string): string {
  const parts = email.split("@")[0].split(/[._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function fmtWhen(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}

// Comment-bubble cursor while picking. The hotspot is the bubble's tip.
const PICK_CURSOR = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M3 25V8a5 5 0 0 1 5-5h12a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H9z" fill="#7c3aed" stroke="#fff" stroke-width="2"/></svg>',
)}") 3 25, crosshair`;

function Body({ text, people }: { text: string; people: string[] }) {
  return (
    <p className="text-[14px] text-brand-primary leading-relaxed whitespace-pre-wrap break-words">
      {splitBody(text, people).map((part, i) =>
        part.mention ? (
          <span key={i} className="rounded bg-[rgba(50,43,95,0.08)] px-1 font-medium text-brand-secondary-500">
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )}
    </p>
  );
}

function Avatar({ email, size = 24 }: { email: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-brand-secondary-500 text-white font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials(email)}
    </span>
  );
}

// ---- One comment inside a thread ----------------------------------------

function Entry({
  c,
  currentUser,
  people,
  onChange,
  onDeleted,
  onError,
}: {
  c: PC;
  currentUser: string | null;
  people: string[];
  onChange: () => void;
  onDeleted: () => void;
  onError: (m: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.body);
  const mine = currentUser != null && c.author === currentUser;

  async function save() {
    if (!draft.trim()) return;
    try {
      await api(`/api/page-comments/${c.id}`, "PATCH", { body: draft });
      setEditing(false);
      onChange();
    } catch (e) {
      onError((e as Error).message);
    }
  }
  async function remove() {
    if (!confirm(c.parentId ? "Delete this reply?" : "Delete this comment and its replies?")) return;
    try {
      await api(`/api/page-comments/${c.id}`, "DELETE");
      onDeleted();
    } catch (e) {
      onError((e as Error).message);
    }
  }

  return (
    <div className="flex gap-2.5">
      <Avatar email={c.author} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[13px] font-semibold text-brand-primary truncate">{c.author.split("@")[0]}</span>
          <span className="text-[11px] text-brand-primary opacity-40 shrink-0">{fmtWhen(c.createdAt)}</span>
          {c.updatedAt !== c.createdAt && <span className="text-[11px] text-brand-primary opacity-40">· edited</span>}
          {mine && !editing && (
            <span className="ml-auto flex shrink-0">
              <button
                onClick={() => { setDraft(c.body); setEditing(true); }}
                className="p-1 text-brand-primary opacity-30 hover:opacity-70"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={remove}
                className="p-1 text-brand-primary opacity-30 hover:opacity-70 hover:text-negative-strong"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
        {editing ? (
          <div>
            <MentionTextarea value={draft} onChange={setDraft} rows={3} className={INPUT} />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={save}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Body text={c.body} people={people} />
        )}
      </div>
    </div>
  );
}

// ---- Main component ------------------------------------------------------

/** Remounted per page, so every page starts with clean state. */
export function PageComments({ currentUser }: { currentUser: string | null }) {
  const pathname = usePathname() || "/";
  return <PageCommentsInner key={pathname} pathname={pathname} currentUser={currentUser} />;
}

function PageCommentsInner({ pathname, currentUser }: { pathname: string; currentUser: string | null }) {
  const [comments, setComments] = useState<PC[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ anchor: Anchor; pos: Pos } | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pos, setPos] = useState<Record<string, Pos>>({});
  const [layerW, setLayerW] = useState(1200);
  const [tick, setTick] = useState(0);
  const layerRef = useRef<HTMLDivElement>(null);

  const mainEl = () => document.getElementById("hub-main");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/page-comments?path=${encodeURIComponent(pathname)}`);
      if (!res.ok) return;
      const d = await res.json();
      setComments(d.comments ?? []);
    } catch {
      /* the pins just stay as they were */
    }
  }, [pathname]);

  // Load on arrival; refresh when the tab regains focus.
  useEffect(() => {
    const t = setTimeout(load, 0);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);
  useEffect(() => { loadPeople().then(setPeople); }, []);

  const roots = useMemo(() => comments.filter((c) => !c.parentId), [comments]);
  const repliesOf = useCallback((id: string) => comments.filter((c) => c.parentId === id), [comments]);
  const visible = roots.filter((r) => !r.resolvedAt || showResolved || r.id === openId);
  const resolvedCount = roots.filter((r) => r.resolvedAt).length;

  // Keep pins glued to their elements as the page lays out, loads data and resizes.
  useEffect(() => {
    const main = mainEl();
    if (!main) return;
    let raf = 0;
    const bump = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setTick((t) => t + 1));
    };
    const ro = new ResizeObserver(bump);
    ro.observe(main);
    const mo = new MutationObserver((muts) => {
      // Ignore our own layer so rendering pins doesn't retrigger itself.
      if (muts.every((m) => (m.target as Element).closest?.("[data-comment-ui]"))) return;
      bump();
    });
    mo.observe(main, { childList: true, subtree: true, characterData: true });
    window.addEventListener("resize", bump);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", bump);
    };
  }, [pathname]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const main = mainEl();
      if (!main) return;
      setLayerW(main.clientWidth);
      const next: Record<string, Pos> = {};
      for (const r of roots) next[r.id] = locate(main, r);
      setPos((prev) => {
        const same =
          Object.keys(next).length === Object.keys(prev).length &&
          Object.entries(next).every(([k, v]) => prev[k] && Math.abs(prev[k].x - v.x) < 0.5 && Math.abs(prev[k].y - v.y) < 0.5);
        return same ? prev : next;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [roots, tick]);

  // Pick mode: swallow the next click on the page and turn it into an anchor.
  useEffect(() => {
    if (!picking) return;
    const style = document.createElement("style");
    style.textContent = `body.comment-picking, body.comment-picking * { cursor: ${PICK_CURSOR} !important; }`;
    document.head.appendChild(style);
    document.body.classList.add("comment-picking");

    const onClick = (e: MouseEvent) => {
      const main = mainEl();
      const target = e.target as Element | null;
      if (!main || !target || !main.contains(target) || target.closest("[data-comment-ui]")) return;
      e.preventDefault();
      e.stopPropagation();
      const anchor = makeAnchor(main, target, e.clientX, e.clientY);
      setDraft({ anchor, pos: locate(main, anchor) });
      setOpenId(null);
      setText("");
      setPicking(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPicking(false);
    document.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("comment-picking");
      style.remove();
    };
  }, [picking]);

  // Click anywhere outside the comment UI closes an open thread or an unsent draft.
  useEffect(() => {
    if (!openId && !draft) return;
    const onDown = (e: MouseEvent) => {
      if ((e.target as Element).closest?.("[data-comment-ui]")) return;
      setOpenId(null);
      setDraft(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openId, draft]);

  async function postRoot() {
    if (!draft || !text.trim()) return;
    setBusy(true);
    setError("");
    try {
      const saved: PC = await api("/api/page-comments", "POST", { body: text, path: pathname, anchor: draft.anchor });
      setComments((c) => [...c, saved]);
      setDraft(null);
      setText("");
      setOpenId(saved.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function popLeft(x: number) {
    return x + 18 + POP_W > layerW ? Math.max(8, x - 18 - POP_W) : x + 18;
  }

  return (
    <>
      <div ref={layerRef} data-comment-ui className="absolute left-0 top-0 w-full h-0 z-20 pointer-events-none">
        {visible.map((r, i) => {
          const p = pos[r.id];
          if (!p) return null;
          const open = openId === r.id;
          const replies = repliesOf(r.id);
          return (
            <div key={r.id}>
              <button
                type="button"
                data-comment-ui
                onClick={() => { setOpenId(open ? null : r.id); setDraft(null); setError(""); }}
                title={`${r.author} — ${r.body.slice(0, 80)}`}
                className={`pointer-events-auto absolute flex items-center justify-center rounded-full rounded-bl-none border-2 border-white text-white text-[11px] font-semibold shadow-md ${
                  r.resolvedAt ? "bg-gray-400" : "bg-brand-secondary-500"
                } ${open ? "ring-2 ring-brand-secondary-500/40" : ""}`}
                style={{ left: p.x, top: p.y - 28, width: 28, height: 28 }}
              >
                {r.resolvedAt ? <Check className="w-3.5 h-3.5" /> : initials(r.author)}
                {replies.length > 0 && !open && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-white text-brand-secondary-500 border border-brand-secondary-500 text-[9px] flex items-center justify-center">
                    {replies.length + 1}
                  </span>
                )}
                <span className="sr-only">Comment {i + 1}</span>
              </button>

              {open && (
                <Thread
                  root={r}
                  replies={replies}
                  left={popLeft(p.x)}
                  top={Math.max(8, p.y - 28)}
                  currentUser={currentUser}
                  people={people}
                  onChange={load}
                  onClose={() => setOpenId(null)}
                  onDeleted={() => { setOpenId(null); load(); }}
                />
              )}
            </div>
          );
        })}

        {draft && (
          <div key="draft">
            <span
              className="absolute flex items-center justify-center rounded-full rounded-bl-none border-2 border-white bg-brand-secondary-500 text-white shadow-md"
              style={{ left: draft.pos.x, top: draft.pos.y - 28, width: 28, height: 28 }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </span>
            <div
              data-comment-ui
              className="pointer-events-auto absolute rounded-lg border border-[rgba(50,43,95,0.12)] bg-white p-3 shadow-xl"
              style={{ left: popLeft(draft.pos.x), top: Math.max(8, draft.pos.y - 28), width: POP_W }}
            >
              <MentionTextarea
                value={text}
                onChange={setText}
                rows={3}
                autoFocus
                placeholder="Add a comment… type @ to tag a teammate"
                className={INPUT}
              />
              {error && <p className="text-[12px] text-red-700 mt-1.5">{error}</p>}
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="ghost" onClick={() => { setDraft(null); setError(""); }}>Cancel</Button>
                <Button size="sm" loading={busy} disabled={!text.trim()} onClick={postRoot}>Comment</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div data-comment-ui className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-2">
        {picking && (
          <div className="rounded-md bg-[#250359] text-white text-[12px] px-3 py-1.5 shadow-lg">
            Click anywhere on the page to comment · Esc to cancel
          </div>
        )}
        {resolvedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowResolved((v) => !v)}
            className="rounded-full bg-white border border-[rgba(50,43,95,0.15)] text-[11px] text-brand-primary px-3 py-1 shadow"
          >
            {showResolved ? "Hide" : "Show"} resolved ({resolvedCount})
          </button>
        )}
        <button
          type="button"
          onClick={() => { setPicking((p) => !p); setDraft(null); setOpenId(null); }}
          aria-label={picking ? "Cancel commenting" : "Add a comment on this page"}
          aria-pressed={picking}
          title={picking ? "Cancel" : "Comment on this page"}
          className={`relative flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg hover:opacity-90 transition-opacity ${
            picking ? "bg-[#250359]" : "bg-brand-secondary-500"
          }`}
        >
          {picking ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          {!picking && roots.filter((r) => !r.resolvedAt).length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-brand-secondary-500 border border-brand-secondary-500 text-[10px] font-semibold flex items-center justify-center">
              {roots.filter((r) => !r.resolvedAt).length}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

// ---- A thread: first comment, replies, reply box, resolve ---------------

function Thread({
  root,
  replies,
  left,
  top,
  currentUser,
  people,
  onChange,
  onClose,
  onDeleted,
}: {
  root: PC;
  replies: PC[];
  left: number;
  top: number;
  currentUser: string | null;
  people: string[];
  onChange: () => void;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Bring a thread that opens below the fold into view.
  useEffect(() => { ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, []);

  async function send() {
    if (!reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/page-comments", "POST", { body: reply, parentId: root.id });
      setReply("");
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function toggleResolved() {
    try {
      await api(`/api/page-comments/${root.id}`, "PATCH", { resolved: !root.resolvedAt });
      onChange();
      if (!root.resolvedAt) onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div
      ref={ref}
      data-comment-ui
      className="pointer-events-auto absolute rounded-lg border border-[rgba(50,43,95,0.12)] bg-white shadow-xl"
      style={{ left, top, width: POP_W }}
    >
      <div className="flex items-center justify-between px-3 pt-2.5">
        <span className="text-[11px] text-brand-primary opacity-50">
          {root.resolvedAt ? `Resolved by ${root.resolvedBy?.split("@")[0] ?? "someone"}` : "Comment"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleResolved}
            title={root.resolvedAt ? "Reopen" : "Resolve"}
            className="flex items-center gap-1 rounded px-1.5 py-1 text-[12px] text-brand-primary opacity-60 hover:opacity-100 hover:bg-black/5"
          >
            {root.resolvedAt ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            {root.resolvedAt ? "Reopen" : "Resolve"}
          </button>
          <button onClick={onClose} title="Close" className="p-1 text-brand-primary opacity-50 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="max-h-[50vh] overflow-y-auto px-3 py-3 space-y-3.5">
        {[root, ...replies].map((c) => (
          <Entry
            key={c.id}
            c={c}
            currentUser={currentUser}
            people={people}
            onChange={onChange}
            onDeleted={c.id === root.id ? onDeleted : onChange}
            onError={setError}
          />
        ))}
      </div>
      <div className="border-t border-[rgba(50,43,95,0.08)] p-3">
        <MentionTextarea
          value={reply}
          onChange={setReply}
          rows={2}
          placeholder="Reply… type @ to tag a teammate"
          className={INPUT}
        />
        {error && <p className="text-[12px] text-red-700 mt-1.5">{error}</p>}
        <div className="flex justify-end mt-2">
          <Button size="sm" loading={busy} disabled={!reply.trim()} onClick={send}>Reply</Button>
        </div>
      </div>
    </div>
  );
}
