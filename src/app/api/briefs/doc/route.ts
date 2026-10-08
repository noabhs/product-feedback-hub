import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createGoogleDoc, docsConfigured } from "@/lib/google-doc";
import { logEvent, ACTIONS } from "@/lib/events";

/** Turn a generated brief into a Google Doc shared with the person who asked. */
export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!docsConfigured()) {
    return NextResponse.json({ error: "Google Docs isn't set up for the hub yet." }, { status: 503 });
  }

  const { title, markdown } = (await req.json()) as { title?: string; markdown?: string };
  if (!title?.trim() || !markdown?.trim()) {
    return NextResponse.json({ error: "Nothing to put in a doc." }, { status: 400 });
  }

  try {
    const { url } = await createGoogleDoc({ title: title.trim().slice(0, 200), markdown, shareWith: email });
    void logEvent(ACTIONS.briefDocCreated, { label: title, actor: email });
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("[briefs/doc]", e);
    return NextResponse.json({ error: "Couldn't create the Google Doc." }, { status: 502 });
  }
}
