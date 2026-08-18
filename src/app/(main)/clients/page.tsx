"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { RowCount } from "@/components/ui/RowCount";
import { AccountRow } from "@/components/clients/AccountRow";
import { AccountPanel } from "@/components/clients/AccountPanel";
import { HEALTH_ORDER, PRODUCTS, SEGMENTS, REPORT_AS_OF } from "@/lib/accounts";
import { money } from "@/lib/format";
import type { AccountDetail } from "@/lib/types";

type SortKey = "name" | "health" | "products" | "ehr" | "segment" | "liveDate" | "feedbackCount";

// Order here drives the header; AccountRow renders its cells to match.
const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Account" },
  { key: "health", label: "Health" },
  { key: "products", label: "Active products" },
  { key: "ehr", label: "EHR" },
  { key: "segment", label: "Segment" },
  { key: "liveDate", label: "Live date" },
  { key: "feedbackCount", label: "Feedback" },
];

/**
 * Options for a filter whose vocabulary comes from the data rather than a fixed
 * list — a new EHR in the next report shows up without a code change. A picked
 * value stays listed even once nothing on screen carries it, so a filter can
 * always be untangled.
 */
function optionsFrom(
  accounts: AccountDetail[],
  pick: (a: AccountDetail) => string | null,
  chosen: string[],
): { value: string; label: string }[] {
  const present = new Set(accounts.map(pick).filter((v): v is string => !!v));
  for (const c of chosen) present.add(c);
  return [...present].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v }));
}

async function fetchAccounts(): Promise<AccountDetail[]> {
  const res = await fetch("/api/accounts?detail=1");
  if (!res.ok) return [];
  const data = await res.json();
  return data.accounts ?? [];
}

export default function ClientsPage() {
  const [accounts, setAccounts] = useState<AccountDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Each filter holds every picked value; empty means "all".
  const [health, setHealth] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [ehr, setEhr] = useState<string[]>([]);
  const [segment, setSegment] = useState<string[]>([]);
  const [csm, setCsm] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [panelId, setPanelId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setAccounts(await fetchAccounts());
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetched in an async closure so nothing is set synchronously during the
    // effect, and ignored if the page unmounts mid-request.
    let cancelled = false;
    (async () => {
      const list = await fetchAccounts();
      if (!cancelled) {
        setAccounts(list);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const ehrOptions = useMemo(() => optionsFrom(accounts, (a) => a.ehr, ehr), [accounts, ehr]);
  const csmOptions = useMemo(() => optionsFrom(accounts, (a) => a.csmName, csm), [accounts, csm]);

  const healthOptions = HEALTH_ORDER.map((h) => ({ value: h, label: h }));
  const productOptions = PRODUCTS.map((p) => ({ value: p, label: p }));
  const segmentOptions = SEGMENTS.map((s) => ({ value: s, label: s }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (health.length && !(a.health && health.includes(a.health))) return false;
      // Any picked product counts — an account on Risk shows under a Risk filter
      // whether or not it also runs Quality.
      if (products.length && !a.products.some((p) => products.includes(p))) return false;
      if (ehr.length && !(a.ehr && ehr.includes(a.ehr))) return false;
      if (segment.length && !(a.segment && segment.includes(a.segment))) return false;
      if (csm.length && !(a.csmName && csm.includes(a.csmName))) return false;
      if (!q) return true;
      // Owner and CSM included so "who does Zeshan cover" is one search away.
      return (
        a.name.toLowerCase().includes(q) ||
        (a.accountOwner?.toLowerCase().includes(q) ?? false) ||
        (a.csmName?.toLowerCase().includes(q) ?? false) ||
        (a.billingState?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [accounts, search, health, products, ehr, segment, csm]);

  // Sorted client-side — 95 rows are all loaded, so this is instant.
  const displayed = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;

    // Empty values always sort last regardless of direction, so the accounts the
    // report didn't cover don't bury the ones that have data.
    const rank = (a: AccountDetail): string | number | null => {
      switch (sortKey) {
        case "name": return a.name.toLowerCase();
        // By severity, not alphabetically: ascending puts Red first.
        case "health": return a.health ? HEALTH_ORDER.indexOf(a.health as (typeof HEALTH_ORDER)[number]) : null;
        case "products": return a.products.length || null;
        case "ehr": return a.ehr?.toLowerCase() ?? null;
        case "segment": return a.segment?.toLowerCase() ?? null;
        case "liveDate": return a.liveDate ? new Date(a.liveDate).getTime() : null;
        case "feedbackCount": return a.feedbackCount || null;
      }
    };

    return [...filtered].sort((x, y) => {
      const xv = rank(x);
      const yv = rank(y);
      if (xv === null && yv === null) return x.name.localeCompare(y.name);
      if (xv === null) return 1;
      if (yv === null) return -1;
      if (typeof xv === "number" && typeof yv === "number") {
        return (xv - yv) * dir || x.name.localeCompare(y.name);
      }
      return String(xv).localeCompare(String(yv)) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  // Same column toggles direction; a new column starts descending for the
  // counts and the date (most / newest first) and ascending for everything else,
  // which for health means worst first.
  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "feedbackCount" || key === "products" || key === "liveDate" ? "desc" : "asc");
    }
  };

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

  // Patched in place rather than refetching the whole list, so saving a live
  // date doesn't reset the scroll position or reshuffle a sort mid-read.
  const handleLiveDateSaved = (id: string, liveDate: string | null) =>
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, liveDate } : a)));

  // Derived rather than stored, so an edit made in the panel is reflected there.
  const panelAccount = panelId ? accounts.find((a) => a.id === panelId) ?? null : null;

  const hasFilters =
    !!search || !!health.length || !!products.length || !!ehr.length || !!segment.length || !!csm.length;

  // Headline numbers over whatever is on screen, so they follow the filters.
  const summary = useMemo(() => {
    const withHealth = displayed.filter((a) => a.health);
    return {
      red: withHealth.filter((a) => a.health === "Red").length,
      yellow: withHealth.filter((a) => a.health === "Yellow").length,
      green: withHealth.filter((a) => a.health === "Green").length,
      arr: displayed.reduce((sum, a) => sum + (a.arr ?? 0), 0),
    };
  }, [displayed]);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Clients</h1>
            <p className="text-[14px] text-brand-primary opacity-50 max-w-2xl">
              The canonical account list — new feedback can only point at a client on it, so the same
              account stops arriving under three spellings. Health, products, EHR, segment and
              contract figures are a snapshot of the Salesforce accounts report from {REPORT_AS_OF}.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[13px] text-red-700">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-[13px] text-red-700 opacity-60 hover:opacity-100 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
          <MultiSelect value={health} onChange={setHealth} options={healthOptions} placeholder="All health" className="w-36" />
          <MultiSelect value={products} onChange={setProducts} options={productOptions} placeholder="All products" className="w-44" />
          <MultiSelect value={ehr} onChange={setEhr} options={ehrOptions} placeholder="All EHRs" className="w-40" />
          <MultiSelect value={segment} onChange={setSegment} options={segmentOptions} placeholder="All segments" className="w-44" />
          <MultiSelect value={csm} onChange={setCsm} options={csmOptions} placeholder="All CSMs" className="w-40" />
          {hasFilters && (
            <Button
              variant="text"
              size="sm"
              onClick={() => { setSearch(""); setHealth([]); setProducts([]); setEhr([]); setSegment([]); setCsm([]); }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {!loading && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
            <RowCount shown={displayed.length} total={accounts.length} noun="clients" />
            <div className="flex items-center gap-3 text-[12px] text-brand-primary opacity-60">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />{summary.red} red
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{summary.yellow} yellow
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{summary.green} green
              </span>
            </div>
            {summary.arr > 0 && (
              <span className="text-[12px] text-brand-primary opacity-60">
                {money(summary.arr)} ARR
              </span>
            )}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 bg-white rounded-md animate-pulse border border-[rgba(50,43,95,0.08)]" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-brand-primary opacity-40 text-[15px]">
              {search ? `No clients match "${search}"` : "No clients match these filters"}
            </p>
            <p className="text-brand-primary opacity-30 text-[13px] mt-1">
              Try clearing a filter, or add the client below
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-[rgba(50,43,95,0.08)] overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(50,43,95,0.1)] bg-[rgba(50,43,95,0.03)]">
                  {COLUMNS.map((col) => {
                    const active = sortKey === col.key;
                    return (
                      <th key={col.key} className="text-left py-0 px-0">
                        <button
                          onClick={() => toggleSort(col.key)}
                          aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                          className={`w-full flex items-center gap-1 py-3 px-4 text-[12px] font-semibold uppercase tracking-wide transition-colors ${
                            active
                              ? "text-brand-secondary-600 opacity-100"
                              : "text-brand-primary opacity-60 hover:opacity-90"
                          }`}
                          title={`Sort by ${col.label}`}
                        >
                          {col.label}
                          {active ? (
                            sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3 opacity-20" />
                          )}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {displayed.map((a) => (
                  <AccountRow key={a.id} account={a} onOpen={(acct) => setPanelId(acct.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add — below the table now that the table is the point of the page. */}
        <section className="mt-6">
          <h2 className="text-[13px] font-bold text-brand-primary mb-1">Add a client</h2>
          <p className="text-[12px] text-brand-primary opacity-50 mb-3">
            Adds the name to every feedback form. The report data above only arrives with the next
            accounts report, so a client added here shows blank columns until then.
          </p>
          <div className="flex items-center gap-2 max-w-md">
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
        </section>
      </div>

      {panelAccount && (
        <AccountPanel
          key={panelAccount.id}
          account={panelAccount}
          onLiveDateSaved={handleLiveDateSaved}
          onClose={() => setPanelId(null)}
        />
      )}
    </div>
  );
}
