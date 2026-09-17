import { prisma } from "@/lib/prisma";
import { answerGlobalQuestion, QA_MODEL, Q_PROMPT_VERSION, type QCompetitor } from "@/lib/claude";
import { loadAccountDetails, loadAccounts } from "@/lib/accounts-db";
import { searchInsights } from "@/lib/insight-search";
import { expandQuestion, readAsNote, rewriteQuestion } from "@/lib/synonyms";
import { recordAskLog } from "@/lib/ask-log";
import { logEvent, ACTIONS } from "@/lib/events";
import type { FeatureRequestItem } from "@/lib/types";

const iso = (d: Date | null) => d?.toISOString() ?? null;

export type QSource =
  | { id: string; kind: "insight"; label: string; client: string | null }
  | { id: string; kind: "competitor"; label: string; client: null }
  | { id: string; kind: "feature-request"; label: string; client: null };

export interface QResult {
  answer: string;
  sources: QSource[];
  askId: string | null;
}

/**
 * "Q" over the whole hub — feedback, competitors, feature requests, the client
 * table. Pulled out of the route handler so it has no dependency on
 * NextRequest/NextResponse: the home page's Ask box and the Slack /ask command
 * both call this and log to the same AskLog, so a rating means the same thing
 * regardless of where the question came from.
 */
export async function runQ(question: string, actor: string, apiKey?: string): Promise<QResult> {
  const accountsLike = await loadAccounts();

  const [insights, accounts, competitorRows, featureRequests] = await Promise.all([
    searchInsights(question, accountsLike),
    // The whole client table goes with every question, so a question about the
    // accounts — "how many clients run HIE" — is answerable on its own terms.
    loadAccountDetails(),
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

  // Recomputed rather than returned from searchInsights, which is shared with
  // /api/ai/qa and whose return shape both surfaces depend on. expandQuestion
  // is pure string work, so running it twice costs nothing.
  const matched = expandQuestion(question).matched;
  const readAs = readAsNote(question, matched);
  // The model reads the question with Navina's own names substituted in; the
  // original is what gets logged and shown back to the asker.
  const asModelSeesIt = rewriteQuestion(question, matched);

  const startedAt = Date.now();
  const answer = await answerGlobalQuestion(
    asModelSeesIt,
    insights,
    accounts,
    competitors,
    requests,
    apiKey,
    readAs,
  );
  const latencyMs = Date.now() - startedAt;

  // In the same order buildQPrompt numbered them, so sources[n - 1] is what a
  // [n] citation in the answer points at.
  const sources: QSource[] = [
    ...insights.map((i) => ({ id: i.id, kind: "insight" as const, label: i.oneLiner, client: i.client ?? null })),
    ...competitors.map((c) => ({ id: c.id, kind: "competitor" as const, label: c.name, client: null })),
    ...requests.map((f) => ({ id: f.id, kind: "feature-request" as const, label: f.title, client: null })),
  ];

  void logEvent(ACTIONS.aiAsk, { label: question, actor });
  const askId = await recordAskLog({
    actor,
    question,
    answer,
    sourceIds: sources.map((s) => s.id),
    matchedCount: sources.length,
    model: QA_MODEL,
    promptVersion: Q_PROMPT_VERSION,
    latencyMs,
  });

  return { answer, sources, askId };
}

/**
 * The reverse of building `sources` above: given the raw ids AskLog.sourceIds
 * stores (a flat array with no kind attached), figures out which table each
 * one actually belongs to and returns them typed the same way runQ's own
 * sources are. Needed anywhere a logged answer gets replayed or reused after
 * the fact — the Slack "Share to channel" button rebuilds its blocks this way
 * rather than trusting Slack to echo the original message back intact.
 */
export async function resolveQSources(ids: string[]): Promise<QSource[]> {
  if (!ids.length) return [];

  const [insights, competitors, requests] = await Promise.all([
    prisma.insight.findMany({ where: { id: { in: ids } }, select: { id: true, oneLiner: true, client: true } }),
    prisma.competitor.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
    prisma.featureRequest.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } }),
  ]);

  const byId = new Map<string, QSource>();
  for (const i of insights) byId.set(i.id, { id: i.id, kind: "insight", label: i.oneLiner, client: i.client ?? null });
  for (const c of competitors) byId.set(c.id, { id: c.id, kind: "competitor", label: c.name, client: null });
  for (const f of requests) byId.set(f.id, { id: f.id, kind: "feature-request", label: f.title, client: null });

  // ids, not byId's own order — a citation's [n] maps to this array's
  // position, and a row deleted since the original answer just drops out
  // rather than shifting every citation after it.
  return ids.map((id) => byId.get(id)).filter((s): s is QSource => !!s);
}
