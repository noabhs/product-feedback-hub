/**
 * Persona is free text and in practice records who was in the room — "Dr. Bower",
 * "Stewart, Kim, Phuong", "Angela, Mikeba, MaryAnn (Quality Coordinators)". With
 * 95 distinct values across ~127 entries, filtering on the raw strings is a
 * picker rather than a filter, so roles are derived from the text at read time
 * instead. Same approach as sourceCategory: derived, never stored, so it stays
 * correct when someone edits a persona later.
 *
 * A persona can legitimately name several roles ("Sam (Quality Lead), Dr.
 * Gellis"), so this returns every role that applies rather than forcing one.
 */

export const PERSONA_ROLES = [
  "Provider",
  "Quality / Risk",
  "VBC Leader",
  "Care Manager",
  "Analytics / Data",
  "Leadership",
  "Admin / MA",
  "Other",
] as const;

export type PersonaRole = (typeof PERSONA_ROLES)[number];

// Plurals matter: "Providers" and "All providers" are the common spellings, and
// \bprovider\b does not match either.
const PATTERNS: [RegExp, PersonaRole][] = [
  [/\b(providers?|physicians?|clinicians?|clinical|rheumatologists?|dr\.?|mds?|dos?|nps?|pas?|rns?)\b/, "Provider"],
  [/\b(quality|hedis|risk)\b/, "Quality / Risk"],
  [/\b(vbc|acos?|msos?)\b/, "VBC Leader"],
  [/\bcare\s+(managers?|management|teams?|coordinators?)/, "Care Manager"],
  [/\b(analytics|data science|ds team|head of ds)\b/, "Analytics / Data"],
  [/\b(ceo|coo|cmo|cfo|vp|chief|directors?|executives?|leadership|head of)\b/, "Leadership"],
  [/\b(admins?|administrators?|mas?|scribes?)\b/, "Admin / MA"],
];

/**
 * Every role named in a persona string. Empty for a blank persona — those match
 * no role filter, the same way an entry with no source matches no source filter.
 * A non-blank persona naming no recognised role is "Other", so filtering can
 * still reach the entries recorded only as someone's name.
 */
export function personaRoles(persona: string | null | undefined): PersonaRole[] {
  const text = persona?.trim().toLowerCase() ?? "";
  if (!text) return [];

  const found = PATTERNS.filter(([re]) => re.test(text)).map(([, role]) => role);
  return found.length ? [...new Set(found)] : ["Other"];
}
