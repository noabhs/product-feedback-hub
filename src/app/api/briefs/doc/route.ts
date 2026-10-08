import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createGoogleDoc, NeedsReconnect } from "@/lib/google-doc";
import { logEvent, ACTIONS } from "@/lib/events";

/** Turn a generated brief into a Google Doc in the requester's own Drive. */
export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, markdown } = (await req.json()) as { title?: string; markdown?: string };
  if (!title?.trim() || !markdown?.trim()) {
    return NextResponse.json({ error: "Nothing to put in a doc." }, { status: 400 });
  }

  try {
    const { url } = await createGoogleDoc(req, { title: title.trim().slice(0, 200), markdown });
    void logEvent(ACTIONS.briefDocCreated, { label: title, actor: email });
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    // The client turns this into a one-click "connect Google Docs" prompt.
    if (e instanceof NeedsReconnect) {
      return NextResponse.json({ error: "Connect Google Docs to create docs.", reconnect: true }, { status: 409 });
    }
    console.error("[briefs/doc]", e);
    return NextResponse.json({ error: "Couldn't create the Google Doc." }, { status: 502 });
  }
}
