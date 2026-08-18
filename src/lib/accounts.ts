/**
 * The canonical client list, from Navina's accounts report (Aug 2026).
 *
 * Client used to be free text, which produced "DTC", "DTC — Lynn" and "DTC
 * Family Health" as three separate clients in every chart and filter. Feedback
 * now points at one of these accounts or at nothing at all.
 *
 * `aliases` are never displayed — they exist so historical spellings, acronyms
 * and former names ("CareMax", "Wellforce", "NOMS", "TGH") still resolve to the
 * right account. Names cleaned for display; the "(FKA ...)" notes from the
 * report live in aliases instead.
 */

export interface SeedAccount {
  name: string;
  aliases?: string[];
}

/**
 * Not a client — the internal advisory panel. Feedback from advisor sessions
 * was filed under half a dozen workshop names; all of it collapses to this.
 */
export const ADVISORS = "Advisors";

export const SEED_ACCOUNTS: SeedAccount[] = [
  { name: ADVISORS, aliases: ["Advisor", "Advisory", "Advisory Board", "Pop Health Advisors", "Pop Health Advisors Workshop"] },
  { name: "Adventist Healthcare" },
  { name: "Aegis Medical Group", aliases: ["Aegis"] },
  { name: "agilon health", aliases: ["agilon"] },
  { name: "Alliance for Integrated Care of New York", aliases: ["AICNY", "Alliance for Integrated Care"] },
  { name: "Amite County Medical Services" },
  { name: "ArchesMed", aliases: ["Arches", "Arches Medical", "Arches Medical Onsite"] },
  { name: "Atlas Oncology Partners" },
  { name: "Bookmark Medical", aliases: ["Bookmark", "Rural Healthcare Group"] },
  { name: "Cano Health" },
  { name: "Cardiovascular Associates of America" },
  { name: "Carle Health" },
  { name: "Carolina Pines Regional Medical Center" },
  { name: "Catalyst Health Group" },
  { name: "Center for Primary Care" },
  { name: "Christie Clinic" },
  { name: "Citadel", aliases: ["Aylo", "Aylo Health", "Eagles Landing Health"] },
  { name: "ClareMedica Health Partners", aliases: ["ClareMedica", "CareMax", "Caremax"] },
  { name: "ConvenientMD" },
  { name: "CVFP Medical Group", aliases: ["CVFP"] },
  { name: "Doctors Health of South Florida" },
  { name: "DTC Family Health", aliases: ["DTC"] },
  { name: "Edinger Medical Group" },
  { name: "Evergreen Nephrology" },
  { name: "Family Practice of Cadillac" },
  { name: "First Medical Associates", aliases: ["Doctors First"] },
  { name: "First Valley Medical Group" },
  { name: "Gather Health" },
  { name: "Genuine Health Group" },
  { name: "Glacier Medical Associates" },
  { name: "Granger Medical Clinic" },
  { name: "Greater Good Health" },
  { name: "HarmonyCares", aliases: ["Harmony Cares", "Harmony"] },
  { name: "HealthStar Physicians", aliases: ["HealthStar"] },
  { name: "HealthTexas Medical Group", aliases: ["HealthTexas"] },
  { name: "Herself Health" },
  { name: "Holzer Health System", aliases: ["Holzer"] },
  { name: "Hopscotch Primary Care", aliases: ["Hopscotch"] },
  { name: "Hudson Headwaters Health Network", aliases: ["HHHN", "Hudson Headwaters"] },
  { name: "Ilumed" },
  { name: "iMA Medical Group" },
  { name: "IMA of South Florida" },
  { name: "Innovacare Health", aliases: ["InnovaCare"] },
  { name: "Internal Medicine Associates & Specialties" },
  { name: "IntraCare Premier ACO", aliases: ["IntraCare"] },
  { name: "Jefferson City Medical Group", aliases: ["JCMG"] },
  { name: "Kaiser Foundation Health Plan of Colorado" },
  { name: "Kaiser Foundation Health Plan of the Mid-Atlantic States" },
  { name: "Kaiser Permanente Nevada" },
  { name: "Lifespark" },
  { name: "Loudoun Medical Group", aliases: ["Loudoun", "LMG"] },
  { name: "Matter Health" },
  { name: "Medical Consultants of Florida", aliases: ["MCF"] },
  { name: "MediSys Health Network", aliases: ["MediSys"] },
  { name: "MedNetOne Health Solutions", aliases: ["MedNetOne"] },
  { name: "MFM Health", aliases: ["MFM"] },
  { name: "Mid-Atlantic Permanente Medical Group" },
  { name: "Millennium Physician Group", aliases: ["MPG", "Millennium"] },
  { name: "Mirra Health Services", aliases: ["Mirra"] },
  { name: "Mountain Laurel Medical Center", aliases: ["Mountain Laurel"] },
  { name: "NeueHealth MSO", aliases: ["NeueHealth"] },
  { name: "North East Medical Services" },
  { name: "Northern Ohio Medical Specialists Healthcare", aliases: ["NOMS"] },
  { name: "Northwest Permanente Physicians", aliases: ["Kaiser Permanente Northwest Physicians"] },
  { name: "Ogden Clinic", aliases: ["Ogden"] },
  { name: "Olmsted Medical Center Physicians", aliases: ["Olmsted"] },
  { name: "On Belay Health Solutions", aliases: ["On Belay"] },
  { name: "OnPoint Medical Group", aliases: ["OnPoint"] },
  { name: "Osvaldo A Torres MD" },
  { name: "Palm Medical Centers", aliases: ["Palm Medical", "Health Holdings"] },
  { name: "Physicians Primary Care" },
  { name: "Primary Medical Care Center and Urgent Care Clinic" },
  { name: "PrimeHealth Physicians", aliases: ["PrimeHealth"] },
  { name: "Primus Health Network", aliases: ["Primus"] },
  { name: "Privia Health", aliases: ["Privia"] },
  { name: "Rancho Family Medical Group", aliases: ["Rancho", "Rancho Health"] },
  { name: "SC House Calls" },
  { name: "SFP Health Group", aliases: ["SFP"] },
  { name: "Southeast Primary Care Partners", aliases: ["Southeast", "SEMG"] },
  { name: "Sprinter Health", aliases: ["Sprinter"] },
  { name: "Summit Medical Group", aliases: ["Summit"] },
  { name: "Tampa General Hospital", aliases: ["TGH", "Tampa General"] },
  { name: "TECQ Partners", aliases: ["TECQ"] },
  { name: "The Harbor Health Team", aliases: ["Harbor Health Team", "Harbor Health"] },
  { name: "TriValley Medical Group" },
  { name: "TriValley Primary Care" },
  { name: "Tryon Medical Partners", aliases: ["Tryon"] },
  { name: "Tufts Medicine", aliases: ["Tufts", "Wellforce"] },
  { name: "U.S. Renal Care", aliases: ["US Renal Care", "USRC"] },
  { name: "UniMed HealthCare", aliases: ["UniMed"] },
  { name: "Upperline Health", aliases: ["Upperline", "Upper Line"] },
  { name: "Upward Health", aliases: ["Upward"] },
  { name: "Valora Medical Group", aliases: ["Valora"] },
  { name: "Vanguard Medical Group", aliases: ["Vanguard"] },
  { name: "VillageMD", aliases: ["Village MD"] },
  { name: "Washington Permanente Medical Group", aliases: ["Kaiser Permanente Washington Physicians"] },
];

/** Lower-cased, punctuation- and legal-suffix-free, for comparison only. */
export function normalizeAccount(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(llc|inc|pc|pa|ltd|corp|co|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Everything before a trailing qualifier — "DTC — Lynn" and "SFP (Aug 2025
 * pre-visit)" both name an account with a note attached, and the note is what
 * used to fragment the list.
 */
function withoutQualifier(raw: string): string {
  return raw.split(/\s[—–-]\s|\(/)[0].trim();
}

export interface AccountLike {
  name: string;
  /** Extra spellings that resolve to this account. Never shown. */
  aliases?: string[] | null;
}

/**
 * Resolve free text to one canonical account name, or null when it is unclear.
 *
 * Deliberately conservative: text naming two accounts ("NOMS + Privia
 * providers") or an ambiguous fragment ("TriValley", which fits two accounts)
 * resolves to null rather than picking one. A wrong client is worse than a
 * blank one, and a blank is the documented outcome for anything unmatched.
 */
export function matchAccount(raw: string | null | undefined, accounts: AccountLike[]): string | null {
  if (!raw?.trim()) return null;

  // Anything from an advisor session is one entity, however the session was
  // titled — this wins outright, before any per-account comparison.
  if (/\badvisor/i.test(raw)) return ADVISORS;

  const targets = accounts.flatMap((a) =>
    [a.name, ...(a.aliases ?? [])].map((term) => ({ account: a.name, term: normalizeAccount(term) })),
  ).filter((t) => t.term);

  const attempt = (text: string): string | null => {
    const norm = normalizeAccount(text);
    if (!norm) return null;

    // 1. Exact.
    const exact = targets.find((t) => t.term === norm);
    if (exact) return exact.account;

    // 2. A term appearing as whole words inside the text: "Aegis providers",
    //    "Summit NJ (VillageMD)". Two different accounts means give up.
    const contained = new Set(
      targets.filter((t) => new RegExp(`(^| )${escape(t.term)}( |$)`).test(norm)).map((t) => t.account),
    );
    if (contained.size === 1) return [...contained][0];
    if (contained.size > 1) return null;

    // 3. The text is a leading fragment of exactly one account ("Valora",
    //    "Harbor Health"). "TriValley" fits two, so it stays unmatched.
    const prefixed = new Set(
      targets.filter((t) => t.term.startsWith(`${norm} `)).map((t) => t.account),
    );
    if (prefixed.size === 1) return [...prefixed][0];

    return null;
  };

  return attempt(raw) ?? attempt(withoutQualifier(raw));
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * When the Salesforce accounts report the per-account data came from was run.
 * Shown on /clients so nobody reads a stale ARR as today's number.
 */
export const REPORT_AS_OF = "2026-08-18";

/** Worst first — a health filter and a health sort both want this order. */
export const HEALTH_ORDER = ["Red", "Yellow", "Green"] as const;

/**
 * Every product the report knows about. Listed rather than derived so the filter
 * keeps a stable order (roughly by how many accounts carry each one) instead of
 * reshuffling as accounts change.
 */
export const PRODUCTS = ["Risk", "Quality", "HIE", "Clinician Copilot", "Reporting API"] as const;

export const SEGMENTS = ["Physician Group", "ACO/MSO", "Health System", "Health Plan"] as const;

/**
 * Days until renewal, negative once it's past. Derived rather than stored: the
 * report's own "time to renewal" column was correct on 2026-08-18 and wrong
 * every day after.
 */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const today = new Date();
  const day = 24 * 60 * 60 * 1000;
  return Math.round((Date.UTC(then.getUTCFullYear(), then.getUTCMonth(), then.getUTCDate())
    - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / day);
}

/** Renewals inside this many days count as near enough to act on. */
export const RENEWAL_WINDOW_DAYS = 90;

/**
 * How close a renewal is, as a level. `overdue` is kept separate from `urgent`
 * on purpose: a date that has already passed is not a renewal to prepare for,
 * it's either a silent churn or a stale record, and telling someone to "prep
 * this renewal" is the wrong instruction for it.
 */
export type RenewalWindow = "overdue" | "urgent" | "soon";

export function renewalWindow(iso: string | null | undefined): RenewalWindow | null {
  const days = daysUntil(iso);
  if (days === null) return null;
  if (days < 0) return "overdue";
  if (days <= 30) return "urgent";
  if (days <= RENEWAL_WINDOW_DAYS) return "soon";
  return null;
}

/** Words for a renewal date: "in 12 days", "today", "109 days ago". */
export function renewalPhrase(iso: string | null | undefined): string | null {
  const days = daysUntil(iso);
  if (days === null) return null;
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} ago`;
  if (days === 0) return "today";
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

/**
 * A renewal close enough to act on, on an account that isn't healthy.
 *
 * Health is part of the rule rather than a second filter because a green
 * account renewing next month isn't the thing anyone needs a list of. Note that
 * the health half currently excludes nothing — as of the 2026-08-18 report every
 * account renewing inside the window is Red — but it's the rule that's wanted,
 * and it starts doing work the moment health moves.
 *
 * An account with no health on record still counts: the report not covering it
 * is not evidence that it's fine.
 */
export function atRenewalRisk(
  account: { renewalDate: string | null; health: string | null },
): boolean {
  return renewalWindow(account.renewalDate) !== null && account.health !== "Green";
}
