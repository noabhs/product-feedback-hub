import { postDmToUser } from "@/lib/slack";
import { HUB_URL } from "@/lib/slack";
import { listPeople } from "@/lib/people-directory";
import { resolveMentions } from "@/lib/mentions";
import { shortName } from "@/lib/people";

/** Slack mrkdwn treats these three characters as markup. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * DMs everyone @mentioned in a comment. `alreadyNotified` lets an edit notify only
 * the people it newly adds, not everyone again. Never throws: a Slack failure
 * must not undo a comment that has already been saved.
 */
export async function notifyMentions(opts: {
  body: string;
  author: string;
  insight: { id: string; oneLiner: string; client: string | null };
  alreadyNotified?: string[];
}): Promise<void> {
  try {
    const { body, author, insight, alreadyNotified = [] } = opts;
    const skip = new Set([author.toLowerCase(), ...alreadyNotified.map((e) => e.toLowerCase())]);
    const targets = resolveMentions(body, await listPeople()).filter((e) => !skip.has(e));
    if (targets.length === 0) return;

    const who = shortName(author);
    const link = `${HUB_URL}/insights?open=${insight.id}`;
    const snippet = body.length > 500 ? `${body.slice(0, 500)}…` : body;
    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${esc(who)}* mentioned you in a comment on <${link}|${esc(insight.oneLiner)}>${
            insight.client ? ` _(${esc(insight.client)})_` : ""
          }`,
        },
      },
      { type: "section", text: { type: "mrkdwn", text: `>${esc(snippet).replace(/\n/g, "\n>")}` } },
      { type: "context", elements: [{ type: "mrkdwn", text: `<${link}|Open in the Insights Hub>` }] },
    ];
    const fallback = `${who} mentioned you in a comment on “${insight.oneLiner}”`;

    const results = await Promise.all(targets.map((email) => postDmToUser(email, blocks, fallback)));
    results.forEach((r, i) => {
      if (!r.ok) console.error(`[mentions] DM to ${targets[i]} failed: ${r.error}`);
    });
  } catch (e) {
    console.error("[mentions] notify failed", e);
  }
}
