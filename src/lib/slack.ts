import type { WeeklyRecap } from "@/lib/weekly-recap";

const HUB_URL = "https://product-feedback-hub-topaz.vercel.app";

/** "12 entries (5 the week before)" — with the direction called out only when
 *  there is one, so a flat week doesn't get a misleading arrow. */
function trend(now: number, before: number): string {
  const noun = now === 1 ? "entry" : "entries";
  if (before === 0) return `*${now}* new feedback ${noun}`;
  if (now === before) return `*${now}* new feedback ${noun} — same as the week before`;
  const delta = now - before;
  const arrow = delta > 0 ? "▲" : "▼";
  return `*${now}* new feedback ${noun} ${arrow} ${Math.abs(delta)} vs the week before (${before})`;
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
      text: { type: "plain_text", text: `📊  Week of ${recap.week.label}`, emoji: true },
    },
  ];

  if (recap.entries === 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `No new feedback landed in the hub this week` +
          (recap.entriesPrev ? ` (${recap.entriesPrev} the week before).` : ".") +
          (recap.asks ? ` The team did ask it *${recap.asks}* question${recap.asks === 1 ? "" : "s"}.` : ""),
      },
    });
  } else {
    const numbers = [trend(recap.entries, recap.entriesPrev)];

    if (recap.clients.length) {
      numbers.push(
        `From *${recap.clients.length}* client${recap.clients.length === 1 ? "" : "s"}: ${list(recap.clients)}`,
      );
    }
    if (recap.newClients.length) {
      numbers.push(`:tada: First feedback ever from *${list(recap.newClients)}*`);
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

export interface SlackResult {
  ok: boolean;
  error?: string;
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
