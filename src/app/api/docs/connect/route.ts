import { NextRequest } from "next/server";
import { signIn } from "@/auth";

/**
 * Re-runs Google sign-in so the session picks up Docs access. People who signed
 * in before "Create Google Doc" existed have no Drive grant; this is the one
 * click that fixes it, then returns them to where they were.
 */
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") ?? "/home";
  // Same-site paths only, so this can't be used as an open redirect.
  const safe = to.startsWith("/") && !to.startsWith("//") ? to : "/home";
  return signIn("google", { redirectTo: safe });
}
