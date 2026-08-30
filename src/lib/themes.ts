/**
 * What several clients said the same thing about.
 *
 * A recap highlight that quotes one entry from one client is just a sample. The
 * useful signal is repetition across accounts — three clients independently
 * raising unspecified ICD codes is a finding; one client raising it is a ticket.
 *
 * Phrases only, never single words: "data", "care", "open" and "workflow" all
 * clear any frequency bar you set and none of them mean anything.
 */

const STOP = new Set(
  `a an the and or but if then than that this these those of in on at to for with without from by
   as is are was were be been being it its their there here they them we our you your he she his her
   not no do does did done dont have has had will would can could should may might must more most
   other some such only own same so too very just now what which who whom when where why how all any
   both each few nor into over under again further once about against between during before after
   above below out off yes get got make makes made use uses used using need needs needed want wants
   wanted see sees seen say says said one two three per via like still even much many lot lots
   navina client clients feedback provider providers team teams user users thing things way ways`
    .split(/\s+/)
    .filter(Boolean),
);

export interface ThemeEntry {
  id: string;
  oneLiner: string;
  /** Canonical account name, so one client's variants don't count as several. */
  client: string | null;
}

export interface RecapTheme {
  /** "unspecified icd" — title-cased for display by the caller. */
  phrase: string;
  clients: string[];
  entries: number;
  /** One entry to show underneath, so the theme is anchored to real words. */
  example: { id: string; oneLiner: string };
}

function phrases(text: string): Set<string> {
  // Apostrophes collapse instead of splitting, so "don't" doesn't yield "don".
  const words = text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const out = new Set<string>();
  for (let i = 0; i + 1 < words.length; i++) {
    const [a, b] = [words[i], words[i + 1]];
    if (a.length < 3 || b.length < 3 || STOP.has(a) || STOP.has(b)) continue;
    out.add(`${a} ${b}`);
    const c = words[i + 2];
    if (c && c.length >= 3 && !STOP.has(c)) out.add(`${a} ${b} ${c}`);
  }
  return out;
}

/**
 * Themes raised by at least `minClients` distinct accounts, strongest first.
 * Entries with no client can still join a theme's entry count but never its
 * client count — an unattributed entry is not corroboration.
 */
export function crossClientThemes(
  entries: ThemeEntry[],
  { minClients = 2, limit = 3 }: { minClients?: number; limit?: number } = {},
): RecapTheme[] {
  const found = new Map<string, { clients: Set<string>; ids: Set<string>; first: ThemeEntry }>();

  for (const e of entries) {
    for (const phrase of phrases(e.oneLiner)) {
      const hit = found.get(phrase) ?? { clients: new Set<string>(), ids: new Set<string>(), first: e };
      if (e.client) hit.clients.add(e.client);
      hit.ids.add(e.id);
      found.set(phrase, hit);
    }
  }

  const ranked = [...found.entries()]
    .map(([phrase, v]) => ({
      phrase,
      clients: [...v.clients].sort(),
      entries: v.ids.size,
      example: { id: v.first.id, oneLiner: v.first.oneLiner },
    }))
    .filter((t) => t.clients.length >= minClients)
    .sort(
      (a, b) =>
        b.clients.length - a.clients.length ||
        b.entries - a.entries ||
        b.phrase.length - a.phrase.length,
    );

  // "unspecified icd" and "unspecified icd code" are one theme; keep the version
  // backed by more accounts, and the longer one when they tie.
  const kept: RecapTheme[] = [];
  for (const t of ranked) {
    const overlaps = kept.some((k) => k.phrase.includes(t.phrase) || t.phrase.includes(k.phrase));
    if (!overlaps) kept.push(t);
    if (kept.length === limit) break;
  }
  return kept;
}

/** "unspecified icd" -> "Unspecified ICD". Acronyms stay upper-case. */
const ACRONYMS = new Set(["icd", "raf", "hcc", "ehr", "hie", "cdi", "awv", "api", "emr", "aco", "mso", "pmpm", "vbc"]);

export function themeLabel(phrase: string): string {
  return phrase
    .split(" ")
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w))
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}
