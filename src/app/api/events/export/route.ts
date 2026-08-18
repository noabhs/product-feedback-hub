import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACTION_LABELS } from "@/lib/events";
import { eventFiltersFrom, eventWhere, matchesEventSearch } from "@/lib/event-filters";

function esc(val: string | null | undefined): string {
  if (!val) return "";
  const s = String(val).replace(/"/g, '""');
  return /[",\n\r]/.test(s) ? `"${s}"` : s;
}

/**
 * The whole log as CSV, with the same filters the table has but none of its row
 * cap — the point of the export is to get past the 600 the page will render.
 */
export async function GET(req: NextRequest) {
  const filters = eventFiltersFrom(req.nextUrl.searchParams);
  const rows = (
    await prisma.event.findMany({
      where: eventWhere(filters),
      orderBy: { createdAt: "desc" },
      select: { actor: true, action: true, label: true, target: true, createdAt: true },
    })
  ).filter((r) => matchesEventSearch(r, filters.search));

  const headers = ["When (UTC)", "Who", "Action", "Action key", "Detail", "Target"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.createdAt.toISOString(),
        esc(r.actor),
        esc(ACTION_LABELS[r.action] ?? r.action),
        esc(r.action),
        esc(r.label),
        esc(r.target),
      ].join(","),
    ),
  ];

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="navina-event-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
