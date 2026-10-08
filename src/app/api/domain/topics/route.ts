import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { TOPICS } from "@/lib/domain/topics";
import { MAX_DOMAIN_TOPICS } from "@/lib/briefs";

/**
 * The topic list for pickers (the home page's brief). A route rather than an
 * import so the client bundle does not carry every topic's text just to show nine names.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    max: MAX_DOMAIN_TOPICS,
    topics: TOPICS.map((t) => ({ slug: t.slug, title: t.title })),
  });
}
