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
  /** What was commented on: shown in the DM and linked to. */
  target: { noun: string; title: string; subtitle?: string | null; url: string };
  alreadyNotified?: string[];
}): Promise<void> {
  try {
    const { body, author, target, alreadyNotified = [] } = opts;
    const skip = new Set(alreadyNotified.map((e) => e.toLowerCase()));
    const recipients = resolveMentions(body, await listPeople()).filter((e) => !skip.has(e));
    if (recipients.length === 0) return;

    const who = shortName(author);
    const link = `${HUB_URL}${target.url}`;
    const snippet = body.length > 500 ? `${body.slice(0, 500)}…` : body;
    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${esc(who)}* mentioned you in a comment on ${target.noun} <${link}|${esc(target.title)}>${
            target.subtitle ? ` _(${esc(target.subtitle)})_` : ""
          }`,
        },
      },
      { type: "section", text: { type: "mrkdwn", text: `>${esc(snippet).replace(/\n/g, "\n>")}` } },
      { type: "context", elements: [{ type: "mrkdwn", text: `<${link}|Open in the Insights Hub>` }] },
    ];
    const fallback = `${who} mentioned you in a comment on “${target.title}”`;

    const results = await Promise.all(recipients.map((email) => postDmToUser(email, blocks, fallback)));
    results.forEach((r, i) => {
      if (!r.ok) console.error(`[mentions] DM to ${recipients[i]} failed: ${r.error}`);
    });
  } catch (e) {
    console.error("[mentions] notify failed", e);
  }
}
