interface RowCountProps {
  /** Rows currently visible after all filters. */
  shown: number;
  /** Every row that exists, ignoring filters. */
  total: number;
  /** Plural noun for the rows, e.g. "entries". */
  noun: string;
  className?: string;
}

/**
 * Row count above a table. Reads "245 entries" unfiltered and "23/245 entries"
 * once anything narrows the list, so it's obvious at a glance both how much is
 * showing and how much is being hidden.
 */
export function RowCount({ shown, total, noun, className }: RowCountProps) {
  const filtered = shown !== total;

  return (
    <div className={`flex items-baseline gap-1.5 ${className ?? ""}`}>
      <span className="text-[15px] font-semibold text-brand-primary tabular-nums">
        {filtered ? (
          <>
            {shown.toLocaleString()}
            <span className="opacity-35">/{total.toLocaleString()}</span>
          </>
        ) : (
          total.toLocaleString()
        )}
      </span>
      <span className="text-[13px] text-brand-primary opacity-45">{noun}</span>
      {filtered && (
        <span className="text-[12px] text-brand-secondary-600 opacity-80">filtered</span>
      )}
    </div>
  );
}
