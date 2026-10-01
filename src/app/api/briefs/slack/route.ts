import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { markdownToSlackMrkdwn, postToSlack } from "@/lib/slack";
import { logEvent, ACTIONS } from "@/lib/events";

/** Slack caps a section block's text at 3000 characters. */
const BLOCK_LIMIT = 2900;

/** Split on paragraph breaks so no block cuts a sentence in half. */
function chunk(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (const para of text.split(/\n{2,}/)) {
    if (cur && cur.length + para.length + 2 > BLOCK_LIMIT) {
      out.push(cur);
      cur = "";
    }
    cur = cur ? `${cur}\n\n${para}` : para;
    while (cur.length > BLOCK_LIMIT) {
      out.push(cur.slice(0, BLOCK_LIMIT));
      cur = cur.slice(BLOCK_LIMIT);
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** Post a generated brief to the team's Slack channel. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, markdown } = (await req.json()) as { title?: string; markdown?: string };
  if (!title?.trim() || !markdown?.trim()) {
    return NextResponse.json({ error: "Nothing to send." }, { status: 400 });
  }

  const body = markdownToSlackMrkdwn(markdown).replace(/^#{1,6}\s+(.+)$/gm, "*$1*");
  const blocks = [
    { type: "header", text: { type: "plain_text", text: title.slice(0, 150) } },
    ...chunk(body).map((text) => ({ type: "section", text: { type: "mrkdwn", text } })),
    { type: "context", elements: [{ type: "mrkdwn", text: `Generated in the Insights Hub by ${session.user.email}` }] },
  ];

  const result = await postToSlack(blocks, title);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });

  void logEvent(ACTIONS.briefSent, { label: title, actor: session.user.email });
  return NextResponse.json({ ok: true });
}
