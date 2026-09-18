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
  | { id: string; kind: "feature-request"; label: string; client: null }
  | { id: string; kind: "web"; label: string; client: null; url: string };

export interface QResult {
  answer: string;
  sources: QSource[];
  askId: string | null;
  usedWebSearch: boolean;
}

/**
 * How an asker opts a question into web search — "search web" or "searchweb"
 * anywhere in the text, either side of it, case-insensitive. A phrase rather
 * than a UI-only toggle so the same convention works from Slack, which has no
 * checkbox to offer. The word boundaries keep it from firing inside "research
 * web" or similar.
 */
const WEB_SEARCH_TRIGGER = /\bsearch\s?web\b/i;

/** Whether a question (as typed, or as logged in AskLog) carries the trigger —
 *  shared with the Slack "Share to channel" replay, which has no fresh
 *  answerGlobalQuestion result to read usedWebSearch off of. */
export function hasWebSearchTrigger(question: string): boolean {
  return WEB_SEARCH_TRIGGER.test(question);
}

/** Strips the trigger phrase back out before the question is used for
 *  retrieval or sent to the model — it's a control signal, not content. The
 *  raw question (trigger included) is what gets logged, so a replayed answer
 *  can still tell whether web search ran. */
function stripWebSearchTrigger(question: string): { question: string; wantsWebSearch: boolean } {
  const wantsWebSearch = hasWebSearchTrigger(question);
  if (!wantsWebSearch) return { question, wantsWebSearch };
  return { question: question.replace(WEB_SEARCH_TRIGGER, " ").replace(/\s{2,}/g, " ").trim(), wantsWebSearch };
}

/**
 * "Q" over the whole hub — feedback, competitors, feature requests, the client
 * table. Pulled out of the route handler so it has no dependency on
 * NextRequest/NextResponse: the home page's Ask box and the Slack /ask command
 * both call this and log to the same AskLog, so a rating means the same thing
 * regardless of where the question came from.
 */
export async function runQ(rawQuestion: string, actor: string, apiKey?: string): Promise<QResult> {
  const { question, wantsWebSearch } = stripWebSearchTrigger(rawQuestion);
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

  // In the same order buildQPrompt numbered them, so hubSources[n - 1] is
  // what a hub [n] citation points at — and any web citations the model
  // earns continue numbering right after this list ends.
  const hubSources: QSource[] = [
    ...insights.map((i) => ({ id: i.id, kind: "insight" as const, label: i.oneLiner, client: i.client ?? null })),
    ...competitors.map((c) => ({ id: c.id, kind: "competitor" as const, label: c.name, client: null })),
    ...requests.map((f) => ({ id: f.id, kind: "feature-request" as const, label: f.title, client: null })),
  ];

  const startedAt = Date.now();
  const { text: modelAnswer, usedWebSearch, webSources } = await answerGlobalQuestion(
    asModelSeesIt,
    insights,
    accounts,
    competitors,
    requests,
    apiKey,
    readAs,
    wantsWebSearch,
    hubSources.length,
  );
  const latencyMs = Date.now() - startedAt;

  // Baked into the answer text itself, not left as a separate flag each
  // surface has to remember to render — a badge only the web UI draws is
  // invisible from Slack, from the Asks log, and from a copied/pasted
  // answer, all of which just show this string. The tip only fires when the
  // asker never asked for the web at all — not when they did and it simply
  // didn't run, which would just be confusing.
  const answer = usedWebSearch
    ? `🌐 **This answer includes a live web search.**\n\n${modelAnswer}`
    : wantsWebSearch
      ? modelAnswer
      : `${modelAnswer}\n\n💡 **Tip:** add "search web" anywhere in your question to also pull in live web results.`;

  // Web results have no row of their own to key off, so the URL stands in
  // for an id — resolveQSources just won't find it on a later replay (see
  // its comment), which only matters for Slack's "Share to channel" copy.
  const sources: QSource[] = [
    ...hubSources,
    ...webSources.map((w) => ({ id: w.url, kind: "web" as const, label: w.title ?? w.url, client: null, url: w.url })),
  ];

  void logEvent(ACTIONS.aiAsk, { label: rawQuestion, actor });
  const askId = await recordAskLog({
    actor,
    question: rawQuestion,
    answer,
    sourceIds: sources.map((s) => s.id),
    // Hub sources only: this counts what the hub's own search matched, a
    // signal for whether retrieval worked — a live web result answers a
    // different question and would muddy that reading.
    matchedCount: hubSources.length,
    model: QA_MODEL,
    promptVersion: Q_PROMPT_VERSION,
    latencyMs,
  });

  return { answer, sources, askId, usedWebSearch };
}

/**
 * The reverse of building `sources` above: given the raw ids AskLog.sourceIds
 * stores (a flat array with no kind attached), figures out which table each
 * one actually belongs to and returns them typed the same way runQ's own
 * sources are. Needed anywhere a logged answer gets replayed or reused after
 * the fact — the Slack "Share to channel" button rebuilds its blocks this way
 * rather than trusting Slack to echo the original message back intact.
 *
 * A web source's id is its URL (see runQ), which matches no table here, so it
 * quietly drops out of a replayed answer's source list — the citation chip
 * for it still renders, just unlinked. Only "Share to channel" hits this;
 * the original answer always carries its web sources.
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
