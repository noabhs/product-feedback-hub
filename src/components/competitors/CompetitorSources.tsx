"use client";
import { ExternalLink } from "lucide-react";
import { sourceTypeLabel, sourceTypeColor } from "@/lib/competitor-sources";
import type { CompetitorItem, CompetitorDocumentItem } from "@/lib/types";

/**
 * The source links, and what the hub got out of each.
 *
 * This section used to expand each document into a prose summary. The claims
 * moved to CompetitorClaims, so what's left here is the job this list is
 * actually good at: provenance and coverage. Which links exist, what was read
 * behind them, and — the part that matters — which ones were not.
 *
 * A link that failed must not look like a link that was read. With 73 Drive
 * files owned by different people, partial coverage is the expected state, and a
 * list that renders misses like successes reads as completeness it doesn't have.
 */

const STATUS: Record<string, { label: string; className: string }> = {
  ok: { label: "read", className: "bg-green-50 text-green-700" },
  empty: { label: "nothing in it", className: "bg-gray-50 text-gray-500" },
  skipped: { label: "not read", className: "bg-gray-50 text-gray-500" },
  failed: { label: "couldn't read", className: "bg-red-50 text-red-700" },
};

function DocumentLine({ doc }: { doc: CompetitorDocumentItem }) {
  const status = STATUS[doc.status] ?? STATUS.skipped;
  const read = doc.status === "ok";

  return (
    <div className="border-l-2 border-[rgba(50,43,95,0.08)] pl-3 py-1">
      <div className="flex items-center gap-2">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-[13px] flex-1 min-w-0 truncate hover:underline ${
            read ? "text-brand-primary" : "text-brand-primary opacity-45"
          }`}
        >
          {doc.title}
        </a>
        {read && doc.claimCount > 0 && (
          <span className="shrink-0 text-[11px] text-brand-primary opacity-40 tabular-nums">
            {doc.claimCount} claim{doc.claimCount === 1 ? "" : "s"}
          </span>
        )}
        {!read && (
          <span className={`shrink-0 text-[10.5px] font-medium px-1.5 py-0.5 rounded-full ${status.className}`}>
            {status.label}
          </span>
        )}
        {doc.truncated && (
          <span
            title={doc.note ?? undefined}
            className="shrink-0 text-[10.5px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700"
          >
            partly unread
          </span>
        )}
      </div>
      {/* The reason a document is a miss belongs on screen, not in a log. */}
      {!read && doc.note && <p className="text-[11.5px] text-brand-primary opacity-40 mt-0.5">{doc.note}</p>}
    </div>
  );
}

export function CompetitorSources({
  competitor,
  documents,
  loading,
}: {
  competitor: CompetitorItem;
  documents: CompetitorDocumentItem[];
  loading: boolean;
}) {
  if (!competitor.sources.length) {
    return (
      <p className="text-[13px] text-brand-primary opacity-40">
        No sources added yet — CI Launcher links are still being collected for this one.
      </p>
    );
  }

  const orphans = documents.filter((d) => !d.sourceId || !competitor.sources.some((s) => s.id === d.sourceId));
  const nothingRead = !loading && documents.length === 0;

  return (
    <div className="space-y-2">
      {competitor.sources.map((s) => {
        const docs = documents.filter((d) => d.sourceId === s.id);
        const read = docs.filter((d) => d.status === "ok").length;

        return (
          <div key={s.id} className="rounded-md border border-[rgba(50,43,95,0.08)]">
            <div className="flex items-center gap-2 px-3 py-2">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${sourceTypeColor(s.type)}`}>
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
              <ExternalLink className="w-3.5 h-3.5 text-brand-primary opacity-40 shrink-0" />
            </div>

            {docs.length > 0 && (
              <div className="px-3 pb-2 pl-4">
                {docs.map((d) => (
                  <DocumentLine key={d.id} doc={d} />
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
            <DocumentLine key={d.id} doc={d} />
          ))}
        </div>
      )}

      {loading && <p className="text-[11.5px] text-brand-primary opacity-30">Checking what we&rsquo;ve read…</p>}

      {nothingRead && (
        <p className="text-[11.5px] text-brand-primary opacity-40">
          Nothing behind these links has been read into the hub yet.
        </p>
      )}
    </div>
  );
}
