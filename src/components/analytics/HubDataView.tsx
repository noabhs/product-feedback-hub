"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PROSE } from "@/components/domain/parts";

const ARTICLE =
  PROSE +
  " [&_h2]:text-[20px] [&_h2]:font-extrabold [&_h2]:text-brand-primary [&_h2]:mt-8 [&_h2]:mb-3" +
  " [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-brand-primary [&_h3]:mt-6 [&_h3]:mb-2" +
  " [&_code]:text-[12.5px] [&_code]:bg-[rgba(50,43,95,0.06)] [&_code]:rounded [&_code]:px-1" +
  " [&_a]:text-brand-secondary-600 [&_a]:underline [&_em]:opacity-70" +
  " [&_table]:w-full [&_table]:text-[13px] [&_table]:border-collapse [&_table]:mb-4" +
  " [&_th]:text-left [&_th]:font-semibold [&_th]:py-2 [&_th]:pr-4 [&_th]:border-b [&_th]:border-[rgba(50,43,95,0.15)]" +
  " [&_td]:align-top [&_td]:py-2 [&_td]:pr-4 [&_td]:border-b [&_td]:border-[rgba(50,43,95,0.08)]";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function HubDataView({
  initialBody, canEdit, updatedAt, updatedBy,
}: { initialBody: string; canEdit: boolean; updatedAt: string | null; updatedBy: string | null }) {
  const [body, setBody] = useState(initialBody);
  const [draft, setDraft] = useState(initialBody);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ updatedAt, updatedBy });

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/hub-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save");
      setBody(data.body);
      setMeta({ updatedAt: data.updatedAt, updatedBy: "you" });
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="text-[13px] text-brand-primary" style={{ opacity: 0.55 }}>
          {meta.updatedAt
            ? `Last edited ${fmt(meta.updatedAt)}${meta.updatedBy ? ` by ${meta.updatedBy}` : ""}`
            : "What's in the hub, where it comes from, and when it updates."}
        </p>
        {canEdit && !editing && (
          <Button variant="ghost" onClick={() => { setDraft(body); setEditing(true); }}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck
            className="w-full min-h-[560px] rounded-xl border border-[rgba(50,43,95,0.15)] bg-white p-4 font-mono text-[13px] leading-relaxed text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary-500"
          />
          <p className="text-[12px] text-brand-primary mt-2" style={{ opacity: 0.5 }}>
            Markdown: ## headings, - lists, **bold**, [links](https://…) and | tables |.
          </p>
          {error && <p className="text-[13px] text-red-600 mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <Button onClick={save} loading={saving}>Save</Button>
            <Button variant="text" disabled={saving} onClick={() => { setEditing(false); setError(null); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <article className={ARTICLE}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </article>
      )}
    </div>
  );
}
