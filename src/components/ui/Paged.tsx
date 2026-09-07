"use client";
import { Children, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";

/**
 * Ten rows at a time, whatever the rows are.
 *
 * Takes already-rendered children and slices them, so a server component can
 * hand over its rows without a render prop — functions don't cross the
 * server/client boundary.
 *
 * `colSpan` puts the footer in a <tfoot> instead of after the children, which is
 * the only valid place for it when the rows are <tr>.
 */
export function Paged({
  children,
  noun,
  colSpan,
  pageSize = 10,
}: {
  children: React.ReactNode;
  noun: string;
  colSpan?: number;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const items = Children.toArray(children);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = items.slice(start, start + pageSize);

  const footer =
    items.length > pageSize ? (
      <Pagination
        page={current}
        pageCount={pageCount}
        start={start}
        pageSize={pageSize}
        total={items.length}
        noun={noun}
        onPage={setPage}
      />
    ) : null;

  if (colSpan) {
    return (
      <>
        <tbody>{rows}</tbody>
        {footer && (
          <tfoot>
            <tr>
              <td colSpan={colSpan} className="px-0">{footer}</td>
            </tr>
          </tfoot>
        )}
      </>
    );
  }

  return (
    <>
      {rows}
      {footer}
    </>
  );
}
