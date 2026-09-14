import crypto from "node:crypto";
import type { WeeklyRecap } from "@/lib/weekly-recap";
import type { QSource } from "@/lib/ask-q";

const HUB_URL = "https://product-feedback-hub-topaz.vercel.app";

/** "12 entries (5 the week before)" — with the direction called out only when
 *  there is one, so a flat period doesn't get a misleading arrow. The period
 *  noun is passed in: a month recap comparing itself to "the week before" was
 *  wrong in a way a reader would trust. */
function trend(now: number, before: number, period: "week" | "month"): string {
  const noun = now === 1 ? "entry" : "entries";
  if (before === 0) return `*${now}* new feedback ${noun}`;
  if (now === before) return `*${now}* new feedback ${noun} — same as the ${period} before`;
  const delta = now - before;
  const arrow = delta > 0 ? "▲" : "▼";
  return `*${now}* new feedback ${noun} ${arrow} ${Math.abs(delta)} vs the ${period} before (${before})`;
}

function list(names: string[], max = 4): string {
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} +${names.length - max} more`;
}

/**
 * Block Kit for the Sunday recap. Deliberately short: a header, the numbers, the
 * week's read, and a link. Anyone who wants detail clicks through.
 */
export function weeklyRecapBlocks(recap: WeeklyRecap): unknown[] {
  const blocks: unknown[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📊  ${recap.week.kind === "month" ? "Monthly" : "Weekly"} brief · ${recap.week.label}`,
        emoji: true,
      },
    },
  ];

  if (recap.entries === 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `No new feedback landed in the hub` +
          (recap.entriesPrev ? ` (${recap.entriesPrev} the week before).` : ".") +
          (recap.asks ? ` The team did ask it *${recap.asks}* question${recap.asks === 1 ? "" : "s"}.` : ""),
      },
    });
  } else {
    const numbers = [trend(recap.entries, recap.entriesPrev, recap.week.kind)];

    if (recap.clients.length) {
      numbers.push(
        `From *${recap.clients.length}* client${recap.clients.length === 1 ? "" : "s"}: ${list(recap.clients)}`,
      );
    }
    if (recap.newClients.length && !recap.mostClientsAreNew) {
      numbers.push(`:tada: First feedback ever from *${list(recap.newClients, 4)}*`);
    }
    if (recap.topAreas.length) {
      numbers.push(`Areas: ${recap.topAreas.map((a) => `${a.label} (${a.count})`).join(" · ")}`);
    }

    const aside: string[] = [];
    if (recap.questions) aside.push(`*${recap.questions}* discovery question${recap.questions === 1 ? "" : "s"} added`);
    if (recap.asks) aside.push(`*${recap.asks}* question${recap.asks === 1 ? "" : "s"} asked of the hub`);
    if (aside.length) numbers.push(aside.join("  ·  "));

    blocks.push({ type: "section", text: { type: "mrkdwn", text: numbers.join("\n") } });

    // The AI read when there is one, the entries themselves when there isn't.
    if (recap.narrative) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `*What stood out*\n${recap.narrative}` },
      });
    } else if (recap.themes.length) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `*Came up across clients*  _wording several different accounts used_\n` +
            recap.themes
              .map(
                (t) =>
                  `• *${t.clients.length} clients* mentioned *“${t.label.toLowerCase()}”* — ${list(t.clients, 3)}\n` +
                  `   one of them: <${HUB_URL}/insights?open=${t.example.id}|“${t.example.oneLiner}”>`,
              )
              .join("\n"),
        },
      });
    } else if (recap.picks.length) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `*Highlights*\n` +
            recap.picks
              .map(
                (p) =>
                  `• <${HUB_URL}/insights?open=${p.id}|${p.oneLiner}>\n  _${p.client ?? "No client"}${p.areas.length ? ` · ${p.areas.join(", ")}` : ""}_`,
              )
              .join("\n"),
        },
      });
    }
  }

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `<${HUB_URL}/home|Open the Insights Hub>` }],
  });

  return blocks;
}

/**
 * The same recap as Slack-flavoured markdown in one string.
 *
 * Two jobs: the notification preview Slack shows before rendering blocks, and
 * the clipboard — which is what makes this usable while the webhook is still
 * waiting on an admin's approval. Paste it into a channel and it renders.
 */
export function recapMarkdown(recap: WeeklyRecap): string {
  const lines: string[] = [
    `*📊 ${recap.week.kind === "month" ? "Monthly" : "Weekly"} brief · ${recap.week.label}*`,
    "",
  ];

  if (recap.entries === 0) {
    lines.push(
      `No new feedback landed in the hub${recap.entriesPrev ? ` (${recap.entriesPrev} in the previous period)` : ""}.`,
    );
  } else {
    lines.push(trend(recap.entries, recap.entriesPrev, recap.week.kind));
    if (recap.clients.length) {
      lines.push(`From *${recap.clients.length}* client${recap.clients.length === 1 ? "" : "s"}: ${list(recap.clients, 6)}`);
    }
    if (recap.newClients.length && !recap.mostClientsAreNew) {
      lines.push(`:tada: First feedback ever from *${list(recap.newClients, 4)}*`);
    }
    if (recap.topAreas.length) {
      lines.push(`Areas: ${recap.topAreas.map((a) => `${a.label} (${a.count})`).join(" · ")}`);
    }
    const aside: string[] = [];
    if (recap.questions) aside.push(`*${recap.questions}* discovery question${recap.questions === 1 ? "" : "s"} added`);
    if (recap.asks) aside.push(`*${recap.asks}* question${recap.asks === 1 ? "" : "s"} asked of the hub`);
    if (aside.length) lines.push(aside.join("  ·  "));

    if (recap.narrative) {
      lines.push("", "*What stood out*", recap.narrative);
    } else if (recap.themes.length) {
      lines.push("", "*Came up across clients*  _wording several different accounts used_");
      for (const t of recap.themes) {
        lines.push(`• *${t.clients.length} clients* mentioned *“${t.label.toLowerCase()}”* — ${list(t.clients, 3)}`);
        lines.push(`   one of them: <${HUB_URL}/insights?open=${t.example.id}|“${t.example.oneLiner}”>`);
      }
    } else if (recap.picks.length) {
      lines.push("", "*Highlights*");
      for (const p of recap.picks) {
        lines.push(`• <${HUB_URL}/insights?open=${p.id}|${p.oneLiner}>`);
        lines.push(`   _${p.client ?? "No client"}${p.areas.length ? ` · ${p.areas.join(", ")}` : ""}_`);
      }
    }
  }

  lines.push("", `<${HUB_URL}/home|Open the Insights Hub>`);
  return lines.join("\n");
}

/**
 * Slack's own mrkdwn into standard Markdown.
 *
 * A webhook wants `*bold*` and `<url|label>`; a client posting through the Slack
 * API's markdown mode wants `**bold**` and `[label](url)`. Same recap, two
 * dialects — sending the first through the second shows the asterisks.
 */
export function toStandardMarkdown(mrkdwn: string): string {
  return mrkdwn
    .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, "[$2]($1)")
    // Bold only where an asterisk opens a run at a boundary, so a stray one in
    // prose is left alone.
    .replace(/(^|[\s(])\*([^*\n]+)\*/gm, "$1**$2**");
}

export interface SlackResult {
  ok: boolean;
  error?: string;
}

/**
 * Verifies a request actually came from Slack, per Slack's v0 signing spec:
 * HMAC-SHA256 of "v0:{timestamp}:{raw body}" keyed by the app's signing
 * secret, compared in constant time so the check itself can't leak the
 * expected value through timing. A timestamp more than 5 minutes old is
 * rejected too — Slack's own recommendation, so a captured request can't be
 * replayed later.
 *
 * Takes the raw body rather than a parsed one: the signature is computed over
 * the exact bytes Slack sent, and re-serializing parsed form data would not
 * reliably reproduce them.
 */
export function verifySlackSignature(opts: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  signingSecret: string;
}): boolean {
  const { rawBody, timestamp, signature, signingSecret } = opts;
  if (!timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) return false;

  const expected =
    "v0=" + crypto.createHmac("sha256", signingSecret).update(`v0:${timestamp}:${rawBody}`).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  // Buffers of different lengths would throw inside timingSafeEqual rather
  // than just failing the check.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Claude's Markdown, re-punctuated for Slack's mrkdwn dialect: **bold** loses
 * a star, [text](url) becomes <url|text>, and a Markdown "- " bullet becomes
 * the "• " Slack actually renders as one. The QA/Q system prompts never emit
 * headings, nested lists, or tables, so this is the entire gap between the
 * two dialects — the inverse of toStandardMarkdown above.
 */
export function markdownToSlackMrkdwn(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "<$2|$1>")
    .replace(/^- /gm, "• ");
}

/**
 * A slash command has to ack within 3 seconds, which a Claude call routinely
 * misses. The real answer goes here instead — response_url is good for up to
 * 30 minutes and 5 uses; every caller here sends exactly one.
 */
export async function postToResponseUrl(responseUrl: string, payload: unknown): Promise<SlackResult> {
  try {
    const res = await fetch(responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: `Slack returned ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Where a cited source's [n] can be read in full. Insights deep-link to the
 *  exact row (the same ?open= pattern the weekly recap uses); competitors and
 *  feature requests don't have a per-row route yet, so those link to the list. */
function sourceLink(s: QSource): string {
  const url =
    s.kind === "insight"
      ? `${HUB_URL}/insights?open=${s.id}`
      : s.kind === "competitor"
        ? `${HUB_URL}/competitors`
        : `${HUB_URL}/feature-requests`;
  return `<${url}|${s.label}>`;
}

/**
 * Blocks for a Q answer posted to Slack: the question, the answer, and up to
 * five cited sources as a compact footer so a [n] in the text has somewhere to
 * click through to. Capped at five because most answers cite far more than
 * that and a footer longer than the answer defeats the point of Slack's
 * narrow-box reading; the rest are just uncounted, not hidden.
 */
export function qAnswerBlocks(question: string, answer: string, sources: QSource[]): unknown[] {
  const blocks: unknown[] = [
    { type: "section", text: { type: "mrkdwn", text: `*Q:* ${question}` } },
    { type: "section", text: { type: "mrkdwn", text: markdownToSlackMrkdwn(answer) } },
  ];

  if (sources.length) {
    const shown = sources.slice(0, 5);
    const rest = sources.length - shown.length;
    const footer =
      shown.map((s, i) => `[${i + 1}] ${sourceLink(s)}`).join("  ·  ") + (rest > 0 ? `  +${rest} more` : "");
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: footer }] });
  }

  return blocks;
}

/**
 * Posts to the channel the incoming webhook was created against. A missing URL
 * is reported rather than thrown, so the caller can tell "not configured yet"
 * apart from "Slack rejected it".
 */
export async function postToSlack(blocks: unknown[], fallbackText: string): Promise<SlackResult> {
  const url = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!url) {
    return { ok: false, error: "SLACK_WEBHOOK_URL isn't set — add it in Vercel's environment variables." };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // text is what shows in the notification and in clients that can't render blocks.
      body: JSON.stringify({ text: fallbackText, blocks }),
    });
    if (!res.ok) {
      return { ok: false, error: `Slack returned ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
