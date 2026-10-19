import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { BriefError } from "@/lib/briefs";
import { readCompetitorWeeklyBrief, writeCompetitorWeeklyBrief } from "@/lib/competitor-weekly-brief";

/** Web search is several model turns; the default limit is too short. */
export const maxDuration = 120;

/** The last completed week's brief, or null if it has not been written. Never calls the model. */
export async function GET() {
  const { week, brief } = await readCompetitorWeeklyBrief();
  return NextResponse.json({ weekLabel: week.label, brief });
}

/** "Write it now": writes (or rewrites) the last completed week's brief. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const apiKey = req.headers.get("x-anthropic-key") ?? undefined;

  try {
    const brief = await writeCompetitorWeeklyBrief(new Date(), apiKey);
    return NextResponse.json({ weekLabel: brief.weekLabel, brief });
  } catch (e) {
    if (e instanceof BriefError) return NextResponse.json({ error: e.message }, { status: e.status });
    const message = (e as Error).message ?? "unknown error";
    console.error("[competitor-weekly-brief] failed:", message);
    return NextResponse.json(
      { error: /401|authentication/i.test(message) ? "The Anthropic API key was rejected (401)." : `Couldn't write the brief: ${message.slice(0, 160)}` },
      { status: 502 },
    );
  }
}
