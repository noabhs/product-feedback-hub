"use client";
import { useRef } from "react";
import { FileText, Paperclip, X } from "lucide-react";

export const ACCEPT = ".pdf,.txt,.md,.markdown,.csv,.tsv,.json,application/pdf,text/*";
const MAX_BYTES = 3 * 1024 * 1024;
export const MAX_FILES = 3;

/** The reason a file can't be attached, or null. Mirrors lib/ask-documents.ts so the error shows before an upload. */
export function fileProblem(f: File): string | null {
  const ok = /\.(pdf|txt|md|markdown|csv|tsv|json)$/i.test(f.name) || f.type === "application/pdf" || f.type.startsWith("text/");
  if (!ok) return "Q can read PDF, TXT, MD, CSV and JSON files. For Word, save it as PDF first.";
  if (f.size > MAX_BYTES) return `${f.name} is over 3 MB.`;
  return null;
}

/** The paperclip: opens the file picker and hands back what was chosen. */
export function AttachButton({
  onPick,
  disabled,
  className = "",
}: {
  onPick: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        multiple
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          onPick(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={disabled}
        aria-label="Attach a document"
        title="Attach a document (PDF, TXT, MD, CSV, JSON)"
        className={`flex shrink-0 items-center justify-center rounded-md text-brand-primary/55 transition-colors hover:bg-[rgba(50,43,95,0.06)] hover:text-brand-secondary-600 disabled:opacity-40 ${className}`}
      >
        <Paperclip className="h-4 w-4" />
      </button>
    </>
  );
}

export function FileChips({
  files,
  onRemove,
}: {
  files: { key: string; name: string; busy?: boolean }[];
  onRemove?: (key: string) => void;
}) {
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {files.map((f) => (
        <span
          key={f.key}
          className={`inline-flex max-w-full items-center gap-1.5 rounded-pill border border-[rgba(50,43,95,0.12)] bg-white py-1 pl-2.5 pr-1.5 text-[12px] text-brand-primary/80 ${f.busy ? "opacity-60" : ""}`}
        >
          <FileText className="h-3.5 w-3.5 shrink-0 text-brand-secondary-500" />
          <span className="truncate">{f.name}</span>
          {onRemove && !f.busy && (
            <button type="button" onClick={() => onRemove(f.key)} aria-label={`Remove ${f.name}`} className="rounded-full p-0.5 hover:bg-[rgba(50,43,95,0.08)]">
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
