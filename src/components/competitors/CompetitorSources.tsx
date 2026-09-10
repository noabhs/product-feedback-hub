"use client";
import { useEffect, useState } from "react";
import { ExternalLink, ChevronRight, ChevronDown, Lock } from "lucide-react";
import { sourceTypeLabel, sourceTypeColor } from "@/lib/competitor-sources";
import { AnswerBody } from "@/components/ask/AnswerBody";
import type { CompetitorItem, CompetitorDocumentItem } from "@/lib/types";

/**
 * The source links, and what the hub actually read out of each one.
 *
 * The list used to be links and nothing else — you could click out to Notion,
 * but the hub couldn't tell you a word of what was in there. Now each link
 * carries the documents found behind it, openable in place.
 *
 * Two things this has to be careful about. A link that failed must not look like
 * a link that was read, or the list reads as full coverage while a third of it
 * is unreachable. And a folder link is one row with many documents under it —
 * Innovaccer's five links produce a dozen-odd actual documents, so they nest
 * rather than flatten.
 */

const STATUS: Record<string, { label: string; className: string }> = {
  ok: { label: "read", className: "bg-green-50 text-green-700" },
  empty: { label: "nothing in it", className: "bg-gray-50 text-gray-500" },
  skipped: { label: "not read", className: "bg-gray-50 text-gray-500" },
  failed: { label: "couldn't read", className: "bg-red-50 text-red-700" },
};

function day(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DocumentRow({ doc }: { doc: CompetitorDocumentItem }) {
  const [open, setOpen] = useState(false);
  const status = STATUS[doc.status] ?? STATUS.skipped;
  const readable = doc.status === "ok" && Boolean(doc.summary);
  const internal = doc.sensitivity === "internal";

  return (
    <div className="border-l-2 border-[rgba(50,43,95,0.08)] pl-3">
      <button
        onClick={() => readable && setOpen((o) => !o)}
        // A document with nothing to show shouldn't pretend to be openable.
        className={`w-full flex items-center gap-2 py-1.5 text-left ${readable ? "cursor-pointer group" : "cursor-default"}`}
      >
        {readable ? (
          open ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-brand-primary opacity-40" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-brand-primary opacity-40 group-hover:opacity-70" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span
          className={`text-[13px] flex-1 min-w-0 truncate ${
            readable ? "text-brand-primary group-hover:text-brand-secondary-600" : "text-brand-primary opacity-45"
          }`}
        >
          {doc.title}
        </span>

        {internal && (
          <span
            title={doc.sensitivityReason ?? "Contains Navina's own material — not for sharing outside the company"}
            className="shrink-0 inline-flex items-center gap-1 text-[10.5px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700"
          >
            <Lock className="w-2.5 h-2.5" />
            Internal
          </span>
        )}
        {doc.status !== "ok" && (
          <span className={`shrink-0 text-[10.5px] font-medium px-1.5 py-0.5 rounded-full ${status.className}`}>
            {status.label}
          </span>
        )}
      </button>

      {/* The reason a document is a miss belongs on screen, not in a log. */}
      {doc.status !== "ok" && doc.note && (
        <p className="text-[11.5px] text-brand-primary opacity-40 pl-5 pb-1.5">{doc.note}</p>
      )}

      {open && doc.summary && (
        <div className="pl-5 pb-3 pt-1">
          <AnswerBody answer={doc.summary} tone="light" />
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-brand-primary opacity-40">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-secondary-600 opacity-100 hover:underline"
            >
              Open the original
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            {doc.sourceUpdatedAt && <span>Changed {day(doc.sourceUpdatedAt)}</span>}
            <span>Read {day(doc.fetchedAt)}</span>
            {doc.truncated && (
              <span className="text-amber-700 opacity-100" title={doc.note ?? undefined}>
                Partly unread
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompetitorSources({ competitor }: { competitor: CompetitorItem }) {
  const [documents, setDocuments] = useState<CompetitorDocumentItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/competitors/${competitor.id}/documents`);
        const data = await res.json();
        if (!cancelled) setDocuments(data.documents ?? []);
      } catch {
        // The links themselves still render, which is the whole panel's former
        // behaviour — a failed fetch of the extras shouldn't empty the section.
        if (!cancelled) setDocuments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [competitor.id]);

  if (!competitor.sources.length) {
    return (
      <p className="text-[13px] text-brand-primary opacity-40">
        No sources added yet — CI Launcher links are still being collected for this one.
      </p>
    );
  }

  const forSource = (sourceId: string) => (documents ?? []).filter((d) => d.sourceId === sourceId);
  const orphans = (documents ?? []).filter((d) => !d.sourceId || !competitor.sources.some((s) => s.id === d.sourceId));
  const nothingRead = documents !== null && documents.length === 0;

  return (
    <div className="space-y-2">
      {competitor.sources.map((s) => {
        const docs = forSource(s.id);
        const read = docs.filter((d) => d.status === "ok").length;

        return (
          <div key={s.id} className="rounded-md border border-[rgba(50,43,95,0.08)]">
            <div className="flex items-center gap-2 px-3 py-2">
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${sourceTypeColor(s.type)}`}
              >
                {sourceTypeLabel(s.type)}
              </span>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-brand-primary flex-1 min-w-0 truncate hover:text-brand-secondary-600 hover:underline"
              >
                {s.label}
              </a>
              {docs.length > 0 && (
                <span className="shrink-0 text-[11px] text-brand-primary opacity-40">
                  {read === docs.length ? `${read} read` : `${read} of ${docs.length} read`}
                </span>
              )}
              <a href={s.url} target="_blank" rel="noopener noreferrer" title="Open the source">
                <ExternalLink className="w-3.5 h-3.5 text-brand-primary opacity-40 hover:opacity-80 shrink-0" />
              </a>
            </div>

            {docs.length > 0 && (
              <div className="px-3 pb-2 pl-4">
                {docs.map((d) => (
                  <DocumentRow key={d.id} doc={d} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {orphans.length > 0 && (
        <div className="rounded-md border border-[rgba(50,43,95,0.08)] px-3 py-2">
          <p className="text-[11px] text-brand-primary opacity-40 mb-1">
            Also read — the link these came from is no longer listed
          </p>
          {orphans.map((d) => (
            <DocumentRow key={d.id} doc={d} />
          ))}
        </div>
      )}

      {documents === null && (
        <p className="text-[11.5px] text-brand-primary opacity-30">Checking what we&rsquo;ve read…</p>
      )}

      {nothingRead && (
        <p className="text-[11.5px] text-brand-primary opacity-40">
          Nothing behind these links has been read into the hub yet, so the ask can&rsquo;t quote them.
        </p>
      )}
    </div>
  );
}
