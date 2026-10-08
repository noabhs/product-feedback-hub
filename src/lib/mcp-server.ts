import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { insightWhere } from "@/lib/insight-filters";
import { loadAccountDetails } from "@/lib/accounts-db";
import { AREA_LABELS, THEME_LABELS, COMPETITOR_TOPIC_LABELS, CONFIDENCE_LABELS } from "@/lib/labels";
import { COMPETITOR_CATEGORIES } from "@/lib/competitor-categories";
import { FEATURE_REQUEST_STATUSES } from "@/lib/feature-request-status";

/**
 * Read-only tools over the hub's data, for a person's own Claude. Raw rows
 * only — no Ask Q here: the caller's Claude does the reasoning.
 */

const MAX_LIMIT = 100;
const limitSchema = z.number().int().min(1).max(MAX_LIMIT).default(25).describe(`Rows to return (max ${MAX_LIMIT})`);
const offsetSchema = z.number().int().min(0).default(0).describe("Rows to skip, for paging");

function result(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function toSearchParams(input: Record<string, string | string[] | undefined>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue;
    for (const item of Array.isArray(v) ? v : [v]) sp.append(k, item);
  }
  return sp;
}

export function createHubMcpServer(onCall: (tool: string) => void): McpServer {
  const server = new McpServer({ name: "navina-insights-hub", version: "1.0.0" });

  // Wraps a handler so every call is recorded against the token's owner.
  const tool = <S extends z.ZodRawShape>(
    name: string,
    description: string,
    shape: S,
    handler: (args: z.infer<z.ZodObject<S>>) => Promise<unknown>,
  ) => {
    server.registerTool(
      name,
      { description, inputSchema: shape, annotations: { readOnlyHint: true, openWorldHint: false } },
      (async (args: z.infer<z.ZodObject<S>>) => {
        onCall(name);
        return result(await handler(args));
      }) as never,
    );
  };

  tool(
    "list_filter_values",
    "The valid product areas, themes, competitor topics, competitor categories, confidence levels and feature-request statuses. Call this first to learn the vocabulary the other tools filter by.",
    {},
    async () => ({
      productAreas: AREA_LABELS,
      themes: THEME_LABELS,
      competitorTopics: COMPETITOR_TOPIC_LABELS,
      competitorCategories: COMPETITOR_CATEGORIES,
      confidenceLevels: CONFIDENCE_LABELS,
      featureRequestStatuses: FEATURE_REQUEST_STATUSES,
    }),
  );

  tool(
    "search_feedback",
    "Search client feedback (insights), newest first. All filters are optional and combine with AND. productArea matches entries that touch ANY of the given areas.",
    {
      search: z.string().optional().describe("Text matched against one-liner, content, client and persona"),
      client: z.array(z.string()).optional().describe("Exact account names (see list_clients)"),
      productArea: z.array(z.string()).optional().describe("Area keys from list_filter_values"),
      theme: z.array(z.string()).optional().describe("Theme keys from list_filter_values"),
      limit: limitSchema,
      offset: offsetSchema,
    },
    async ({ limit, offset, ...filters }) => {
      const where = insightWhere(toSearchParams(filters));
      const [rows, total] = await Promise.all([
        prisma.insight.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
          select: {
            id: true, oneLiner: true, content: true, client: true, productAreas: true, theme: true,
            persona: true, sourceName: true, sourceUrl: true, sourceType: true, date: true, wtp: true,
            _count: { select: { comments: true } },
          },
        }),
        prisma.insight.count({ where }),
      ]);
      return { total, returned: rows.length, offset, insights: rows };
    },
  );

  tool(
    "get_feedback",
    "One feedback entry by id, with its comments.",
    { id: z.string() },
    async ({ id }) => {
      const row = await prisma.insight.findUnique({
        where: { id },
        include: { comments: { orderBy: { createdAt: "asc" } } },
      });
      return row ?? { error: "Not found" };
    },
  );

  tool(
    "list_clients",
    "Every client account with its Salesforce snapshot (health, ARR, renewal date, CSM, EHR, segment, products) and feedback count. Figures are as of reportAsOf; archived accounts have archivedAt set.",
    {
      search: z.string().optional().describe("Case-insensitive substring of the account name"),
      includeArchived: z.boolean().default(false),
    },
    async ({ search, includeArchived }) => {
      const q = search?.trim().toLowerCase();
      const all = await loadAccountDetails();
      return all.filter(
        (a) => (includeArchived || !a.archivedAt) && (!q || a.name.toLowerCase().includes(q)),
      );
    },
  );

  tool(
    "list_competitors",
    "Tracked competitors with category, positioning, overview, key facts, differentiation and how many claims we hold on each.",
    { category: z.string().optional().describe("One of competitorCategories from list_filter_values") },
    async ({ category }) => {
      const rows = await prisma.competitor.findMany({
        where: category ? { category } : undefined,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { insights: true } }, sources: { select: { label: true, url: true, type: true } } },
      });
      return rows.map(({ _count, ...c }) => ({ ...c, sortOrder: undefined, claimCount: _count.insights }));
    },
  );

  tool(
    "search_competitor_claims",
    "Discrete claims about competitors, each with confidence (VERIFIED/REPORTED/CLAIMED), sensitivity and as-of date. Treat sensitivity=internal claims as not for sharing outside Navina.",
    {
      competitor: z.string().optional().describe("Competitor name (case-insensitive exact)"),
      topic: z.array(z.string()).optional().describe("Topic keys from list_filter_values"),
      productArea: z.array(z.string()).optional(),
      confidence: z.array(z.string()).optional(),
      search: z.string().optional(),
      limit: limitSchema,
      offset: offsetSchema,
    },
    async ({ competitor, topic, productArea, confidence, search, limit, offset }) => {
      const where = {
        ...(competitor ? { competitor: { name: { equals: competitor, mode: "insensitive" as const } } } : {}),
        ...(topic?.length ? { topics: { hasSome: topic } } : {}),
        ...(productArea?.length ? { productAreas: { hasSome: productArea } } : {}),
        ...(confidence?.length ? { confidence: { in: confidence } } : {}),
        ...(search?.trim()
          ? {
              OR: [
                { oneLiner: { contains: search.trim(), mode: "insensitive" as const } },
                { content: { contains: search.trim(), mode: "insensitive" as const } },
              ],
            }
          : {}),
      };
      const [rows, total] = await Promise.all([
        prisma.competitorInsight.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
          select: {
            id: true, oneLiner: true, content: true, topics: true, productAreas: true, confidence: true,
            sensitivity: true, sensitivityReason: true, asOf: true,
            competitor: { select: { name: true } },
            document: { select: { title: true, url: true } },
          },
        }),
        prisma.competitorInsight.count({ where }),
      ]);
      return { total, returned: rows.length, offset, claims: rows };
    },
  );

  tool(
    "list_feature_requests",
    "Internally-reported feature requests (not client feedback), newest first.",
    { status: z.string().optional().describe("One of featureRequestStatuses from list_filter_values"), limit: limitSchema, offset: offsetSchema },
    async ({ status, limit, offset }) => {
      const where = status ? { status } : undefined;
      const [rows, total] = await Promise.all([
        prisma.featureRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip: offset, take: limit }),
        prisma.featureRequest.count({ where }),
      ]);
      return { total, returned: rows.length, offset, featureRequests: rows };
    },
  );

  tool(
    "search_discovery_questions",
    "Discovery-call questions by product area and theme.",
    {
      search: z.string().optional(),
      productArea: z.string().optional(),
      theme: z.string().optional(),
      limit: limitSchema,
      offset: offsetSchema,
    },
    async ({ search, productArea, theme, limit, offset }) => {
      const q = search?.trim();
      const where = {
        ...(productArea ? { productArea } : {}),
        ...(theme ? { theme } : {}),
        ...(q
          ? {
              OR: [
                { question: { contains: q, mode: "insensitive" as const } },
                { notesIntent: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };
      const [rows, total] = await Promise.all([
        prisma.discoveryQuestion.findMany({ where, orderBy: { createdAt: "desc" }, skip: offset, take: limit }),
        prisma.discoveryQuestion.count({ where }),
      ]);
      return { total, returned: rows.length, offset, questions: rows };
    },
  );

  return server;
}
