import { NextResponse } from "next/server";

/**
 * Reports whether the server has an Anthropic key configured, so the UI can
 * stop telling users to supply their own when a shared one already covers them.
 * Returns a boolean only — never the key or any part of it.
 */
export async function GET() {
  return NextResponse.json({
    serverKey: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
  });
}
