import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEvent, ACTIONS } from "@/lib/events";
import { COMPETITOR_TOPIC_LABELS, CONFIDENCE_LABELS, normalizeAreas } from "@/lib/labels";

/**
 * Unattended push of competitive intelligence from the Slack/Jira sync.
 *
 * Competitive intelligence lives under Competitors, not in client feedback
 * (see lib/competitive.ts), so the sync sends it here instead of to
 * /api/cron/feedback-import. Same gate: `/api/cron/*` skips the SSO proxy and
 * the bearer FEEDBACK_IMPORT_SECRET is the only check.
 *
 * Body: { claims: [{ competitor, oneLiner, content, topics?, productAreas?,
 * confidence?, sensitivity?, sensitivityReason?, asOf? }] }. The competitor is
 * matched by name, case-insensitively, and created (category "Other") when it
 * is new. A claim whose one-liner the competitor already has is skipped, so a
 * repeat push cannot duplicate.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.FEEDBACK_IMPORT_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "FEEDBACK_IMPORT_SECRET isn't set" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { claims } = await req.json();
    if (!Array.isArray(claims)) {
      return NextResponse.json({ error: "claims must be an array" }, { status: 400 });
    }

    const competitors = await prisma.competitor.findMany({ select: { id: true, name: true } });
    const byName = new Map(competitors.map((c) => [c.name.toLowerCase(), c.id]));
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const c of claims) {
      const name = typeof c.competitor === "string" ? c.competitor.trim() : "";
      const oneLiner = typeof c.oneLiner === "string" ? c.oneLiner.trim() : "";
      const content = typeof c.content === "string" ? c.content.trim() : "";
      if (!name || !oneLiner || !content) {
        errors.push(`Skipped a claim missing competitor, oneLiner or content: ${oneLiner.slice(0, 60)}`);
        continue;
      }
      try {
        let competitorId = byName.get(name.toLowerCase());
        if (!competitorId) {
          competitorId = (await prisma.competitor.create({ data: { name, category: "Other" } })).id;
          byName.set(name.toLowerCase(), competitorId);
        }
        const exists = await prisma.competitorInsight.findFirst({ where: { competitorId, oneLiner }, select: { id: true } });
        if (exists) { skipped++; continue; }

        const internal = c.sensitivity !== "external";
        await prisma.competitorInsight.create({
          data: {
            competitorId,
            documentId: null,
            oneLiner,
            content,
            topics: (Array.isArray(c.topics) ? c.topics : []).filter((t: string) => t in COMPETITOR_TOPIC_LABELS),
            productAreas: normalizeAreas(c.productAreas).filter((a) => a !== "COMPETITIVE"),
            confidence: c.confidence in CONFIDENCE_LABELS ? c.confidence : "REPORTED",
            // Internal unless the sync says otherwise: a wrongly shareable claim
            // is the failure that can't be taken back.
            sensitivity: internal ? "internal" : "external",
            sensitivityReason: internal ? (c.sensitivityReason?.trim() || "Added by the feedback sync; not reviewed") : null,
            asOf: c.asOf ? new Date(c.asOf) : null,
          },
        });
        created++;
      } catch (e) {
        errors.push((e as Error).message);
      }
    }

    void logEvent(ACTIONS.competitorInsightCreated, { label: `${created} competitor claims via cron sync` });
    return NextResponse.json({ created, skipped, errors });
  } catch (e) {
    console.error("[cron/competitor-claims-import]", e);
    return NextResponse.json({ error: (e as Error).message ?? "Import failed" }, { status: 500 });
  }
}
