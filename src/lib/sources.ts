/**
 * Source values are free text ("Notion: Quality Onsite Jan 25", "Slack:
 * customer-harmonycares"), so the filter groups them into categories derived at
 * read time rather than stored. Deriving keeps it correct for the 230 seeded
 * rows and stays correct if someone edits a source name later.
 */

export const SOURCE_CATEGORIES = [
  "AI extract",
  "Notion",
  "Drive",
  "Slack",
  "Jira",
  "Added manually",
  "Other",
] as const;

export type SourceCategory = (typeof SOURCE_CATEGORIES)[number];

const PATTERNS: [RegExp, SourceCategory][] = [
  [/notion/i, "Notion"],
  [/drive|docs\.google|sheets\.google|google doc|gdoc/i, "Drive"],
  [/slack/i, "Slack"],
  [/jira|atlassian/i, "Jira"],
];

export function sourceCategory(
  sourceName: string | null | undefined,
  sourceType?: string | null
): SourceCategory {
  if (sourceType === "AI_EXTRACT") return "AI extract";

  const name = sourceName?.trim() ?? "";
  if (name) {
    // Some names cite two tools ("Slack: customer-x; Notion: various"). Pick
    // whichever is named *first* in the string rather than whichever pattern
    // happens to sit earliest in the list above — the leading one is the
    // primary source a reader would name.
    let best: { index: number; category: SourceCategory } | null = null;
    for (const [re, category] of PATTERNS) {
      const match = re.exec(name);
      if (match && (best === null || match.index < best.index)) {
        best = { index: match.index, category };
      }
    }
    if (best) return best.category;
  }

  // No recognisable tool in the name: distinguish a form entry from an
  // imported row that simply names something else ("Quality Clinics Discovery").
  if (sourceType === "MANUAL") return "Added manually";
  return "Other";
}
