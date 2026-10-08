import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/api-token";
import { logEvent, ACTIONS } from "@/lib/events";

/** The signed-in user's own tokens. Never returns the hash or the plaintext. */
export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokens = await prisma.apiToken.findMany({
    where: { owner: email, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, prefix: true, createdAt: true, lastUsedAt: true },
  });
  return NextResponse.json({ tokens });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const label = String(body.label ?? "").trim().slice(0, 60) || "My Claude";

  const { token, hash, prefix } = generateToken();
  const row = await prisma.apiToken.create({
    data: { owner: email, label, tokenHash: hash, prefix },
  });
  await logEvent(ACTIONS.apiTokenCreated, { target: row.id, label });

  // The only time the plaintext exists outside the user's clipboard.
  return NextResponse.json({ id: row.id, label, prefix, token }, { status: 201 });
}
