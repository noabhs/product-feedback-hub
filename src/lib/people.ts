/**
 * Everyone signs in with an @navina.ai Google account, so the domain carries no
 * information in the UI. Show the local part in tight spaces (cards, table
 * cells) and keep the full address in the title attribute.
 */
export function shortName(email: string | null | undefined): string {
  if (!email) return "Imported";
  return email.split("@")[0];
}

/** Byline for a record: "Added by noa.bhs" — or "Imported" for pre-auth rows. */
export function byline(email: string | null | undefined): string {
  return email ? `Added by ${shortName(email)}` : "Imported";
}

/**
 * The hub's owner. Asker names on /feedback-insights are visible to this address
 * and nobody else: the page is shared so everyone can learn from what has already
 * been asked, and attaching names to questions changes what people are willing to
 * ask. Change this line to hand the hub over.
 */
const OWNER_EMAIL = "noa.bhs@navina.ai";

export function isOwner(email: string | null | undefined): boolean {
  return email?.toLowerCase() === OWNER_EMAIL;
}
