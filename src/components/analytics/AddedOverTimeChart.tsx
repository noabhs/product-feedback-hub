import { SOURCE_COLORS, type AddedDay } from "@/lib/added-over-time";
import { SOURCE_CATEGORIES, type SourceCategory } from "@/lib/sources";

const BAR_MAX = "max-w-[22px]";

function niceCeiling(max: number): number {
  const floor = Math.max(max, 4);
  const step = floor <= 10 ? 2 : floor <= 50 ? 5 : floor <= 200 ? 25 : 100;
  return Math.ceil((floor + 1) / step) * step;
}

/**
 * Daily additions as stacked bars, one segment per source. Same sparse-data
 * treatment as ActivityChart: a quiet day keeps a stub and a date so it reads
 * as "nothing added" rather than a gap.
 */
export function AddedOverTimeChart({ days }: { days: AddedDay[] }) {
  const max = Math.max(...days.map((d) => d.total), 0);
  const ceiling = niceCeiling(max);

  const totals = new Map<SourceCategory, number>();
  for (const d of days) {
    for (const [s, n] of Object.entries(d.bySource) as [SourceCategory, number][]) {
      totals.set(s, (totals.get(s) ?? 0) + n);
    }
  }
  const legend = SOURCE_CATEGORIES.filter((s) => totals.has(s));

  return (
    <div>
      <div className="flex gap-3">
        <div className="flex flex-col justify-between h-36 shrink-0 text-[10px] text-brand-primary opacity-30 tabular-nums text-right w-5">
          <span>{ceiling}</span>
          <span>0</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="relative h-36">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-[rgba(50,43,95,0.09)]" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[rgba(50,43,95,0.06)]" />
            <div className="relative h-full flex items-stretch gap-[3px]">
              {days.map((d) => (
                <div key={d.key} className="flex-1 h-full flex flex-col justify-end items-center group">
                  {d.total > 0 ? (
                    <div
                      className={`w-full ${BAR_MAX} flex flex-col-reverse rounded-t-[3px] overflow-hidden`}
                      style={{ height: `${Math.max((d.total / ceiling) * 100, 3)}%` }}
                      title={`${d.label}: ${d.total} new${
                        legend
                          .filter((s) => d.bySource[s])
                          .map((s) => `\n${s}: ${d.bySource[s]}`)
                          .join("")
                      }`}
                    >
                      {SOURCE_CATEGORIES.filter((s) => d.bySource[s]).map((s) => (
                        <div key={s} style={{ flex: d.bySource[s], background: SOURCE_COLORS[s], minHeight: 2 }} />
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`w-full ${BAR_MAX} h-[3px] rounded-t-[2px] bg-[rgba(50,43,95,0.10)]`}
                      title={`${d.label}: nothing added`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-[rgba(50,43,95,0.15)]" />
          {/* Every 5th date, counted from the right so today is always labelled. */}
          <div className="flex gap-[3px] mt-1.5">
            {days.map((d, i) => (
              <span
                key={d.key}
                className="flex-1 text-[10px] text-brand-primary opacity-35 tabular-nums whitespace-nowrap overflow-visible text-center"
              >
                {(days.length - 1 - i) % 5 === 0 ? <span className="inline-block -mx-3">{d.label}</span> : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      {legend.length > 0 ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
          {legend.map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-[11px] text-brand-primary opacity-70">
              <span className="w-2 h-2 rounded-sm" style={{ background: SOURCE_COLORS[s] }} />
              {s} <span className="tabular-nums opacity-60">{totals.get(s)}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-brand-primary opacity-40 mt-4">Nothing added in this window.</p>
      )}
    </div>
  );
}
