"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

async function fetchClients(): Promise<string[]> {
  const res = await fetch("/api/accounts");
  return res.ok ? res.json() : [];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => setClients(await fetchClients()), []);

  useEffect(() => {
    // Fetched in an async closure so nothing is set synchronously during the
    // effect, and ignored if the page unmounts mid-request.
    let cancelled = false;
    (async () => {
      const list = await fetchClients();
      if (!cancelled) setClients(list);
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

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Clients</h1>
        <p className="text-[14px] text-brand-primary opacity-50 mb-8">
          The canonical account list. New feedback can only point at a client on this list, so the
          same account stops arriving under three spellings.
        </p>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
        )}

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
