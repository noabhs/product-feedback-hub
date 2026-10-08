import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isOwner } from "@/lib/people";

/**
 * Who is signed in, for client components that can't call `auth()` themselves.
 *
 * `owner` only decides whether an owner-only control is drawn — every such
 * endpoint checks the session again on its own, so this can't grant anything.
 */
export async function GET() {
  const session = await auth();
  const email = session?.user?.email ?? null;
  return NextResponse.json({ email, owner: isOwner(email) });
}
