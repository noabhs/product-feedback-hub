import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEvent, ACTIONS } from "@/lib/events";

/**
 * Edit the fields that don't come from Salesforce. Live date is the only one:
 * it isn't on the accounts report, so it's typed in from the client panel, and
 * a PATCH keeps that from being a reason to hand-edit the database.
 *
 * Deliberately narrow — health, ARR and the rest are a report snapshot, and
 * letting them be edited here would leave the page disagreeing with Salesforce
 * with no way to tell which value came from where.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (!("liveDate" in body)) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const raw = body.liveDate;
  let liveDate: Date | null = null;
  if (raw !== null && raw !== "") {
    if (typeof raw !== "string") {
      return NextResponse.json({ error: "Live date must be a date" }, { status: 400 });
    }
    // Parsed as UTC noon so a date-only value can't shift a day either way when
    // it's rendered back in a timezone behind or ahead of UTC.
    liveDate = new Date(`${raw.slice(0, 10)}T12:00:00.000Z`);
    if (Number.isNaN(liveDate.getTime())) {
      return NextResponse.json({ error: `"${raw}" isn't a date` }, { status: 400 });
    }
  }

  const existing = await prisma.account.findUnique({ where: { id }, select: { name: true } });
  if (!existing) {
    return NextResponse.json({ error: "No such client" }, { status: 404 });
  }

  await prisma.account.update({ where: { id }, data: { liveDate } });

  void logEvent(ACTIONS.clientUpdated, {
    label: `${existing.name} live date ${liveDate ? liveDate.toISOString().slice(0, 10) : "cleared"}`,
  });
  return NextResponse.json({ liveDate: liveDate?.toISOString() ?? null });
}
