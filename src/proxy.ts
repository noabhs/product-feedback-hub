import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Next.js 16 renamed the `middleware` file convention to `proxy`.
// Gates every page and every API route; /api/auth/*, /signin and /api/cron/* are
// excluded via the matcher below. Sign-in has to stay reachable, and a cron
// request carries no session — it authenticates with CRON_SECRET inside the
// route instead, which is checked before anything else happens there.
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
    "/((?!api/auth|api/cron|signin|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
