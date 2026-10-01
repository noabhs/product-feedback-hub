import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { areaBrief, BriefError, clientBrief, competitorBrief, type BriefKind } from "@/lib/briefs";
import { logEvent, ACTIONS } from "@/lib/events";

/** A brief with web search is several model turns; the default limit is too short. */
export const maxDuration = 120;

/**
 * Generate a client, competitor or product-area brief on demand. `subject` is
 * the client name, the competitor id, or an array of area keys. Nothing is
 * stored: a brief is a one-off to copy or send, not a hub record.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kind, subject } = (await req.json()) as { kind: BriefKind; subject: string | string[] };
  const apiKey = req.headers.get("x-anthropic-key") ?? undefined;

  try {
    let brief;
    if (kind === "client" && typeof subject === "string" && subject) brief = await clientBrief(subject, apiKey);
    else if (kind === "competitor" && typeof subject === "string" && subject) brief = await competitorBrief(subject, apiKey);
    else if (kind === "area" && Array.isArray(subject)) brief = await areaBrief(subject, apiKey);
    else return NextResponse.json({ error: "Pick something to write the brief about." }, { status: 400 });

    void logEvent(ACTIONS.briefGenerated, { target: kind, label: brief.title, actor: session.user.email });
    return NextResponse.json(brief);
  } catch (e) {
    if (e instanceof BriefError) return NextResponse.json({ error: e.message }, { status: e.status });
    const message = (e as Error).message ?? "unknown error";
    console.error("[brief] failed:", message);
    return NextResponse.json(
      { error: /401|authentication/i.test(message) ? "The Anthropic API key was rejected (401)." : `Couldn't write the brief: ${message.slice(0, 160)}` },
      { status: 502 },
    );
  }
}
