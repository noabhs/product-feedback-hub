import { prisma } from "@/lib/prisma";
import { generateBriefText, type WebCitationSource } from "@/lib/claude";
import { loadAccountDetails } from "@/lib/accounts-db";
import { ACCOUNT_TABLE_COLUMNS, accountTableRow } from "@/lib/account-table";
import { toCsv } from "@/lib/csv";
import { REPORT_AS_OF } from "@/lib/accounts";
import { AREA_LABELS, areaLabel, themeLabel, competitorTopicLabel } from "@/lib/labels";

export type BriefKind = "client" | "competitor" | "area";

export interface Brief {
  title: string;
  /** Standard markdown with [n] citations; web sources are listed after it. */
  markdown: string;
  usedWebSearch: boolean;
  webSources: WebCitationSource[];
  /** How many hub rows the brief was written from, so a thin one reads as thin. */
  hubEntries: number;
}

/** Newest first, and capped: past this a prompt is mostly noise and cost. */
const MAX_INSIGHTS = 120;
const MAX_CLAIMS = 150;

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "undated");

const STYLE = `Write for Navina's product team, who will paste this into Slack or a doc.
- Markdown: a short title line is added for you, so start straight at the first
  section. Use ## section headings, short bullets, **bold** for key points.
- Be specific and concrete; keep names, numbers and quotes exactly as the source
  gave them. Never invent facts — if the hub has nothing on something, say so.
- Cite hub entries inline as [n] using the numbers in the data. Keep it to what
  a busy person reads in two minutes; aim for under 500 words.`;

const WEB_RULES = `You also have a web search tool. Use it for recent, public facts the hub
cannot hold (news, launches, funding, pricing, partnerships). Say clearly which
statements come from the web and which from the hub, and do not let a web
result override a hub fact without flagging the disagreement.`;

function system(role: string, web: boolean): string {
  return `You are a product researcher for Navina, an AI-powered clinical intelligence
platform. ${role}\n\n${STYLE}${web ? `\n\n${WEB_RULES}` : ""}`;
}

async function run(opts: {
  title: string;
  role: string;
  prompt: string;
  hubEntries: number;
  web: boolean;
  apiKey?: string;
}): Promise<Brief> {
  const out = await generateBriefText({
    system: system(opts.role, opts.web),
    prompt: opts.prompt,
    webSearch: opts.web,
    apiKey: opts.apiKey,
  });
  return {
    title: opts.title,
    markdown: out.text,
    usedWebSearch: out.usedWebSearch,
    webSources: out.webSources,
    hubEntries: opts.hubEntries,
  };
}

export async function clientBrief(name: string, apiKey?: string): Promise<Brief> {
  const [accounts, insights] = await Promise.all([
    loadAccountDetails(),
    prisma.insight.findMany({
      where: { client: name },
      orderBy: { date: { sort: "desc", nulls: "last" } },
      take: MAX_INSIGHTS,
    }),
  ]);
  const account = accounts.find((a) => a.name === name);
  if (!account) throw new BriefError(`No client called "${name}".`, 404);

  const feedback = insights.length
    ? insights
        .map(
          (i, n) =>
            `[${n + 1}] ${day(i.date)} | Areas: ${i.productAreas.map(areaLabel).join(", ") || "none"} | Theme: ${themeLabel(i.theme)}${i.persona ? ` | Persona: ${i.persona}` : ""}\n${i.oneLiner}\n${i.content}`,
        )
        .join("\n\n---\n\n")
    : "(No feedback entries are filed against this client.)";

  const prompt = [
    `Write a client brief for ${name}: who they are commercially, what they have told us, and what to be ready for in the next conversation with them.`,
    `Suggested sections: Snapshot (health, products, ARR, renewal, owner/CSM), What they keep telling us (grouped themes), Risks & opportunities, Suggested talking points.`,
    `ACCOUNT RECORD (Salesforce snapshot ${REPORT_AS_OF}; blank = not in that report):`,
    toCsv([...ACCOUNT_TABLE_COLUMNS], [accountTableRow(account)]),
    `FEEDBACK FROM ${name} (${insights.length} entries, newest first):`,
    feedback,
  ].join("\n\n");

  return run({
    title: `Client brief — ${name}`,
    role: "You are writing a brief about one client, from the hub's data only.",
    prompt,
    hubEntries: insights.length,
    web: false,
    apiKey,
  });
}

export async function competitorBrief(id: string, apiKey?: string): Promise<Brief> {
  const competitor = await prisma.competitor.findUnique({
    where: { id },
    include: {
      insights: { orderBy: { createdAt: "desc" }, take: MAX_CLAIMS },
      sources: true,
    },
  });
  if (!competitor) throw new BriefError("Competitor not found.", 404);

  const claims = competitor.insights.length
    ? competitor.insights
        .map(
          (c, n) =>
            `[${n + 1}] ${c.confidence}${c.sensitivity === "internal" ? " · INTERNAL" : ""} | Topics: ${c.topics.map(competitorTopicLabel).join(", ") || "none"} | As of ${day(c.asOf)}\n${c.oneLiner}\n${c.content}`,
        )
        .join("\n\n---\n\n")
    : "(No claims have been extracted for this competitor yet.)";

  // The hub's own feedback that names them, so the brief can say what clients
  // actually say, not only what the competitor says about itself.
  const mentions = await prisma.insight.findMany({
    where: {
      OR: [
        { oneLiner: { contains: competitor.name, mode: "insensitive" } },
        { content: { contains: competitor.name, mode: "insensitive" } },
      ],
    },
    orderBy: { date: { sort: "desc", nulls: "last" } },
    take: 20,
  });
  const offset = competitor.insights.length;
  const mentionText = mentions.length
    ? mentions.map((i, n) => `[${offset + n + 1}] ${i.client ?? "Unknown client"} | ${day(i.date)}\n${i.oneLiner}\n${i.content}`).join("\n\n---\n\n")
    : "(No client feedback mentions them by name.)";

  const prompt = [
    `Write a competitor brief on ${competitor.name}: how they position, what they do well, where Navina is stronger or weaker, and what to say when they come up. Search the web for recent news before writing.`,
    `Suggested sections: Who they are, Recent moves (web), Strengths, Weaknesses, How we compare, What clients say, Talking points.`,
    `COMPETITOR RECORD:`,
    [
      `Name: ${competitor.name}`,
      `Category: ${competitor.category}${competitor.subgroup ? ` / ${competitor.subgroup}` : ""}`,
      competitor.positioning && `Positioning: ${competitor.positioning}`,
      competitor.website && `Website: ${competitor.website}`,
      competitor.overview && `Overview: ${competitor.overview}`,
      competitor.keyFacts && `Key facts:\n${competitor.keyFacts}`,
      competitor.differentiation && `How we differ (CI Launcher's framing): ${competitor.differentiation}`,
    ]
      .filter(Boolean)
      .join("\n"),
    `CLAIMS EXTRACTED FROM SOURCES (confidence VERIFIED > REPORTED > CLAIMED; INTERNAL means not for sharing outside Navina — keep those points marked "(internal)"):`,
    claims,
    `CLIENT FEEDBACK THAT MENTIONS ${competitor.name}:`,
    mentionText,
  ].join("\n\n");

  return run({
    title: `Competitor brief — ${competitor.name}`,
    role: "You are writing a brief about one competitor, from the hub's data and the web.",
    prompt,
    hubEntries: competitor.insights.length + mentions.length,
    web: true,
    apiKey,
  });
}

export async function areaBrief(areas: string[], apiKey?: string): Promise<Brief> {
  const valid = areas.filter((a) => a in AREA_LABELS);
  if (!valid.length) throw new BriefError("Pick at least one product area.", 400);
  const labels = valid.map(areaLabel);

  const [insights, claims] = await Promise.all([
    prisma.insight.findMany({
      where: { productAreas: { hasSome: valid } },
      orderBy: { date: { sort: "desc", nulls: "last" } },
      take: MAX_INSIGHTS,
    }),
    prisma.competitorInsight.findMany({
      where: { productAreas: { hasSome: valid } },
      include: { competitor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const feedback = insights.length
    ? insights
        .map((i, n) => `[${n + 1}] ${i.client ?? "Unknown client"} | ${day(i.date)} | Theme: ${themeLabel(i.theme)} | Areas: ${i.productAreas.map(areaLabel).join(", ")}\n${i.oneLiner}\n${i.content}`)
        .join("\n\n---\n\n")
    : "(No feedback entries are tagged with these areas.)";
  const offset = insights.length;
  const competitorText = claims.length
    ? claims.map((c, n) => `[${offset + n + 1}] ${c.competitor.name} | ${c.confidence}${c.sensitivity === "internal" ? " · INTERNAL" : ""}\n${c.oneLiner}\n${c.content}`).join("\n\n---\n\n")
    : "(No competitor claims are tagged with these areas.)";

  const joined = labels.join(" + ");
  const prompt = [
    `Write a product area brief for ${joined}: what clients are asking for and complaining about, how the market is moving, and what it means for the product. Search the web for recent market developments in ${labels.join(", ")} for healthcare/value-based care before writing.`,
    `Suggested sections: Summary, What clients are telling us (themes, with client names), Market & competitors (web + hub), Gaps & opportunities, Suggested next steps.${valid.length > 1 ? " Note where the areas overlap." : ""}`,
    `CLIENT FEEDBACK TAGGED ${joined} (${insights.length}${insights.length === MAX_INSIGHTS ? "+, newest shown" : ""}):`,
    feedback,
    `COMPETITOR CLAIMS TAGGED ${joined}:`,
    competitorText,
  ].join("\n\n");

  return run({
    title: `Product area brief — ${joined}`,
    role: "You are writing a brief about one or more product areas, from the hub's data and the web.",
    prompt,
    hubEntries: insights.length + claims.length,
    web: true,
    apiKey,
  });
}

export class BriefError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}
