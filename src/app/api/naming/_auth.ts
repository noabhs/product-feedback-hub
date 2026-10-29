import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** The signed-in user's email, or a 401 response to return as is. */
export async function requireUser(): Promise<{ email: string } | { res: NextResponse }> {
  const email = (await auth())?.user?.email;
  return email ? { email } : { res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
}

export const fail = (e: unknown, status = 500) =>
  NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong" }, { status });
