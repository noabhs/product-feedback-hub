import { GLOSSARY, termId } from "./glossary";
import { TOPICS } from "./topics";
import type { GlossaryTerm } from "./types";

/**
 * Retrieval over the Know your domain content, for "Ask Q".
 *
 * The content is small, static and lives in code, so this is plain keyword
 * scoring rather than a database query or an embedding lookup. It returns a
 * handful of glossary terms and deep-dive sections that Q can cite next to the
 * hub's own feedback, competitor and feature request sources.
 *
 * Ids are stable strings ("domain:term:hcc", "domain:section:risk-adjustment:3")
 * so a stored answer's source list can be rebuilt later from code alone, with
 * no table to look them up in. See resolveDomainSource.
 */

export interface DomainHit {
  /** "domain:term:<termId>" or "domain:section:<topicSlug>:<index>". */
  id: string;
  kind: "term" | "section";
  /** Short name shown in the sources list. */
  label: string;
  /** Where in the hub the reader can open it. */
  href: string;
  /** What goes into the prompt. */
  text: string;
}

const MAX_TERMS = 6;
const MAX_SECTIONS = 2;
/** Keeps a long section from crowding out the hub's own sources in the prompt. */
const MAX_SECTION_CHARS = 2600;

/**
 * Words that carry no subject. Includes words that describe the hub itself
 * ("feedback", "clients"), so a question about what clients said does not pull
 * in definitions just because it contains "client".
 */
const STOPWORDS = new Set(
  (
    "a an and are as at be but by can could did do does for from had has have how i if in into is it its " +
    "me my of on or our should so than that the their them then there these they this to us was we were " +
    "what when where which who whom why will with would you your about across after also any been being " +
    "between both each few more most other some such than too very just like mean means meaning explain " +
    "tell show give list define definition difference different between vs versus " +
    "navina hub feedback client clients customer customers feature features request requests competitor " +
    "competitors product products say said saying mention mentioned"
  ).split(" "),
);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The names a term can be asked about by: the term, each part of its expansion, and any acronym inside it. */
function namesOf(t: GlossaryTerm): string[] {
  const names = new Set<string>([t.term]);
  // A part of the name that carries a number is a name in its own right: people
  // ask about "V28", not "CMS-HCC V28".
  for (const part of t.term.split(/[\s/]+/)) if (/\d/.test(part) && part.length >= 2) names.add(part);
  for (const part of (t.expansion ?? "").split(/,|;/)) {
    const clean = part.replace(/\(.*?\)/g, " ").trim();
    if (clean.length >= 2) names.add(clean);
    for (const m of part.matchAll(/\(([^)]+)\)/g)) names.add(m[1].trim());
  }
  return [...names];
}

function mentions(question: string, name: string): boolean {
  // "star rating" should find "Star Ratings", and the other way round.
  const base = name.length > 4 && name.toLowerCase().endsWith("s") ? name.slice(0, -1) : name;
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(base)}s?([^a-z0-9]|$)`, "i").test(question);
}

function termText(t: GlossaryTerm): string {
  const head = t.expansion ? `${t.term} (${t.expansion})` : t.term;
  return `${head}: ${t.short} ${t.explanation}`;
}

function scoreTerm(question: string, qTokens: Set<string>, t: GlossaryTerm): number {
  let score = 0;
  for (const name of namesOf(t)) {
    if (mentions(question, name)) {
      score += name === t.term ? 13 : 10;
      break;
    }
  }
  const head = new Set(tokens(`${t.term} ${t.expansion ?? ""} ${t.short}`));
  const body = new Set(tokens(t.explanation));
  let overlap = 0;
  for (const q of qTokens) {
    if (head.has(q)) overlap += 2;
    else if (body.has(q)) overlap += 1;
  }
  return score + Math.min(overlap, 6);
}

export function searchDomain(question: string): DomainHit[] {
  const qTokens = new Set(tokens(question));
  if (qTokens.size === 0 && !question.trim()) return [];

  const termHits = GLOSSARY.map((t) => ({ t, score: scoreTerm(question, qTokens, t) }))
    // A name match (10+) is enough alone; otherwise it takes several shared words.
    .filter((x) => x.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_TERMS)
    .map(({ t }): DomainHit => ({
      id: `domain:term:${termId(t.term)}`,
      kind: "term",
      label: `Glossary: ${t.term}`,
      href: `/know-your-domain/glossary#${termId(t.term)}`,
      text: termText(t),
    }));

  const sectionHits = TOPICS.flatMap((topic) =>
    topic.deepDive.map((s, index) => {
      const heading = new Set(tokens(`${topic.title} ${s.heading}`));
      const body = new Set(tokens(s.body));
      let score = 0;
      let bodyOverlap = 0;
      for (const q of qTokens) {
        if (heading.has(q)) score += 3;
        else if (body.has(q)) bodyOverlap += 1;
      }
      score += Math.min(bodyOverlap, 8);
      return { topic, s, index, score };
    }),
  )
    .filter((x) => x.score >= 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SECTIONS)
    .map(({ topic, s, index }): DomainHit => ({
      id: `domain:section:${topic.slug}:${index}`,
      kind: "section",
      label: `${topic.title}: ${s.heading}`,
      href: `/know-your-domain/${topic.slug}`,
      text: `${topic.title} — ${s.heading}\n${s.body.slice(0, MAX_SECTION_CHARS)}`,
    }));

  return [...termHits, ...sectionHits];
}

/**
 * Rebuilds a hit's display fields from its id, for replaying a stored answer
 * (Slack's "Share to channel"). Returns null for an id that no longer exists,
 * such as a term renamed or removed since the answer was written.
 */
export function resolveDomainSource(id: string): Pick<DomainHit, "id" | "label" | "href"> | null {
  const parts = id.split(":");
  if (parts[0] !== "domain") return null;
  if (parts[1] === "term") {
    const t = GLOSSARY.find((g) => termId(g.term) === parts[2]);
    return t ? { id, label: `Glossary: ${t.term}`, href: `/know-your-domain/glossary#${termId(t.term)}` } : null;
  }
  if (parts[1] === "section") {
    const topic = TOPICS.find((x) => x.slug === parts[2]);
    const s = topic?.deepDive[Number(parts[3])];
    return topic && s ? { id, label: `${topic.title}: ${s.heading}`, href: `/know-your-domain/${topic.slug}` } : null;
  }
  return null;
}
