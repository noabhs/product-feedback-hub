export interface TrendDay {
  key: string;
  label: string;
  views: number;
  actions: number;
}

/** Bars stay bar-shaped: across 14 columns of a full-width card, flex-1 alone
 *  gives each one ~130px, which reads as a block rather than a bar. */
const BAR_MAX = "max-w-[26px]";

/**
 * A round number above the busiest day, so the axis reads cleanly and the tallest
 * bar stops short of the top gridline instead of merging into it.
 */
function niceCeiling(max: number): number {
  const floor = Math.max(max, 4);
  const step = floor <= 10 ? 2 : floor <= 50 ? 5 : floor <= 200 ? 25 : 100;
  return Math.ceil((floor + 1) / step) * step;
}

/**
 * Daily activity, split into actions and page views.
 *
 * Built for the sparse case, because that's the normal one here: a hub used a
 * few times a week has mostly-empty days, and the first version drew literally
 * nothing for those — no baseline, no tick, no date — so a quiet fortnight with
 * one busy day looked like a broken chart rather than a quiet fortnight. Every
 * day now gets a visible slot, a stub at the baseline when it's zero, and a
 * date under it.
 */
export function ActivityChart({ trend, max }: { trend: TrendDay[]; max: number }) {
  const ceiling = niceCeiling(max);

  return (
    <div className="mt-2">
      <div className="flex gap-3">
        {/* Y axis: just the ceiling and the floor — a busier axis earns nothing here. */}
        <div className="flex flex-col justify-between h-36 shrink-0 text-[10px] text-brand-primary opacity-30 tabular-nums text-right w-4">
          <span>{ceiling}</span>
          <span>0</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative h-36">
            {/* Gridlines at the ceiling and the midpoint, behind the bars. */}
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-[rgba(50,43,95,0.09)]" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[rgba(50,43,95,0.06)]" />

            <div className="relative h-full flex items-stretch gap-1.5">
              {trend.map((t) => {
                const total = t.views + t.actions;
                return (
                  <div key={t.key} className="flex-1 h-full flex flex-col justify-end items-center group">
                    <span className="text-[10px] text-brand-primary opacity-0 group-hover:opacity-60 transition-opacity tabular-nums leading-none mb-1">
                      {total || ""}
                    </span>
                    {total > 0 ? (
                      <div
                        className={`w-full ${BAR_MAX} flex flex-col justify-end rounded-t-[3px] overflow-hidden`}
                        // Percentages need a definite parent height to resolve
                        // against, which is what h-36 above provides.
                        style={{ height: `${Math.max((total / ceiling) * 100, 3)}%` }}
                        title={`${t.label}: ${t.actions} ${t.actions === 1 ? "action" : "actions"}, ${t.views} ${t.views === 1 ? "view" : "views"}`}
                      >
                        <div style={{ flex: t.actions || 0, background: "#5d07e2", minHeight: t.actions ? 2 : 0 }} />
                        <div style={{ flex: t.views || 0, background: "#00c2b2", minHeight: t.views ? 2 : 0 }} />
                      </div>
                    ) : (
                      // A quiet day is a fact, not an absence — so it gets a stub
                      // rather than blank space.
                      <div
                        className={`w-full ${BAR_MAX} h-[3px] rounded-t-[2px] bg-[rgba(50,43,95,0.10)]`}
                        title={`${t.label}: nothing logged`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Baseline, so the bars sit on something. */}
          <div className="border-t border-[rgba(50,43,95,0.15)]" />

          {/*
            Every other date — 14 labels at this width would collide — counted
            from the right so the most recent day is always labelled. Counting
            from the left dropped it, which on a quiet fortnight meant the one
            bar on the chart had no date under it.
          */}
          <div className="flex gap-1.5 mt-1.5">
            {trend.map((t, i) => (
              <span
                key={t.key}
                className="flex-1 text-center text-[10px] text-brand-primary opacity-35 tabular-nums truncate"
              >
                {(trend.length - 1 - i) % 2 === 0 ? t.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
