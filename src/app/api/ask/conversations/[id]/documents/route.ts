import { NextRequest, NextResponse } from "next/server";
import { conversationErrorResponse, requireEmail } from "@/lib/ask-route";
import { addDocument } from "@/lib/ask-documents";

export const runtime = "nodejs";

/** Attaches one file to the caller's chat as context for its questions. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const who = await requireEmail();
  if ("response" in who) return who.response;
  const { id } = await params;
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  try {
    return NextResponse.json({ document: await addDocument(who.email, id, file) }, { status: 201 });
  } catch (e) {
    return conversationErrorResponse(e);
  }
}
