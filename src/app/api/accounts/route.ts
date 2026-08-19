import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logEvent, ACTIONS } from "@/lib/events";
import { loadAccountDetails } from "@/lib/accounts-db";

/**
 * `?detail=1` returns the full account rows for /clients. Plain GET stays a
 * `string[]` of names, which is what every picker and filter consumes — those
 * would break on a shape change and don't need the extra ~20 fields per row.
 */
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("detail") !== "1") {
    const rows = await prisma.account.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(rows.map((r) => r.name));
  }

  return NextResponse.json({ accounts: await loadAccountDetails() });
}

/** Add a client that isn't on the list yet. */
export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "A client name is required" }, { status: 400 });
  }

  // Case-insensitive: "privia health" must not become a second Privia Health.
  const clash = await prisma.account.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { name: true },
  });
  if (clash) {
    return NextResponse.json({ error: `"${clash.name}" is already on the list`, name: clash.name }, { status: 409 });
  }

  const created = await prisma.account.create({
    data: {
      id: `acct-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      name,
      createdBy: session?.user?.email ?? null,
    },
    select: { name: true },
  });

  void logEvent(ACTIONS.clientAdded, { label: created.name });
  return NextResponse.json(created, { status: 201 });
}
