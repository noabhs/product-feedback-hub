import Link from "next/link";
import { ArrowUpRight, FileText, Globe } from "lucide-react";
import { clsx } from "clsx";
import type { Resource } from "@/lib/domain/types";

/** Shown on every page of the section until the content has been reviewed. */
export function DraftNotice() {
  return (
    <div className="mb-6 rounded-sm border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900">
      <span className="font-semibold">Draft.</span> This section is being built. Definitions are
      written from public sources and have not been reviewed by a clinical or compliance owner yet.
      Figures that change every year are dated in the text, so check the linked source before relying on one.
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[12px] font-semibold text-brand-primary uppercase tracking-wide opacity-70 mb-3">
      {children}
    </h2>
  );
}

export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-brand-primary/50 mb-4">
      {items.map((it, i) => (
        <span key={it.label} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>/</span>}
          {it.href ? (
            <Link href={it.href} className="hover:text-brand-secondary-500 hover:underline">
              {it.label}
            </Link>
          ) : (
            <span className="text-brand-primary/80">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Internal and external sources are visually separate on purpose: an internal
 * link may need a Navina login, and an external one leaves the hub.
 */
export function ResourceList({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;
  const groups: { kind: Resource["kind"]; label: string; Icon: typeof FileText }[] = [
    { kind: "internal", label: "Navina materials", Icon: FileText },
    { kind: "external", label: "External sources", Icon: Globe },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {groups.map(({ kind, label, Icon }) => {
        const items = resources.filter((r) => r.kind === kind);
        if (items.length === 0) return null;
        return (
          <div key={kind}>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-primary/60 mb-2">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </p>
            <ul className="space-y-2">
              {items.map((r) => (
                <li key={r.url}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-sm bg-white border border-[rgba(50,43,95,0.08)] px-3.5 py-2.5 hover:border-brand-secondary-500/30 hover:shadow-sm transition-all"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[13.5px] font-medium text-brand-primary group-hover:text-brand-secondary-500">
                        {r.title}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                    <span className="block text-[11.5px] text-brand-primary/50 mt-0.5">{r.source}</span>
                    {r.note && <span className="block text-[12.5px] text-brand-primary/70 mt-1">{r.note}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function TopicPill({ title, className }: { title: string; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium bg-lavender text-brand-primary",
        className,
      )}
    >
      {title}
    </span>
  );
}

/** Markdown styling shared by the deep-dive sections. */
export const PROSE =
  "text-[14px] text-brand-primary/85 leading-relaxed " +
  "[&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_strong]:text-brand-primary " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1.5 " +
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1.5 [&_li]:leading-relaxed";
