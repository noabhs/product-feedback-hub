import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { QA_MODEL, cleanKey } from "@/lib/claude";

/** A probe makes a real call; the default limit is fine but be explicit. */
export const maxDuration = 30;

/**
 * Reports whether the server has an Anthropic key configured, so the UI can
 * stop telling users to supply their own when a shared one already covers them.
 * Returns a boolean only — never the key or any part of it.
 *
 * `?probe=1` goes further and actually calls the model with a handful of
 * tokens, because "configured" and "working" are different things and only the
 * second one matters. It reports the real error when there is one: an expired
 * key, a wrong model id and a network failure look identical from the outside
 * otherwise, and diagnosing them through the recap meant reading a symptom
 * three layers away from the cause.
 */
export async function GET(req: NextRequest) {
  const key = cleanKey(process.env.ANTHROPIC_API_KEY);
  const serverKey = Boolean(key);

  if (req.nextUrl.searchParams.get("probe") !== "1") {
    return NextResponse.json({ serverKey });
  }

  if (!key) {
    return NextResponse.json({
      serverKey: false,
      probe: { ok: false, error: "ANTHROPIC_API_KEY is not set on the server." },
    });
  }

  const started = Date.now();
  try {
    const res = await new Anthropic({ apiKey: key }).messages.create({
      model: QA_MODEL,
      max_tokens: 8,
      messages: [{ role: "user", content: "Reply with exactly: ok" }],
    });
    const text = res.content.find((b) => b.type === "text");
    return NextResponse.json({
      serverKey: true,
      probe: {
        ok: true,
        model: QA_MODEL,
        ms: Date.now() - started,
        reply: text && "text" in text ? text.text.slice(0, 20) : null,
      },
    });
  } catch (e) {
    return NextResponse.json({
      serverKey: true,
      probe: {
        ok: false,
        model: QA_MODEL,
        ms: Date.now() - started,
        // The SDK's message carries the status and the API's own explanation.
        error: (e as Error).message?.slice(0, 300) ?? "unknown error",
      },
    });
  }
}
