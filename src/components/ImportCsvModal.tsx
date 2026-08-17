"use client";
import { useState } from "react";
import { Upload, Check, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { parseCsv } from "@/lib/csv";

interface ImportResult {
  imported: number;
  errors: string[];
}

interface ImportCsvModalProps {
  /** Matches the /api/import handler's expected row shape. */
  type: "questions" | "feedback";
  title: string;
  /** Expected column order, shown so the user can sanity-check their export. */
  columns: string;
  onClose: () => void;
  /** Called after a successful import so the caller can refresh its list. */
  onImported?: (count: number) => void;
}

export function ImportCsvModal({ type, title, columns, onClose, onImported }: ImportCsvModalProps) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError("");
    setResult(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        throw new Error("That file has no data rows below the header.");
      }

      // Drop the header row — the importer maps by column position.
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, rows: rows.slice(1) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Import failed (${res.status})`);

      setResult(data);
      if (data.imported > 0) onImported?.(data.imported);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      e.target.value = ""; // allow re-picking the same file after a fix
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-lg shadow-lg w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(50,43,95,0.1)]">
          <h2 className="text-[16px] font-bold text-brand-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-brand-primary opacity-40 hover:opacity-80 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-[13px] text-brand-primary opacity-60 leading-relaxed">
              Export the relevant tab from Google Sheets (File → Download → CSV), then pick it here.
              Rows are matched on content, so re-importing the same file won&apos;t create duplicates.
            </p>
            <p className="text-[12px] text-brand-primary opacity-40 mt-2">
              Expected columns, in order: {columns}
            </p>
          </div>

          {result ? (
            <div className="rounded-md border border-[rgba(15,110,86,0.2)] bg-mint-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-strong shrink-0" />
                <p className="text-[14px] text-brand-primary font-medium">
                  Imported {result.imported} row{result.imported === 1 ? "" : "s"}
                </p>
              </div>
              {result.errors.length > 0 && (
                <p className="text-[12px] text-brand-primary opacity-60 mt-1.5">
                  {result.errors.length} row{result.errors.length === 1 ? "" : "s"} skipped —{" "}
                  {result.errors[0]}
                </p>
              )}
            </div>
          ) : (
            <label
              className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-8 transition-colors ${
                busy
                  ? "border-[rgba(50,43,95,0.15)] cursor-wait"
                  : "border-[rgba(50,43,95,0.15)] hover:border-brand-secondary-500 hover:bg-[rgba(93,7,226,0.02)] cursor-pointer"
              }`}
            >
              <Upload className="w-5 h-5 text-brand-primary opacity-40" />
              <span className="text-[14px] font-medium text-brand-primary">
                {busy ? `Importing ${fileName}…` : "Choose a CSV file"}
              </span>
              <input type="file" accept=".csv,text/csv" onChange={handleFile} disabled={busy} className="hidden" />
            </label>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(50,43,95,0.1)]">
          {result ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => { setResult(null); setError(""); }}>
                Import another
              </Button>
              <Button size="sm" onClick={onClose}>Done</Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          )}
        </div>
      </div>
    </div>
  );
}
