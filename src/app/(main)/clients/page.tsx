"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RowCount } from "@/components/ui/RowCount";

interface Proposal {
  from: string;
  to: string | null;
  count: number;
}

interface RemapResponse {
  proposals?: Proposal[];
  pending?: number;
}

async function fetchAll(): Promise<{ list: string[]; remap: RemapResponse }> {
  const [list, remap] = await Promise.all([
    fetch("/api/accounts").then((r) => (r.ok ? r.json() : [])),
    fetch("/api/accounts/remap").then((r) => (r.ok ? r.json() : {})),
  ]);
  return { list, remap };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<string[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const applyData = useCallback((d: { list: string[]; remap: RemapResponse }) => {
    setClients(d.list);
    setProposals(d.remap.proposals ?? []);
    // No spinner on refreshes: `loading` starts true for the first paint, and
    // later reloads are covered by the acting button's own spinner.
    setLoading(false);
  }, []);

  const load = useCallback(async () => applyData(await fetchAll()), [applyData]);

  useEffect(() => {
    // Fetched in an async closure so nothing is set synchronously during the
    // effect, and ignored if the page unmounts mid-request.
    let cancelled = false;
    (async () => {
      const data = await fetchAll();
      if (!cancelled) applyData(data);
    })();
    return () => { cancelled = true; };
  }, []);

  async function addClient() {
    const name = draft.trim();
    if (!name) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't add that client");
      setDraft("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function apply() {
    setApplying(true);
    setError("");
    try {
      const res = await fetch("/api/accounts/remap", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "The remap failed");
      setApplied(`${data.changed} ${data.changed === 1 ? "entry" : "entries"} updated across ${data.values} values`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApplying(false);
    }
  }

  // Only renames are applied; unmatched values are left untouched, so they
  // mustn't be counted in the Apply button.
  const changes = proposals.filter((p) => p.to !== null && p.from !== p.to);
  const unmatched = proposals.filter((p) => p.to === null);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Clients</h1>
        <p className="text-[14px] text-brand-primary opacity-50 mb-8">
          The canonical account list. New feedback can only point at a client on this list, so the
          same account stops arriving under three spellings. Existing values that don&apos;t match are
          left alone until you decide where they belong.
        </p>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
        )}

        {/* ── Remap ─────────────────────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-[16px] font-bold text-brand-primary">Historical values</h2>
              <p className="text-[13px] text-brand-primary opacity-50">
                Renames applied to the client field on existing feedback. Nothing changes until you
                apply, and values with no match are left exactly as they are.
              </p>
            </div>
            {changes.length > 0 && (
              <Button size="sm" loading={applying} onClick={apply}>
                <Check className="w-4 h-4" />
                Apply {changes.length} {changes.length === 1 ? "change" : "changes"}
              </Button>
            )}
          </div>

          {applied && (
            <div className="mb-3 rounded-md border border-[rgba(15,110,86,0.25)] bg-[rgba(15,110,86,0.06)] px-4 py-3">
              <p className="text-[13px] text-positive-strong">{applied}</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-11 bg-white rounded-md animate-pulse border border-[rgba(50,43,95,0.08)]" />
              ))}
            </div>
          ) : changes.length === 0 ? (
            <div className="bg-white rounded-md border border-[rgba(50,43,95,0.08)] px-4 py-8 text-center">
              <p className="text-[14px] text-brand-primary opacity-40">
                Every stored client already matches the list — nothing to remap.
              </p>
            </div>
          ) : (
            <>
              <RowCount shown={changes.length} total={proposals.length} noun="values" className="mb-2" />
              <div className="bg-white rounded-md border border-[rgba(50,43,95,0.08)] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(50,43,95,0.1)] bg-[rgba(50,43,95,0.03)]">
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide">Currently stored</th>
                      <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide">Becomes</th>
                      <th className="text-right py-2.5 px-4 text-[11px] font-semibold text-brand-primary opacity-50 uppercase tracking-wide">Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changes.map((p) => (
                      <tr key={p.from} className="border-b border-[rgba(50,43,95,0.06)] last:border-0">
                        <td className="py-2.5 px-4 text-[13px] text-brand-primary">{p.from}</td>
                        <td className="py-2.5 px-4 text-[13px]">
                          <span className="inline-flex items-center gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-brand-primary opacity-25" />
                            {p.to ? (
                              <span className="text-brand-primary font-medium">{p.to}</span>
                            ) : (
                              <span className="text-brand-primary opacity-40 italic">
                                no match — left as-is
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[13px] text-brand-primary opacity-50 text-right">{p.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[12px] text-brand-primary opacity-40">
                The original text is kept on each entry, so a wrong match can be traced back.
              </p>
            </>
          )}
          {unmatched.length > 0 && !loading && (
            <p className="mt-2 text-[12px] text-brand-primary opacity-40">
              {unmatched.length} {unmatched.length === 1 ? "value has" : "values have"} no match and
              {unmatched.length === 1 ? " is" : " are"} left untouched. Add the account below (or as
              an alias of an existing one) and these will match on the next pass.
            </p>
          )}
        </section>

        {/* ── The list ──────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-[16px] font-bold text-brand-primary mb-1">
            The list <span className="font-normal opacity-40">({clients.length})</span>
          </h2>
          <p className="text-[13px] text-brand-primary opacity-50 mb-3">
            Add a client here and it becomes pickable on every feedback form.
          </p>

          <div className="flex items-center gap-2 mb-4 max-w-md">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addClient()}
              placeholder="New client name"
              className="w-full"
            />
            <Button size="sm" loading={adding} onClick={addClient} disabled={!draft.trim()}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>

          <div className="bg-white rounded-md border border-[rgba(50,43,95,0.08)] p-4">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 md:grid-cols-3">
              {clients.map((c) => (
                <li key={c} className="text-[13px] text-brand-primary truncate" title={c}>{c}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
