"use client";
import { useState } from "react";
import { Upload, AlertCircle, X, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface NewAccount {
  rawName: string;
  name: string;
  aliases: string[];
}

interface Preview {
  asOf: string;
  reportRows: number;
  matched: number;
  newAccounts: NewAccount[];
  dropped: string[];
  returning: string[];
  unchanged: number;
  fieldChanges: Record<string, number>;
  created?: number;
  updated?: number;
}

interface ImportReportModalProps {
  onClose: () => void;
  /** Called once the report has been applied, so the table can reload. */
  onImported: () => void;
}

/** Field keys the API counts, in the order worth reading them. */
const FIELD_LABELS: Record<string, string> = {
  health: "health",
  arr: "ARR",
  carr: "CARR",
  products: "products",
  renewalDate: "renewal date",
  csmName: "CSM",
  accountOwner: "account owner",
  ehr: "EHR",
  segment: "segment",
  riskMembers: "risk members",
  qualityMembers: "quality members",
  hieMembers: "HIE members",
  billingState: "billing state",
  lastActivityAt: "last activity",
  firstClosedWon: "first closed won",
};

export function ImportReportModal({ onClose, onImported }: ImportReportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState<Preview | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  /**
   * One call for both passes. The file goes up each time, because the endpoint
   * keeps nothing between preview and apply — and it reads .xlsx and .csv the
   * same way, so there is nothing to parse here.
   */
  async function send(picked: File, date: string, apply: boolean) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", picked);
      form.set("asOf", date);
      form.set("apply", String(apply));
      if (apply) {
        form.set(
          "newAccounts",
          JSON.stringify(
            (preview?.newAccounts ?? []).map((n) => ({
              rawName: n.rawName,
              name: names[n.rawName] ?? n.name,
              aliases: n.aliases,
            })),
          ),
        );
      }

      const res = await fetch("/api/accounts/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        // Two rows onto one client is the one failure worth spelling out, since
        // it names which rows to go and fix in the report.
        throw new Error(
          data.duplicateTargets
            ? `${data.error} ${Object.entries(data.duplicateTargets)
                .map(([t, raws]) => `${(raws as string[]).join(" and ")} both look like ${t}`)
                .join("; ")}`
            : (data.error ?? `Request failed (${res.status})`),
        );
      }
      setPreview(data);
      if (apply) {
        setApplied(true);
        onImported();
      } else {
        setNames(Object.fromEntries((data.newAccounts ?? []).map((n: NewAccount) => [n.rawName, n.name])));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked after a fix
    if (!picked) return;
    setFileName(picked.name);
    setFile(picked);
    setError("");
    setPreview(null);
    setApplied(false);
    // These exports are named for their date, which saves retyping it.
    const dated = picked.name.match(/\d{4}-\d{2}-\d{2}/);
    const date = dated ? dated[0] : asOf;
    setAsOf(date);
    await send(picked, date, false);
  }

  const movedFields = Object.entries(preview?.fieldChanges ?? {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[rgba(50,43,95,0.1)]">
          <h2 className="text-[16px] font-bold text-brand-primary">
            {applied ? "Report applied" : "Upload accounts report"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-brand-primary opacity-40 hover:opacity-80 transition-opacity"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {!preview && (
            <>
              <p className="text-[13px] text-brand-primary opacity-60 leading-relaxed">
                The Salesforce accounts report, straight from the export —{" "}
                <span className="font-medium">.xlsx or .csv</span>, no converting. Columns are read
                by name, so the export can be in any order; it just needs its own header row, with{" "}
                <span className="font-medium">Account Name</span> among the columns.
              </p>
              <label
                className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-8 transition-colors ${
                  busy
                    ? "border-[rgba(50,43,95,0.15)] cursor-wait"
                    : "border-[rgba(50,43,95,0.15)] hover:border-brand-secondary-500 hover:bg-[rgba(93,7,226,0.02)] cursor-pointer"
                }`}
              >
                <Upload className="w-5 h-5 text-brand-primary opacity-40" />
                <span className="text-[14px] font-medium text-brand-primary">
                  {busy ? `Reading ${fileName}…` : "Choose a report file"}
                </span>
                <span className="text-[12px] text-brand-primary opacity-40">.xlsx or .csv</span>
                <input
                  type="file"
                  accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFile}
                  disabled={busy}
                  className="hidden"
                />
              </label>
            </>
          )}

          {preview && (
            <>
              {applied ? (
                <div className="rounded-md border border-[rgba(15,110,86,0.2)] bg-mint-100 px-4 py-3">
                  <p className="text-[14px] text-brand-primary font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    {preview.updated} client{preview.updated === 1 ? "" : "s"} updated
                    {preview.created ? `, ${preview.created} added` : ""} from the {preview.asOf} report
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-[rgba(50,43,95,0.12)] px-4 py-3">
                  <p className="text-[13px] text-brand-primary">
                    <span className="font-semibold">{preview.reportRows} rows</span> in{" "}
                    {fileName || "the report"} — {preview.matched} existing client
                    {preview.matched === 1 ? "" : "s"},{" "}
                    {preview.newAccounts.length} new.{" "}
                    {preview.unchanged > 0 && (
                      <span className="opacity-50">{preview.unchanged} unchanged.</span>
                    )}
                  </p>
                </div>
              )}

              <div>
                <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1">
                  Report date
                </p>
                {applied ? (
                  <p className="text-[14px] text-brand-primary">{preview.asOf}</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={asOf}
                      onChange={(e) => setAsOf(e.target.value)}
                      className="h-10 rounded-sm bg-white border border-black/15 px-3 text-sm text-brand-primary focus:outline-none focus:border-brand-secondary-500"
                    />
                    <span className="text-[12px] text-brand-primary opacity-50">
                      Stamped on every client in the file. Anything not in it keeps its old figures
                      and is marked as of its last report.
                    </span>
                  </div>
                )}
              </div>

              {movedFields.length > 0 && (
                <div>
                  <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1.5">
                    What moves
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {movedFields.map(([field, n]) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[12px] bg-surface-app text-brand-primary border border-black/10"
                      >
                        <span className="font-semibold tabular-nums">{n}</span>
                        {FIELD_LABELS[field] ?? field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {preview.newAccounts.length > 0 && (
                <div>
                  <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1.5">
                    New clients — check the names before applying
                  </p>
                  <div className="space-y-2">
                    {preview.newAccounts.map((n) => (
                      <div key={n.rawName} className="rounded-md border border-[rgba(50,43,95,0.1)] px-3 py-2.5">
                        <p className="text-[12px] text-brand-primary opacity-50 truncate" title={n.rawName}>
                          {n.rawName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <ArrowRight className="w-3.5 h-3.5 shrink-0 text-brand-primary opacity-30" />
                          {applied ? (
                            <p className="text-[14px] font-semibold text-brand-primary">
                              {names[n.rawName] ?? n.name}
                            </p>
                          ) : (
                            <Input
                              value={names[n.rawName] ?? n.name}
                              onChange={(e) => setNames((p) => ({ ...p, [n.rawName]: e.target.value }))}
                              className="w-full"
                            />
                          )}
                        </div>
                        {n.aliases.length > 0 && (
                          <p className="text-[11px] text-brand-primary opacity-40 mt-1">
                            also recorded as {n.aliases.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preview.dropped.length > 0 && (
                <div>
                  <p className="text-[11px] text-brand-primary opacity-40 uppercase tracking-wide mb-1.5">
                    Not in this report — kept, with their last known figures
                  </p>
                  <p className="text-[13px] text-brand-primary opacity-60">
                    {preview.dropped.join(", ")}
                  </p>
                </div>
              )}

              {preview.returning.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[13px] text-amber-900">
                    {preview.returning.join(", ")}{" "}
                    {preview.returning.length === 1 ? "is archived but is" : "are archived but are"} in
                    this report. Their figures update, but they stay archived — restore them from the
                    client panel if they&rsquo;re active again.
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgba(50,43,95,0.1)]">
          {applied ? (
            <Button size="sm" onClick={onClose}>Done</Button>
          ) : preview ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => { setPreview(null); setError(""); }}>
                Pick another file
              </Button>
              <Button size="sm" loading={busy} onClick={() => file && send(file, asOf, true)}>
                Apply to {preview.reportRows} client{preview.reportRows === 1 ? "" : "s"}
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          )}
        </div>
      </div>
    </div>
  );
}
