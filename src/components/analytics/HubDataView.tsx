"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PROSE } from "@/components/domain/parts";

/**
 * One markdown document styled as a page rather than a dump: sections ruled
 * off from each other, and the tables — which are most of this doc — given a
 * header band, row hover and a leading column that reads as a label.
 */
const ARTICLE =
  PROSE +
  // A rule above each section, so the doc has visible parts. The first one
  // would draw a line directly under the card's top edge.
  " [&_h2]:text-[18px] [&_h2]:font-extrabold [&_h2]:text-brand-primary [&_h2]:mt-10 [&_h2]:mb-4" +
  " [&_h2]:pt-6 [&_h2]:border-t [&_h2]:border-[rgba(50,43,95,0.08)]" +
  " [&_h2:first-child]:mt-0 [&_h2:first-child]:pt-0 [&_h2:first-child]:border-0" +
  " [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:text-brand-primary [&_h3]:mt-6 [&_h3]:mb-2" +
  " [&_code]:text-[12.5px] [&_code]:bg-[rgba(50,43,95,0.06)] [&_code]:rounded [&_code]:px-1" +
  " [&_a]:text-brand-secondary-600 [&_a]:underline [&_em]:opacity-70" +
  // Tables: boxed, with their own header band rather than a bare underline.
  " [&_table]:w-full [&_table]:text-[13px] [&_table]:border-collapse [&_table]:my-4" +
  " [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:ring-1 [&_table]:ring-[rgba(50,43,95,0.08)]" +
  " [&_thead]:bg-[rgba(50,43,95,0.035)]" +
  " [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide" +
  " [&_th]:text-brand-primary/60 [&_th]:py-2.5 [&_th]:px-3" +
  " [&_tbody_tr]:border-t [&_tbody_tr]:border-[rgba(50,43,95,0.07)]" +
  " [&_tbody_tr:hover]:bg-[rgba(93,7,226,0.02)]" +
  " [&_td]:align-top [&_td]:py-2.5 [&_td]:px-3 [&_td]:leading-snug" +
  " [&_td:first-child]:font-semibold [&_td:first-child]:text-brand-primary";

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
    <div className="max-w-4xl">
      {/* The page header already says what this doc is; repeating it here was
          the same sentence twice down the page. */}
      <div className="flex items-center justify-between gap-4 mb-3 min-h-[32px]">
        <p className="text-[12.5px] text-brand-primary/50">
          {meta.updatedAt
            ? `Last edited ${fmt(meta.updatedAt)}${meta.updatedBy ? ` by ${meta.updatedBy}` : ""}`
            : ""}
        </p>
        {canEdit && !editing && (
          <Button variant="ghost" size="sm" onClick={() => { setDraft(body); setEditing(true); }}>
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
        <article className={`${ARTICLE} rounded-lg bg-white border border-[rgba(50,43,95,0.08)] p-6 md:p-8`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </article>
      )}
    </div>
  );
}
