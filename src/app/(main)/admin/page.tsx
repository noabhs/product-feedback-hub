"use client";
import { useState } from "react";
import { Upload, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

export default function AdminPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-[28px] font-extrabold text-brand-primary mb-1">Admin</h1>
      <p className="text-[14px] text-brand-primary opacity-50 mb-8">
        Import data from the Navina feedback spreadsheet. Export each tab as CSV from Google Sheets, then upload here.
      </p>

      <div className="space-y-4">
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
