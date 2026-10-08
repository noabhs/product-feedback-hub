import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEvent, ACTIONS } from "@/lib/events";
import { normalizeWebsite } from "@/lib/favicon";

/**
 * Edit the fields that don't come from Salesforce: the live date, the website,
 * and whether the client is archived. Neither is in any report, so both are typed in from the
 * client panel, and a PATCH keeps that from being a reason to hand-edit the
 * database — archiving the next dead account shouldn't need a migration.
 *
 * Deliberately narrow — health, ARR and the rest are a report snapshot, and
 * letting them be edited here would leave the page disagreeing with Salesforce
 * with no way to tell which value came from where.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const wantsLiveDate = "liveDate" in body;
  const wantsArchive = "archived" in body;
  const wantsWebsite = "website" in body;
  if (!wantsLiveDate && !wantsArchive && !wantsWebsite) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Stored as a bare origin so the icon lookup gets a hostname whatever was
  // typed. A value that isn't a domain is rejected rather than stored, since a
  // stored typo shows up as a missing icon and nothing else.
  let website: string | null = null;
  if (wantsWebsite && body.website !== null && body.website !== "") {
    if (typeof body.website !== "string") {
      return NextResponse.json({ error: "Website must be a web address" }, { status: 400 });
    }
    website = normalizeWebsite(body.website);
    if (!website) {
      return NextResponse.json({ error: `"${body.website}" isn't a web address` }, { status: 400 });
    }
  }

  const raw = body.liveDate;
  let liveDate: Date | null = null;
  if (wantsLiveDate && raw !== null && raw !== "") {
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

  const existing = await prisma.account.findUnique({
    where: { id },
    select: { name: true, archivedAt: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "No such client" }, { status: 404 });
  }

  if (typeof body.archived !== "boolean" && wantsArchive) {
    return NextResponse.json({ error: "archived must be true or false" }, { status: 400 });
  }

  // Re-archiving an already-archived client keeps its original date rather than
  // resetting it: the useful question is when it stopped being a client, not
  // when someone last clicked the button.
  const archivedAt = wantsArchive
    ? body.archived
      ? existing.archivedAt ?? new Date()
      : null
    : undefined;

  const updated = await prisma.account.update({
    where: { id },
    data: {
      ...(wantsLiveDate ? { liveDate } : {}),
      ...(wantsWebsite ? { website } : {}),
      ...(archivedAt !== undefined ? { archivedAt } : {}),
    },
    select: { liveDate: true, archivedAt: true, website: true },
  });

  if (wantsLiveDate) {
    void logEvent(ACTIONS.clientUpdated, {
      label: `${existing.name} live date ${liveDate ? liveDate.toISOString().slice(0, 10) : "cleared"}`,
    });
  }
  if (wantsWebsite) {
    void logEvent(ACTIONS.clientUpdated, {
      label: `${existing.name} website ${website ?? "cleared"}`,
    });
  }
  if (wantsArchive) {
    void logEvent(body.archived ? ACTIONS.clientArchived : ACTIONS.clientRestored, {
      label: existing.name,
    });
  }

  return NextResponse.json({
    liveDate: updated.liveDate?.toISOString() ?? null,
    archivedAt: updated.archivedAt?.toISOString() ?? null,
    website: updated.website,
  });
}
