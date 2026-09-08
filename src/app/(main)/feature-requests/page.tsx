"use client";
import { useState, useEffect, Suspense } from "react";
import { Plus, ChevronRight, Pencil, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { shortName, byline } from "@/lib/people";
import { FEATURE_REQUEST_STATUS_OPTIONS } from "@/lib/feature-request-status";
import { FeatureRequestModal } from "@/components/feature-requests/FeatureRequestModal";
import type { FeatureRequestItem } from "@/lib/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function FeatureRequestsPage() {
  // useSearchParams (via child hooks) needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={<div className="p-8" />}>
      <FeatureRequests />
    </Suspense>
  );
}

function FeatureRequests() {
  const [requests, setRequests] = useState<FeatureRequestItem[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<FeatureRequestItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/feature-requests?${params}`);
      const data = await res.json();
      setRequests(data.requests ?? []);
      setMe(data.me ?? null);
      setLoading(false);
    };
    load();
  }, [status]);

  function canModify(r: FeatureRequestItem): boolean {
    return me != null && (me === r.reporter || me === "noa.bhs@navina.ai");
  }

  async function remove(id: string) {
    if (!confirm("Delete this feature request?")) return;
    const snapshot = requests;
    setError(null);
    setRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/feature-requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Server returned ${res.status}`);
    } catch (e) {
      setRequests(snapshot);
      setError(`Couldn't delete that request — ${(e as Error).message}`);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Feature requests</h1>
            <p className="text-[14px] text-brand-primary opacity-50 max-w-xl">
              Feature ideas reported from inside the org. Anyone can file one; only the reporter or the hub owner can edit or delete it.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)} className="shrink-0 ml-4">
            <Plus className="w-4 h-4" />
            New request
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          <Select value={status} onChange={setStatus} options={[...FEATURE_REQUEST_STATUS_OPTIONS]} placeholder="All statuses" className="w-44" />
          {status && (
            <Button variant="text" size="sm" onClick={() => setStatus("")}>
              Clear
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[13px] text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-[13px] text-red-700 opacity-60 hover:opacity-100 shrink-0">
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-md animate-pulse border border-[rgba(50,43,95,0.06)]" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-[rgba(50,43,95,0.08)]">
            <p className="text-brand-primary opacity-40 text-[15px] mb-1">No feature requests yet</p>
            <p className="text-brand-primary opacity-25 text-[13px]">File the first one to get this list started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="bg-white rounded-md border border-[rgba(50,43,95,0.08)] overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-[#f6f6fa] transition-colors"
                >
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 mt-0.5 text-brand-primary opacity-40 transition-transform duration-200 ${expanded === r.id ? "rotate-90" : ""}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-brand-primary font-medium leading-snug">{r.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge type="status" value={r.status} />
                      <span className="text-[11px] text-brand-primary opacity-30" title={r.reporter}>
                        {byline(r.reporter)}
                      </span>
                      <span className="text-[11px] text-brand-primary opacity-30">{fmtDate(r.createdAt)}</span>
                    </div>
                  </div>
                  {canModify(r) && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditing(r)}
                        className="p-1.5 rounded text-brand-primary opacity-30 hover:opacity-70 transition-opacity"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="p-1.5 rounded text-brand-primary opacity-30 hover:opacity-70 hover:text-negative-strong transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </button>
                {expanded === r.id && (
                  <div className="px-10 pb-4 border-t border-[rgba(50,43,95,0.06)] pt-3 space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide mb-1">Description</p>
                      <div className="text-[13px] text-brand-primary leading-relaxed prose-sm [&_a]:text-brand-secondary-600 [&_a]:underline [&_img]:max-w-full [&_img]:rounded-sm">
                        <ReactMarkdown>{r.description}</ReactMarkdown>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide mb-1">Pain to solve</p>
                      <p className="text-[13px] text-brand-primary opacity-80 leading-relaxed whitespace-pre-wrap">{r.painToSolve}</p>
                    </div>
                    <p className="text-[11px] text-brand-primary opacity-30">
                      Reported by {shortName(r.reporter)} on {fmtDate(r.createdAt)}
                      {r.updatedAt !== r.createdAt ? ` · updated ${fmtDate(r.updatedAt)}` : ""}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <FeatureRequestModal
          onSave={(r) => {
            setRequests((prev) => [r, ...prev]);
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editing && (
        <FeatureRequestModal
          item={editing}
          onSave={(r) => {
            setRequests((prev) => prev.map((x) => (x.id === r.id ? r : x)));
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
