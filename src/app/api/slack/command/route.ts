import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { runQ } from "@/lib/ask-q";
import { verifySlackSignature, postToResponseUrl, qAnswerBlocks } from "@/lib/slack";

// after() runs the Claude call once the ack below has already gone out; give
// it the same headroom the weekly recap's model call gets.
export const maxDuration = 60;
export const runtime = "nodejs";

const USAGE = "Ask it something, e.g. `/ask which Red accounts renew this quarter`.";

/**
 * The `/ask` Slack slash command — "Q" (lib/ask-q.ts), reachable without
 * opening the hub. Excluded from src/proxy.ts's auth gate the same way
 * /api/cron/* is: a Slack request carries no session, and the signature
 * checked below is what proves the request is genuinely from Slack instead.
 *
 * Slash commands must ack within 3 seconds; a Claude call routinely takes
 * longer than that, so this responds immediately with a placeholder and does
 * the real work inside after() — which runs once the response has already
 * been sent — posting the actual answer to response_url when it's ready.
 */
export async function POST(req: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET?.trim();
  if (!signingSecret) {
    return NextResponse.json({ error: "SLACK_SIGNING_SECRET isn't set" }, { status: 500 });
  }

  // Signature is computed over the exact raw bytes, so this has to be read as
  // text before anything parses it — a second read of the body isn't possible.
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
  const question = form.get("text")?.trim() ?? "";
  // Slack user_id/user_name, not an @navina.ai email — resolving the real
  // email would need a bot token with a users:read scope this app doesn't
  // request yet. Prefixed so it's never confused with a web-app actor email
  // in the AskLog or Event log.
  const userName = form.get("user_name") ?? "unknown";
  const responseUrl = form.get("response_url");

  if (!question) {
    return NextResponse.json({ response_type: "ephemeral", text: USAGE });
  }
  if (!responseUrl) {
    return NextResponse.json({ response_type: "ephemeral", text: "Slack didn't send a response_url — try again." });
  }

  after(async () => {
    try {
      const { answer, sources } = await runQ(question, `slack:${userName}`);
      await postToResponseUrl(responseUrl, {
        response_type: "ephemeral",
        replace_original: true,
        text: answer,
        blocks: qAnswerBlocks(question, answer, sources),
      });
    } catch (e) {
      console.error("[slack/command] runQ failed:", (e as Error).message);
      await postToResponseUrl(responseUrl, {
        response_type: "ephemeral",
        replace_original: true,
        text: `Couldn't get an answer: ${(e as Error).message}`,
      });
    }
  });

  return NextResponse.json({ response_type: "ephemeral", text: "🤔 Checking the hub…" });
}
