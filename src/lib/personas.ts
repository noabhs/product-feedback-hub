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
  "Nurse/MA",
  "Coder",
  "Coder manager",
  "Clinic manager",
  "Quality team",
  "Care Manager/Pop team",
  "VBC Leader",
  "Analytics / Data",
  "Leadership",
  "Admin",
  "Other",
] as const;

export type PersonaRole = (typeof PERSONA_ROLES)[number];

// Plurals matter: "Providers" and "All providers" are the common spellings, and
// \bprovider\b does not match either.
//
// NP and PA stay under Provider — they prescribe — while RN and MA sit under
// Nurse/MA. "Nurse practitioner" therefore reads as both, which is fair.
const PATTERNS: [RegExp, PersonaRole][] = [
  [/\b(providers?|physicians?|clinicians?|clinical|rheumatologists?|dr\.?|mds?|dos?|nps?|pas?)\b/, "Provider"],
  [/\b(nurses?|rns?|lpns?|mas?|medical assistants?)\b/, "Nurse/MA"],
  [/\b(coders?|coding|cdi)\b/, "Coder"],
  [/\bcod(?:er|ing)\s+(?:managers?|leads?|supervisors?)\b|\bmanager of coding\b/, "Coder manager"],
  [/\b(clinic|practice|office)\s+managers?\b/, "Clinic manager"],
  [/\b(quality|hedis|risk)\b/, "Quality team"],
  [/\bcare\s+(managers?|management|teams?|coordinators?)|\bpop(?:ulation)?\s+(?:health|team)\b/, "Care Manager/Pop team"],
  [/\b(vbc|acos?|msos?)\b/, "VBC Leader"],
  [/\b(analytics|data science|ds team|head of ds)\b/, "Analytics / Data"],
  [/\b(ceo|coo|cmo|cfo|vp|chief|directors?|executives?|leadership|head of)\b/, "Leadership"],
  [/\b(admins?|administrators?|scribes?)\b/, "Admin"],
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

  const found = new Set(PATTERNS.filter(([re]) => re.test(text)).map(([, role]) => role));
  // "Coding Manager" is not a coder — the specific role wins over the generic
  // one, so filtering Coder doesn't drag their managers in with them.
  if (found.has("Coder manager")) found.delete("Coder");
  return found.size ? [...found] : ["Other"];
}
