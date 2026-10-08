import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Next.js 16 renamed the `middleware` file convention to `proxy`.
// Gates every page and every API route; /api/auth/*, /signin, /api/cron/*,
// /api/slack/* and /api/mcp are excluded via the matcher below. Sign-in has to stay
// reachable, and a cron or Slack request carries no session — each
// authenticates itself inside its own route instead (CRON_SECRET, Slack's
// request signature, a personal bearer token for /api/mcp) before anything else happens there.
export default auth((req) => {
  if (req.auth) return;

  // API callers get a status they can act on rather than an HTML redirect.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signin = new URL("/signin", req.nextUrl.origin);
  signin.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(signin);
});

export const config = {
  matcher: [
    "/((?!api/auth|api/cron|api/slack|api/mcp|signin|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
