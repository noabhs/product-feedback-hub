import { NextRequest, NextResponse } from "next/server";
import { createConversation, listConversations } from "@/lib/ask-conversation";
import { requireEmail } from "@/lib/ask-route";

/** The caller's own chats, newest activity first. */
export async function GET() {
  const who = await requireEmail();
  if ("response" in who) return who.response;
  return NextResponse.json({ conversations: await listConversations(who.email) });
}

/**
 * Starts a chat. With a question it is stored as pending and not answered here:
 * the home box redirects to the chat page, which sends it, so a refresh or a
 * dropped connection resumes the same chat instead of asking twice or losing it.
 */
export async function POST(req: NextRequest) {
  const who = await requireEmail();
  if ("response" in who) return who.response;
  const body = await req.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question : undefined;
  const { id } = await createConversation(who.email, question);
  return NextResponse.json({ id }, { status: 201 });
}
