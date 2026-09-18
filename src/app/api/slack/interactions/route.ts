import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySlackSignature, postToResponseUrl, qAnswerBlocks, SHARE_ACTION_ID } from "@/lib/slack";
import { resolveQSources, hasWebSearchTrigger } from "@/lib/ask-q";

export const maxDuration = 60;
export const runtime = "nodejs";

/**
 * Slack's Interactivity Request URL — currently handles exactly one action,
 * the "Share to channel" button qAnswerBlocks attaches to a /ask answer.
 * Excluded from src/proxy.ts's auth gate the same way api/slack/command is:
 * a Slack request carries no session, and the signature checked below is
 * what proves the request is genuinely from Slack instead.
 *
 * Slack posts this as a single `payload` form field (JSON-encoded), not raw
 * JSON — different from the slash command's plain form body.
 */
export async function POST(req: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET?.trim();
  if (!signingSecret) {
    return NextResponse.json({ error: "SLACK_SIGNING_SECRET isn't set" }, { status: 500 });
  }

  const rawBody = await req.text();
  const valid = verifySlackSignature({
    rawBody,
    timestamp: req.headers.get("x-slack-request-timestamp"),
    signature: req.headers.get("x-slack-signature"),
    signingSecret,
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const form = new URLSearchParams(rawBody);
  const raw = form.get("payload");
  if (!raw) return NextResponse.json({});

  const payload = JSON.parse(raw) as {
    type?: string;
    actions?: { action_id: string; value?: string }[];
    response_url?: string;
    user?: { id: string };
  };

  if (payload.type !== "block_actions") return NextResponse.json({});
  const action = payload.actions?.[0];
  if (action?.action_id !== SHARE_ACTION_ID) return NextResponse.json({});

  const responseUrl = payload.response_url;
  const userId = payload.user?.id;
  const askId = action.value;
  if (!responseUrl || !userId || !askId) return NextResponse.json({});

  after(async () => {
    // Rebuilt from AskLog rather than trusting Slack to hand the original
    // message back intact: block_actions payloads from an *ephemeral*
    // message come back with no `message.blocks` at all (that field is only
    // populated for messages Slack itself is tracking state for), so the
    // first version of this read an empty array and shared a blank message.
    const row = await prisma.askLog.findUnique({ where: { id: askId } });
    if (!row) {
      await postToResponseUrl(responseUrl, {
        response_type: "ephemeral",
        replace_original: true,
        text: "Couldn't share that — the original question wasn't found.",
      });
      return;
    }

    const sources = await resolveQSources(JSON.parse(row.sourceIds) as string[]);
    // askId: null — the shared copy shouldn't grow its own "Share to
    // channel" button, it's already shared.
    const answerBlocks = qAnswerBlocks(row.question, row.answer, sources, null, hasWebSearchTrigger(row.question));

    // response_url is good for 5 uses in 30 minutes; this is the first —
    // posting visibly to the whole channel, attributed to whoever clicked.
    await postToResponseUrl(responseUrl, {
      response_type: "in_channel",
      replace_original: false,
      text: `<@${userId}> asked Q — shared from a private answer`,
      blocks: [
        { type: "context", elements: [{ type: "mrkdwn", text: `📣 <@${userId}> asked Q:` }] },
        ...answerBlocks,
      ],
    });

    // The second use: swap the button on the original ephemeral message for
    // a quiet confirmation, so a second click on the same message can't post
    // the same answer to the channel twice.
    await postToResponseUrl(responseUrl, {
      response_type: "ephemeral",
      replace_original: true,
      text: "Shared to the channel.",
      blocks: [...answerBlocks, { type: "context", elements: [{ type: "mrkdwn", text: "✅ Shared to the channel." }] }],
    });
  });

  return NextResponse.json({});
}
