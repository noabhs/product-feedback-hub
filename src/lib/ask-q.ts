import { prisma } from "@/lib/prisma";
import {
  answerGlobalQuestion,
  standaloneQuestion,
  QA_MODEL,
  Q_PROMPT_VERSION,
  Q_FOLLOWUP_PROMPT_VERSION,
  type QCompetitor,
} from "@/lib/claude";
import { loadAccountDetails, loadAccounts } from "@/lib/accounts-db";
import { searchInsights } from "@/lib/insight-search";
import { expandQuestion, readAsNote, rewriteQuestion } from "@/lib/synonyms";
import { recordAskLog } from "@/lib/ask-log";
import { recordConversationTurn } from "@/lib/ask-conversation";
import {
  hasWebSearchTrigger,
  historyForModel,
  mergeIntoPool,
  stripWebSearchTrigger,
  type QSource,
} from "@/lib/ask-history";
import { searchDomain, resolveDomainSource } from "@/lib/domain/search";
import { selectCompetitors, selectFeatureRequests } from "@/lib/ask-select";
import { logEvent, ACTIONS } from "@/lib/events";
import type { FeatureRequestItem } from "@/lib/types";

const iso = (d: Date | null) => d?.toISOString() ?? null;

export type { QSource };

export interface QResult {
  answer: string;
  /** Position is the citation number: [n] is sources[n - 1]. In a conversation
   *  this is the whole shared pool, so it only ever grows. */
  sources: QSource[];
  askId: string | null;
  usedWebSearch: boolean;
  /** Only on a conversation's follow-up: what retrieval actually ran on. */
  standaloneQuestion?: string | null;
}

/** What a turn of a conversation needs to know about the turns before it. */
export interface QConversation {
  id: string;
  /** This turn's slot — 0 for the first question. */
  turnIndex: number;
  history: { question: string; answer: string }[];
  pool: QSource[];
}

// Moved to ask-history.ts so it can be tested without a database; re-exported
// because the Slack interactions route imports it from here.
export { hasWebSearchTrigger };

/**
 * "Q" over the whole hub — feedback, competitors, feature requests, the client
 * table, and the Know your domain glossary and topics. Pulled out of the route handler so it has no dependency on
 * NextRequest/NextResponse: the home page's Ask box and the Slack /ask command
 * both call this and log to the same AskLog, so a rating means the same thing
 * regardless of where the question came from.
 */
export async function runQ(
  rawQuestion: string,
  actor: string,
  apiKey?: string,
  conversation?: QConversation,
): Promise<QResult> {
  const { question: typed, wantsWebSearch } = stripWebSearchTrigger(rawQuestion);
  const history = conversation ? historyForModel(conversation.history) : [];
  const isFollowUp = history.length > 0;

  // Retrieval only sees question text, so a follow-up like "and for Epic?" has
  // to be turned into a question that stands alone before anything searches on
  // it. If the rewrite fails, the previous question plus this one is a blunter
  // way to carry the subject forward.
  const standalone = isFollowUp ? await standaloneQuestion(history, typed, apiKey) : null;
  const question = isFollowUp ? (standalone ?? `${history[history.length - 1].question} ${typed}`) : typed;

  const accountsLike = await loadAccounts();
  // Static content in code, so no query: matched against the question as asked.
  const domain = searchDomain(question);

  const [insights, accounts, competitorRows, featureRequests] = await Promise.all([
    searchInsights(question, accountsLike),
    // The whole client table goes with every question, so a question about the
    // accounts — "how many clients run HIE" — is answerable on its own terms.
    loadAccountDetails(),
    prisma.competitor.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.featureRequest.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);

  const allCompetitors: QCompetitor[] = competitorRows.map((c) => ({
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

  const allRequests: FeatureRequestItem[] = featureRequests.map((f) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    painToSolve: f.painToSolve,
    reporter: f.reporter,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }));

  // Only the competitors and ideas this question is about, not the whole set —
  // everything sent is a numbered, citable source, so the rest was just noise.
  const pickedCompetitors = selectCompetitors(question, allCompetitors);
  const pickedRequests = selectFeatureRequests(question, allRequests);
  const competitors = pickedCompetitors.items;
  const requests = pickedRequests.items;
  const scope = {
    competitors: { shown: competitors.length, total: pickedCompetitors.total, all: pickedCompetitors.all },
    requests: { shown: requests.length, total: pickedRequests.total, all: pickedRequests.all },
  };

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
    ...domain.map((d) => ({ id: d.id, kind: "domain" as const, label: d.label, client: null, href: d.href })),
  ];

  // The pool is what makes a citation mean the same thing from turn to turn: a
  // source keeps the number it first got, new ones are appended. A one-shot ask
  // starts from an empty pool, which numbers hubSources 1..n exactly as before.
  const { pool: hubPool, numbers } = mergeIntoPool(conversation?.pool ?? [], hubSources);

  const startedAt = Date.now();
  const { text: modelAnswer, usedWebSearch, webSources } = await answerGlobalQuestion(
    asModelSeesIt,
    insights,
    accounts,
    competitors,
    requests,
    domain,
    apiKey,
    readAs,
    wantsWebSearch,
    hubPool.length,
    isFollowUp ? { history, numbers } : conversation ? { history: [], numbers } : undefined,
    scope,
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
    : wantsWebSearch || isFollowUp
      ? modelAnswer
      : `${modelAnswer}\n\n💡 **Tip:** add "search web" anywhere in your question to also pull in live web results.`;

  // Web results have no row of their own to key off, so the URL stands in
  // for an id — resolveQSources just won't find it on a later replay (see
  // its comment), which only matters for Slack's "Share to channel" copy.
  const sources: QSource[] = [
    ...hubPool,
    ...webSources.map((w) => ({ id: w.url, kind: "web" as const, label: w.title ?? w.url, client: null, url: w.url })),
  ];

  void logEvent(ACTIONS.aiAsk, { label: rawQuestion, actor });
  const promptVersion = isFollowUp ? Q_FOLLOWUP_PROMPT_VERSION : Q_PROMPT_VERSION;
  if (conversation) {
    const askId = await recordConversationTurn({
      actor,
      conversationId: conversation.id,
      turnIndex: conversation.turnIndex,
      question: rawQuestion,
      standaloneQuestion: standalone,
      answer,
      pool: sources,
      matchedCount: hubSources.length,
      model: QA_MODEL,
      promptVersion,
      latencyMs,
    });
    return { answer, sources, askId, usedWebSearch, standaloneQuestion: standalone };
  }
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
    promptVersion,
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
  // Domain ids are not rows: they are rebuilt from the content in code.
  for (const id of ids) {
    const d = resolveDomainSource(id);
    if (d) byId.set(id, { id, kind: "domain", label: d.label, client: null, href: d.href });
  }

  // ids, not byId's own order — a citation's [n] maps to this array's
  // position, and a row deleted since the original answer just drops out
  // rather than shifting every citation after it.
  return ids.map((id) => byId.get(id)).filter((s): s is QSource => !!s);
}
