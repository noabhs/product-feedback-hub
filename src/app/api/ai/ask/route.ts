import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { answerGlobalQuestion, QA_MODEL, Q_PROMPT_VERSION, type QCompetitor } from "@/lib/claude";
import { loadAccountDetails, loadAccounts } from "@/lib/accounts-db";
import { searchInsights } from "@/lib/insight-search";
import { recordAskLog } from "@/lib/ask-log";
import { logEvent, ACTIONS } from "@/lib/events";
import type { FeatureRequestItem } from "@/lib/types";

const iso = (d: Date | null) => d?.toISOString() ?? null;

/**
 * "Ask Q" on the home page — the same idea as /api/ai/qa, but reading the
 * whole hub (feedback, competitors, feature requests, the client table)
 * instead of just feedback. Kept as its own route rather than a flag on the
 * existing one: the two write different system prompts and answer shapes, and
 * AskLog.promptVersion already exists to keep their ratings apart.
 */
export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });
  // The question as asked, stored in full — Event.label truncates at 200 chars.
  const asked = question.trim();

  const [session, accountsLike] = await Promise.all([auth(), loadAccounts()]);
  const actor = session?.user?.email ?? "anonymous";

  const [insights, accounts, competitorRows, featureRequests] = await Promise.all([
    searchInsights(asked, accountsLike),
    // The whole client table goes with every question, so a question about the
    // accounts — "how many clients run HIE" — is answerable on its own terms.
    loadAccountDetails(),
    // 36 rows — same "small enough to return in full every time" call as
    // /api/competitors. Document-level detail (CompetitorDocument) isn't
    // pulled in yet; the curated overview/keyFacts/differentiation fields are
    // the signal for most questions Q gets asked.
    prisma.competitor.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.featureRequest.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);

  const competitors: QCompetitor[] = competitorRows.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    subgroup: c.subgroup,
    positioning: c.positioning,
    website: c.website,
    overview: c.overview,
    keyFacts: c.keyFacts,
    differentiation: c.differentiation,
    lastUpdated: iso(c.lastUpdated),
  }));

  const requests: FeatureRequestItem[] = featureRequests.map((f) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    painToSolve: f.painToSolve,
    reporter: f.reporter,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }));

  const apiKey = req.headers.get("x-anthropic-key") ?? undefined;
  const startedAt = Date.now();
  const answer = await answerGlobalQuestion(asked, insights, accounts, competitors, requests, apiKey);
  const latencyMs = Date.now() - startedAt;

  // In the same order buildQPrompt numbered them, so sources[n - 1] is what a
  // [n] citation in the answer points at.
  const sources = [
    ...insights.map((i) => ({ id: i.id, kind: "insight" as const, label: i.oneLiner, client: i.client ?? null })),
    ...competitors.map((c) => ({ id: c.id, kind: "competitor" as const, label: c.name, client: null })),
    ...requests.map((f) => ({ id: f.id, kind: "feature-request" as const, label: f.title, client: null })),
  ];

  void logEvent(ACTIONS.aiAsk, { label: asked, actor });
  const askId = await recordAskLog({
    actor,
    question: asked,
    answer,
    sourceIds: sources.map((s) => s.id),
    matchedCount: sources.length,
    model: QA_MODEL,
    promptVersion: Q_PROMPT_VERSION,
    latencyMs,
  });

  return NextResponse.json({ answer, sources, askId });
}
