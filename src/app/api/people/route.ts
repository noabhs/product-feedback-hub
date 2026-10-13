import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listPeople } from "@/lib/people-directory";

/** Emails of people who can be @mentioned. Signed-in only (proxy.ts also gates it). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ people: await listPeople() });
}
