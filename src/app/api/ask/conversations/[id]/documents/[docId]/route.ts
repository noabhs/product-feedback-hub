import { NextRequest, NextResponse } from "next/server";
import { conversationErrorResponse, requireEmail } from "@/lib/ask-route";
import { removeDocument } from "@/lib/ask-documents";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const who = await requireEmail();
  if ("response" in who) return who.response;
  const { id, docId } = await params;
  try {
    await removeDocument(who.email, id, docId);
  } catch (e) {
    return conversationErrorResponse(e);
  }
  return NextResponse.json({ ok: true });
}
