"use client";
import { useState } from "react";
import Link from "next/link";
import { Upload, Check, AlertCircle, KeyRound, FileText, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useApiKey } from "@/hooks/useApiKey";
import { AddSourceModal } from "@/components/discovery/AddSourceModal";

interface ImportResult {
  imported: number;
  errors: string[];
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    // Simple CSV parse — handles quoted fields
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { cells.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    cells.push(current.trim());
    rows.push(cells);
  }
  return rows;
}

function ImportPanel({ type, label, columns }: { type: "questions" | "feedback"; label: string; columns: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const text = await file.text();
      const rows = parseCsv(text).slice(1); // skip header row
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-[16px] font-semibold text-brand-primary mb-1">{label}</h2>
      <p className="text-[12px] text-brand-primary opacity-50 mb-1">Expected columns: <code className="bg-[#f6f6fa] px-1 rounded text-[11px]">{columns}</code></p>
      <p className="text-[12px] text-brand-primary opacity-50 mb-4">
        Export the relevant sheet tab as CSV from Google Sheets (File → Download → CSV).
      </p>

      <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-pill text-[13px] font-medium cursor-pointer transition-all ${loading ? "opacity-50 pointer-events-none" : ""} bg-brand-secondary-500 text-white hover:bg-brand-secondary-400`}>
        <Upload className="w-3.5 h-3.5" />
        {loading ? "Importing..." : "Upload CSV"}
        <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </label>

      {result && (
        <div className="mt-4 bg-mint-100 rounded-md p-3 flex items-start gap-2">
          <Check className="w-4 h-4 text-positive-strong shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-positive-strong">{result.imported} rows imported</p>
            {result.errors.length > 0 && (
              <p className="text-[11px] text-negative-strong mt-1">{result.errors.length} errors — {result.errors[0]}</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-[#FFE2E2] rounded-md p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-negative-strong shrink-0 mt-0.5" />
          <p className="text-[12px] text-negative-strong">{error}</p>
        </div>
      )}
    </div>
  );
}

function ApiKeyPanel() {
  const { apiKey, saveKey } = useApiKey();
  const [draft, setDraft] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  // Sync draft when apiKey loads from localStorage
  useState(() => { setDraft(apiKey); });

  function handleSave() {
    saveKey(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const isSet = apiKey.startsWith("sk-ant-");

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="w-4 h-4 text-brand-primary opacity-60" />
        <h2 className="text-[16px] font-semibold text-brand-primary">Anthropic API key</h2>
      </div>
      <p className="text-[12px] text-brand-primary opacity-50 mb-4">
        Stored in your browser only — never sent to any server except Anthropic. Get your key at{" "}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="underline">console.anthropic.com</a>.
      </p>

      <div className="flex gap-2">
        <input
          type="password"
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setSaved(false); }}
          placeholder="sk-ant-api03-…"
          className="flex-1 h-9 rounded-sm border border-[rgba(50,43,95,0.2)] px-3 text-[13px] text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:border-brand-secondary-500 font-mono"
        />
        <Button size="sm" onClick={handleSave} disabled={draft === apiKey}>
          {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save"}
        </Button>
        {apiKey && (
          <Button size="sm" variant="ghost" onClick={() => { saveKey(""); setDraft(""); }}>
            Clear
          </Button>
        )}
      </div>

      {isSet && (
        <p className="mt-2 text-[12px] text-positive-strong flex items-center gap-1">
          <Check className="w-3 h-3" /> Key set — AI features will use your personal credits
        </p>
      )}
    </div>
  );
}

function DiscoveryDocsPanel() {
  const [showAdd, setShowAdd] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-6">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-brand-primary opacity-40" />
        <h2 className="text-[16px] font-semibold text-brand-primary">Discovery documents</h2>
      </div>
      <p className="text-[13px] text-brand-primary opacity-50 mb-4 leading-relaxed">
        Register a discovery doc by link so it&apos;s findable in the sources library, then
        optionally have Claude pull candidate questions out of it for review.
      </p>

      {added && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-[rgba(15,110,86,0.2)] bg-mint-100 px-3 py-2.5">
          <Check className="w-4 h-4 text-teal-strong shrink-0" />
          <p className="text-[13px] text-brand-primary">
            Added <span className="font-semibold">{added}</span> to the sources library.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" />
          Add document
        </Button>
        <Link href="/discovery/extract">
          <Button variant="ghost" size="sm">
            <Sparkles className="w-4 h-4" />
            Extract questions from a doc
          </Button>
        </Link>
        <Link href="/discovery">
          <Button variant="text" size="sm">View sources library</Button>
        </Link>
      </div>

      <p className="text-[12px] text-brand-primary opacity-35 mt-3">
        Documents are stored as links, not uploaded copies — so permissions stay with Drive,
        Notion, or wherever the file already lives.
      </p>

      {showAdd && (
        <AddSourceModal
          onSave={(s) => { setAdded(s.name); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Admin</h1>
      <p className="text-[14px] text-brand-primary opacity-50 mb-8">
        Register discovery documents and bulk-import data. CSV imports expect each tab exported from Google Sheets.
      </p>

      <div className="space-y-4">
        <ApiKeyPanel />
        <DiscoveryDocsPanel />
        <ImportPanel
          type="questions"
          label="Import discovery questions"
          columns="Product Area, Theme, Persona, Question, Notes / Intent, Source"
        />
        <ImportPanel
          type="feedback"
          label="Import client feedback"
          columns="Product Area, Theme, Persona / POC, One-liner, Feedback, Date, WTP, Source, Client"
        />
      </div>
    </div>
  );
}
