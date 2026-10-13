import { prisma } from "@/lib/prisma";
import { MENTION_DOMAIN } from "@/lib/mentions";

/**
 * Everyone who can be @mentioned. There is no user table — sessions are JWTs —
 * so this is derived from who has left a trace: the event log records every
 * signed-in page view, and comments and entries carry their author. Someone
 * who has never opened the Hub since the log began won't appear until they do.
 */
export async function listPeople(): Promise<string[]> {
  const [actors, authors, creators] = await Promise.all([
    prisma.event.findMany({ distinct: ["actor"], select: { actor: true } }),
    prisma.comment.findMany({ distinct: ["author"], select: { author: true } }),
    prisma.insight.findMany({ distinct: ["createdBy"], select: { createdBy: true } }),
  ]);
  const all = new Set<string>();
  for (const e of [
    ...actors.map((r) => r.actor),
    ...authors.map((r) => r.author),
    ...creators.map((r) => r.createdBy),
  ]) {
    const email = e?.toLowerCase();
    if (email?.endsWith(`@${MENTION_DOMAIN}`)) all.add(email);
  }
  return [...all].sort();
}
