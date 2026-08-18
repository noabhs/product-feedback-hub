/**
 * The home page's presentational pieces. Split out of the page so the page holds
 * only its queries and layout, and so these can be rendered without a database.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Just a label for the block below. Deliberately not a link: every card in the
 * section carries its own way through, and a section-level link on top of those
 * was three routes to /clients within one heading's reach.
 */
export function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex items-baseline gap-2.5 mb-3">
      <h2 className="text-[12px] font-semibold text-brand-primary uppercase tracking-wide opacity-70">
        {title}
      </h2>
      {note && <span className="text-[11px] text-brand-primary opacity-35">{note}</span>}
    </div>
  );
}

export function KpiCard({
  value, label, sub, Icon, href,
}: {
  value: number;
  label: string;
  sub: string;
  Icon: React.FC<{ className?: string }>;
  href?: string;
}) {
  const inner = (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5 h-full group hover:border-brand-secondary-500/30 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between">
        <Icon className="w-5 h-5 text-brand-primary opacity-30 mb-3 group-hover:opacity-60 transition-opacity" />
        {href && (
          <ArrowRight className="w-3.5 h-3.5 text-brand-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <div className="text-[32px] font-extrabold text-brand-primary leading-none mb-1 tabular-nums">
        {value.toLocaleString("en-US")}
      </div>
      <div className="text-[13px] font-medium text-brand-primary">{label}</div>
      <div className="text-[11px] text-brand-primary opacity-40 mt-0.5">{sub}</div>
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : <div>{inner}</div>;
}

/** A figure that only means something against a total, so it carries its bar. */
export function MeterCard({
  value, label, sub, pct, color, Icon, title, href,
}: {
  value: string;
  label: string;
  sub: string;
  pct: number;
  color: string;
  Icon: React.FC<{ className?: string }>;
  title?: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5 h-full group hover:border-brand-secondary-500/30 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between">
        <Icon className="w-5 h-5 text-brand-primary opacity-30 mb-3 group-hover:opacity-60 transition-opacity" />
        {href && (
          <ArrowRight className="w-3.5 h-3.5 text-brand-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <div className="text-[26px] font-extrabold text-brand-primary leading-none mb-1 tabular-nums" title={title}>
        {value}
      </div>
      <div className="text-[13px] font-medium text-brand-primary">{label}</div>
      <div className="text-[11px] text-brand-primary opacity-40 mt-0.5 mb-3">{sub}</div>
      <div className="h-1.5 bg-[rgba(50,43,95,0.06)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(Math.round(pct * 100), 2))}%`, background: color }}
        />
      </div>
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

export function ChartCard({
  title, note, href, linkLabel, children,
}: {
  title: string;
  /** Small qualifier under the title — where the numbers came from, usually. */
  note?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-[rgba(50,43,95,0.08)] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[14px] font-semibold text-brand-primary">{title}</h2>
          {note && <p className="text-[11px] text-brand-primary opacity-40 mt-0.5">{note}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="text-[12px] text-brand-secondary-500 hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            {linkLabel ?? "View"} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export function BarRow({
  label, count, pct, color, textColor, labelWidth = "w-28",
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
  textColor?: string;
  labelWidth?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-[12px] text-brand-primary opacity-60 ${labelWidth} shrink-0 text-right truncate`} title={label}>
        {label}
      </span>
      <div className="flex-1 h-2 bg-[rgba(50,43,95,0.06)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(Math.round(pct * 100), 3)}%`, background: color }}
        />
      </div>
      <span className="text-[12px] w-6 text-right shrink-0 tabular-nums" style={{ color: textColor ?? "rgba(50,43,95,0.4)" }}>
        {count}
      </span>
    </div>
  );
}
