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
