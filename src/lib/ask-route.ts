import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ConversationError } from "@/lib/ask-conversation";

/** The signed-in email, or the 401 to return. Conversations are keyed by it, so
 *  unlike /api/ai/ask there is no "anonymous" fallback. */
export async function requireEmail(): Promise<{ email: string } | { response: NextResponse }> {
  const email = (await auth())?.user?.email;
  if (!email) return { response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  return { email };
}

/** Maps a ConversationError to its status; anything else is a real failure and rethrown. */
export function conversationErrorResponse(e: unknown): NextResponse {
  if (e instanceof ConversationError) return NextResponse.json({ error: e.message }, { status: e.status });
  throw e;
}
