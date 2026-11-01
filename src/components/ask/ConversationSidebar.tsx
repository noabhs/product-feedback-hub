"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { clsx } from "clsx";
import type { ConversationListItem } from "@/lib/ask-conversation";

const DAY = 24 * 60 * 60 * 1000;

/** Today / last week / older, by last activity — the way a chat list is read. */
function groupByRecency(items: ConversationListItem[], now: number) {
  const groups: { label: string; items: ConversationListItem[] }[] = [
    { label: "Today", items: [] },
    { label: "Last 7 days", items: [] },
    { label: "Older", items: [] },
  ];
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  for (const c of items) {
    const at = new Date(c.updatedAt).getTime();
    (at >= startOfToday ? groups[0] : at >= now - 7 * DAY ? groups[1] : groups[2]).items.push(c);
  }
  return groups.filter((g) => g.items.length > 0);
}

/**
 * The caller's own chats. The list comes from the server (and only ever holds
 * their own); renaming and deleting call the API and then refresh it.
 */
export function ConversationSidebar({ conversations }: { conversations: ConversationListItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const activeId = pathname.startsWith("/ask/") ? pathname.split("/")[2] : null;
  // Read once on mount: a list regrouped on every render would shuffle under the cursor.
  const [now] = useState(() => Date.now());
  const groups = useMemo(() => groupByRecency(conversations, now), [conversations, now]);

  async function rename(id: string) {
    const next = title.trim();
    setEditing(null);
    if (!next) return;
    setError("");
    const res = await fetch(`/api/ask/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: next }),
    });
    if (!res.ok) setError("Couldn't rename that chat.");
    router.refresh();
  }

  async function remove(c: ConversationListItem) {
    const ok = window.confirm(
      `Delete "${c.title}"?\n\nYour follow-up questions and the answers to them are deleted. The first question and its answer stay on the team's Asks log.`,
    );
    if (!ok) return;
    setError("");
    const res = await fetch(`/api/ask/conversations/${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Couldn't delete that chat.");
      return;
    }
    if (activeId === c.id) router.push("/ask");
    router.refresh();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-3">
        <Link
          href="/ask"
          className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-[rgba(50,43,95,0.15)] bg-white px-3 py-2 text-[13px] font-medium text-brand-primary transition-colors hover:border-brand-secondary-500 hover:text-brand-secondary-600"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3" aria-label="Your chats">
        {groups.length === 0 && (
          <p className="px-3 py-2 text-[12px] leading-relaxed text-brand-primary/45">
            Your chats will show up here. Only you (and the hub owner) can see them.
          </p>
        )}
        {groups.map((g) => (
          <div key={g.label} className="mb-3">
            <p className="px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-brand-primary/35">
              {g.label}
            </p>
            {g.items.map((c) =>
              editing === c.id ? (
                <form
                  key={c.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    void rename(c.id);
                  }}
                  className="flex items-center gap-1 px-1 py-0.5"
                >
                  <input
                    autoFocus
                    value={title}
                    maxLength={120}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                    className="min-w-0 flex-1 rounded-sm border border-brand-secondary-500 bg-white px-2 py-1 text-[13px] text-brand-primary focus:outline-none"
                  />
                  <button type="submit" aria-label="Save title" className="p-1 text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" aria-label="Cancel" onClick={() => setEditing(null)} className="p-1 text-brand-primary/50">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <div
                  key={c.id}
                  className={clsx(
                    "group flex items-center rounded-sm transition-colors",
                    c.id === activeId ? "bg-[rgba(93,7,226,0.08)]" : "hover:bg-[rgba(50,43,95,0.05)]",
                  )}
                >
                  <Link
                    href={`/ask/${c.id}`}
                    title={c.title}
                    className={clsx(
                      "min-w-0 flex-1 truncate px-3 py-2 text-[13px]",
                      c.id === activeId ? "font-medium text-brand-secondary-600" : "text-brand-primary/80",
                    )}
                  >
                    {c.title}
                  </Link>
                  <span className="flex shrink-0 pr-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      aria-label={`Rename ${c.title}`}
                      onClick={() => {
                        setTitle(c.title);
                        setEditing(c.id);
                      }}
                      className="p-1.5 text-brand-primary/45 hover:text-brand-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label={`Delete ${c.title}`}
                      onClick={() => void remove(c)}
                      className="p-1.5 text-brand-primary/45 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              ),
            )}
          </div>
        ))}
        {error && <p className="px-3 text-[12px] text-red-700">{error}</p>}
      </nav>
    </div>
  );
}
