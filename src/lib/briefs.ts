import { prisma } from "@/lib/prisma";
import { generateBriefText, screenCompetitiveFeedback, type WebCitationSource } from "@/lib/claude";
import { loadAccountDetails } from "@/lib/accounts-db";
import { ACCOUNT_TABLE_COLUMNS, accountTableRow } from "@/lib/account-table";
import { toCsv } from "@/lib/csv";

import { AREA_LABELS, areaLabel, themeLabel, competitorTopicLabel } from "@/lib/labels";
import { getTopic } from "@/lib/domain/topics";
import type { Topic } from "@/lib/domain/types";
import { GLOSSARY } from "@/lib/domain/glossary";
import type { WeekWindow } from "@/lib/week";
import { claimSource } from "@/lib/claim-source";

export type BriefKind = "client" | "competitor" | "area" | "domain";

export interface Brief {
  title: string;
  /** Standard markdown with [n] citations; web sources are listed after it. */
  markdown: string;
  usedWebSearch: boolean;
  webSources: WebCitationSource[];
  /** How many hub rows the brief was written from, so a thin one reads as thin. */
  hubEntries: number;
  /** Know your domain briefs only: the topic pages it was written from, to read in full. */
  domainTopics?: { title: string; href: string }[];
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
    // This client's own snapshot date, not the newest report: a client that
    // dropped out of the latest one has real figures from an earlier month, and
    // a brief that dates them to today would overstate them.
    account.reportAsOf
      ? `ACCOUNT RECORD (Salesforce snapshot ${account.reportAsOf.slice(0, 10)}; blank = not recorded):`
      : `ACCOUNT RECORD (no accounts report has covered this client, so these are blank):`,
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

/** More than this and the prompt is mostly the topics themselves, and the brief a list. */
export const MAX_DOMAIN_TOPICS = 4;
/** Per deep-dive section; the longest are about 2.5 KB, so this only trims outliers. */
const MAX_SECTION_CHARS = 2600;

/**
 * A brief on one or more Know your domain topics, written from the topic pages
 * and glossary in code. Optional web search is there for the figures those
 * pages date (rates, program rules, Star weights), which are the first thing to
 * go stale.
 */
/** The prompt for a Know your domain brief. Pure, so it can be printed and checked without paying for an answer. */
export function buildDomainBriefPrompt(topics: Topic[], web: boolean): { prompt: string; joined: string } {
  const blocks = topics.map((t, n) => {
    const terms = GLOSSARY.filter((g) => g.topics.includes(t.slug))
      .map((g) => `- ${g.term}${g.expansion ? ` (${g.expansion})` : ""}: ${g.short}`)
      .join("\n");
    return [
      `[${n + 1}] TOPIC — ${t.title}`,
      `Summary: ${t.summary}`,
      t.concepts.length ? `Key concepts:\n${t.concepts.map((c) => `- ${c.title}: ${c.body}`).join("\n")}` : null,
      ...t.deepDive.map((d) => `Deep dive — ${d.heading}\n${d.body.slice(0, MAX_SECTION_CHARS)}`),
      terms ? `Glossary terms in this topic:\n${terms}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");
  });

  const joined = topics.map((t) => t.title).join(" + ");
  const prompt = [
    `Write a briefing on ${joined} for a Navina colleague who needs to understand the subject well enough to follow a customer conversation: what it is, how it works, the terms they will hear, and why it matters to a primary care or value-based care customer.`,
    `Suggested sections: In one minute, How it works, Terms to know (a few, defined in a phrase), What changed recently (with the year), Why it matters to customers, Where to read more.${topics.length > 1 ? " Say how the topics connect." : ""}`,
    `Rules: write only from the topic material below${web ? " and what the web search finds" : ""}. It is general industry education from public sources, not Navina data, so do not make claims about Navina clients or product. Give the year for any rate, date, weight or rule, because these change.${web ? " Where the web shows a figure or rule has changed since the material was written, say so and say which is which." : ""} The material is still a draft: if you notice two statements that conflict, point it out instead of choosing silently. Cite by topic number, like [1].`,
    `TOPIC MATERIAL:`,
    blocks.join("\n\n---\n\n"),
  ].join("\n\n");
  return { prompt, joined };
}

/**
 * A brief on one or more Know your domain topics, written from the topic pages
 * and glossary in code. Optional web search is there for the figures those
 * pages date (rates, program rules, Star weights), which are the first thing to
 * go stale.
 */
export async function domainBrief(slugs: string[], web: boolean, apiKey?: string): Promise<Brief> {
  const topics = [...new Set(slugs)].map((s) => getTopic(s)).filter((t): t is NonNullable<typeof t> => !!t);
  if (!topics.length) throw new BriefError("Pick at least one topic.", 400);
  if (topics.length > MAX_DOMAIN_TOPICS) {
    throw new BriefError(`Pick at most ${MAX_DOMAIN_TOPICS} topics, so the brief stays readable.`, 400);
  }

  const { prompt, joined } = buildDomainBriefPrompt(topics, web);
  const brief = await run({
    title: `Know your domain brief — ${joined}`,
    role: "You are writing a plain-language briefing on healthcare and value-based care topics, from the hub's Know your domain material.",
    prompt,
    hubEntries: topics.length,
    web,
    apiKey,
  });
  return { ...brief, domainTopics: topics.map((t) => ({ title: t.title, href: `/know-your-domain/${t.slug}` })) };
}

export class BriefError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

/** A hub row the weekly competitor brief cites as [n], so the reader can open it. */
export interface WeeklyBriefSource {
  n: number;
  kind: "feedback" | "claim";
  title: string;
  /** Who said it / which competitor, and when. */
  meta: string;
  url: string | null;
}

const WEEKLY_FEEDBACK_CAP = 40;
const WEEKLY_CLAIM_CAP = 40;
/** Web search is several model turns per competitor; past this it is slow and costly. */
const WEEKLY_WEB_CAP = 8;

/**
 * Competitor rows that are a topic, not a company: nothing to match a name
 * against and nothing to search the web for.
 */
const NOT_A_COMPANY = new Set(["Market & regulatory"]);

const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const clip = (t: string, max: number) => (t.length > max ? `${t.slice(0, max)}…` : t);

/**
 * The weekly competitor brief: what clients said about competitors in a week,
 * what changed in the hub's competitor data, and public news on the
 * competitors that came up.
 *
 * Returns null for a week with nothing to say — no feedback naming a
 * competitor, no new claims, no source document edited — rather than asking the
 * model to fill a page. Claims were loaded in two large batches, so most weeks
 * are quiet and the honest brief is a short one.
 */
export async function competitorWeeklyBrief(
  week: WeekWindow,
  apiKey?: string,
): Promise<{ brief: Brief; hubSources: WeeklyBriefSource[] } | null> {
  const range = { gte: week.start, lt: week.end };

  const [competitors, insights, claims, documents] = await Promise.all([
    prisma.competitor.findMany({ select: { id: true, name: true } }),
    // The same week rule as the feedback recap: the date the client said it,
    // else the date it was imported.
    prisma.insight.findMany({
      where: { OR: [{ date: range }, { date: null, createdAt: range }] },
      orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    }),
    prisma.competitorInsight.findMany({
      where: { createdAt: range },
      include: { competitor: { select: { name: true } }, document: { select: { title: true, url: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.competitorDocument.findMany({
      where: { sourceUpdatedAt: range },
      include: { competitor: { select: { name: true } } },
      orderBy: { sourceUpdatedAt: "desc" },
    }),
  ]);

  // Names are matched as whole words, case-insensitively. A competitor whose
  // name is also an ordinary word will over-match; the prompt tells the model
  // to drop entries that are not about the competitor.
  const matchers = competitors.filter((c) => !NOT_A_COMPANY.has(c.name)).map((c) => ({
    name: c.name,
    re: new RegExp(`(?<![A-Za-z0-9])${escapeRe(c.name)}(?![A-Za-z0-9])`, "i"),
  }));
  const mentions = insights
    .map((i) => ({ i, named: matchers.filter((m) => m.re.test(`${i.oneLiner}\n${i.content}`)).map((m) => m.name) }))
    .filter((m) => m.named.length);

  // Name matches are screened before the writer sees them: most are Navina
  // features or partners, not rivals, and a writer shown them reports them as
  // rivals. Only the first WEEKLY_FEEDBACK_CAP are screened, as before.
  const candidates = mentions.slice(0, WEEKLY_FEEDBACK_CAP);
  const verdicts = await screenCompetitiveFeedback(
    candidates.map(({ i, named }) => ({ client: i.client, oneLiner: i.oneLiner, content: i.content, named })),
    apiKey,
  );
  const signals = candidates
    .map((m, k) => ({ ...m, competitor: verdicts[k].competitor }))
    .filter((_, k) => verdicts[k].competitive);

  if (!signals.length && !claims.length && !documents.length) return null;

  const hubSources: WeeklyBriefSource[] = [];
  const cite = (s: Omit<WeeklyBriefSource, "n">) => {
    const n = hubSources.length + 1;
    hubSources.push({ n, ...s });
    return n;
  };

  const feedbackText = signals.length
    ? signals
        .map(({ i, competitor }) => {
          const n = cite({
            kind: "feedback",
            title: i.oneLiner,
            meta: `${i.client ?? "Unknown client"} · ${day(i.date ?? i.createdAt)}`,
            url: i.sourceUrl,
          });
          return `[${n}] ${i.client ?? "Unknown client"} | ${day(i.date ?? i.createdAt)} | About: ${competitor ?? "unclear"}\n${i.oneLiner}\n${clip(i.content, 800)}`;
        })
        .join("\n\n---\n\n")
    : "(No client feedback logged this week was competitive.)";

  const claimText = claims.length
    ? claims
        .slice(0, WEEKLY_CLAIM_CAP)
        .map((c) => {
          // A claim pushed by the Slack sync has no document, only its own link.
          const source = claimSource(c);
          const n = cite({
            kind: "claim",
            title: c.oneLiner,
            meta: `${c.competitor.name} · ${c.confidence.toLowerCase()}${source.title ? ` · ${source.title}` : ""}`,
            url: source.url,
          });
          return `[${n}] ${c.competitor.name} | ${c.confidence}${c.sensitivity === "internal" ? " · INTERNAL" : ""} | Topics: ${c.topics.map(competitorTopicLabel).join(", ") || "none"} | As of ${day(c.asOf)}\n${c.oneLiner}\n${clip(c.content, 600)}`;
        })
        .join("\n\n---\n\n") +
      (claims.length > WEEKLY_CLAIM_CAP ? `\n\n(${claims.length - WEEKLY_CLAIM_CAP} more claims were added and are not shown.)` : "") +
      // Hundreds in one week is a bulk load of existing documents, not hundreds
      // of new developments, and reading it as the latter would mislead.
      (claims.length > 100 ? `\n\nNote: ${claims.length} claims in one week is a bulk import of existing source documents, not new developments. Say so in one line; do not summarise the claims as news.` : "")
    : "(No competitor claims were added this week.)";

  const documentText = documents.length
    ? documents.map((d) => `- ${d.competitor.name}: "${d.title}" edited ${day(d.sourceUpdatedAt)}`).join("\n")
    : "(No competitor source document was edited this week.)";

  // Public news is searched only for competitors that actually came up: all 59
  // every week would be slow and mostly noise.
  const active = [
    ...new Set([
      ...signals.flatMap((m) => (m.competitor ? [m.competitor] : m.named)),
      ...claims.map((c) => c.competitor.name),
      ...documents.map((d) => d.competitor.name),
    ]),
  ];
  const webList = active.filter((n) => !NOT_A_COMPANY.has(n)).slice(0, WEEKLY_WEB_CAP);

  const prompt = [
    `Write the weekly competitor brief for the week of ${week.label}.`,
    `Suggested sections: Headline (2-3 sentences: the single most important thing), Competitive signals from clients, What changed in our competitor data, In the news (web), What to do about it (at most 3 bullets).`,
    `Leave out any section the data does not support. The feedback below has been screened to entries weighing another company against Navina; use only those. Navina's own capabilities, features and integrations are not competitors, even when they involve a company on the list: for example the PREVENT risk score, Aledade suggestions appearing in the EMR, or athenahealth as the EMR a client runs on. An entry is a competitive signal only if the client or the note compares Navina with that company, is evaluating or choosing between them, says they are switching, being pitched or lost to them, or reports what that company's product does or costs. When in doubt, leave it out, and never present a Navina feature or a partner as a rival. If nothing qualifies, omit "Competitive signals from clients" and say in the Headline that no client feedback this week was competitive. Search the web only for companies that have a qualifying signal or a new claim${webList.length ? ` (candidates: ${webList.join(", ")})` : ""}; omit "In the news" if there are none or nothing recent. Claims marked INTERNAL are not for sharing outside Navina: keep them marked "(internal)".`,
    `CLIENT FEEDBACK WEIGHING ANOTHER COMPANY AGAINST NAVINA (${signals.length} of ${mentions.length} name matches survived screening${mentions.length > WEEKLY_FEEDBACK_CAP ? `; only the first ${WEEKLY_FEEDBACK_CAP} matches were screened` : ""}):`,
    feedbackText,
    `COMPETITOR CLAIMS ADDED THIS WEEK (${claims.length}):`,
    claimText,
    `COMPETITOR SOURCE DOCUMENTS EDITED THIS WEEK (${documents.length}):`,
    documentText,
  ].join("\n\n");

  const brief = await run({
    title: `Weekly competitor brief — ${week.label}`,
    role: "You are writing the weekly competitor brief, from what clients told us, what the hub's competitor data gained that week, and recent public news.",
    prompt,
    hubEntries: hubSources.length,
    web: webList.length > 0,
    apiKey,
  });
  return { brief, hubSources };
}
