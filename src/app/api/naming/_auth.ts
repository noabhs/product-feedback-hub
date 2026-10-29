import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isOwner } from "@/lib/people";

/** The signed-in user's email, or a 401 response to return as is. */
export async function requireUser(): Promise<{ email: string } | { res: NextResponse }> {
  const email = (await auth())?.user?.email;
  return email ? { email } : { res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
}

export const fail = (e: unknown, status = 500) =>
  NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong" }, { status });

/**
 * Who may build reviews and change tickets in Jira: the hub owner plus the emails in
 * NAMING_EDITORS (comma separated). Everyone else signed in can read reviews and the
 * audit log. Unset means the owner alone.
 */
export function canEditNaming(email: string): boolean {
  if (isOwner(email)) return true;
  return (process.env.NAMING_EDITORS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}

/** requireUser plus the editor check, for every route that reads Jira or changes it. */
export async function requireEditor(): Promise<{ email: string } | { res: NextResponse }> {
  const u = await requireUser();
  if ("res" in u) return u;
  return canEditNaming(u.email)
    ? u
    : { res: NextResponse.json({ error: "You can read reviews, but only people on the editors list can change tickets. Ask Noa to add you." }, { status: 403 }) };
}
