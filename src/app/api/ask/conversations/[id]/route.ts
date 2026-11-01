import { NextRequest, NextResponse } from "next/server";
import { deleteConversation, getConversationFor, renameConversation } from "@/lib/ask-conversation";
import { conversationErrorResponse, requireEmail } from "@/lib/ask-route";

type Ctx = { params: Promise<{ id: string }> };

/** The chat with its turns — to whoever started it, and to the hub owner. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const who = await requireEmail();
  if ("response" in who) return who.response;
  const { id } = await params;
  const conversation = await getConversationFor(who.email, id);
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  return NextResponse.json({ conversation });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const who = await requireEmail();
  if ("response" in who) return who.response;
  const { id } = await params;
  const { title } = await req.json().catch(() => ({}));
  try {
    await renameConversation(who.email, id, typeof title === "string" ? title : "");
  } catch (e) {
    return conversationErrorResponse(e);
  }
  return NextResponse.json({ ok: true });
}

/** Removes the chat and its follow-ups; the first question stays in the Asks log. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const who = await requireEmail();
  if ("response" in who) return who.response;
  const { id } = await params;
  try {
    await deleteConversation(who.email, id);
  } catch (e) {
    return conversationErrorResponse(e);
  }
  return NextResponse.json({ ok: true });
}
