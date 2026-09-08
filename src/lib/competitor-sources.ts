/**
 * Display label + chip color for a CompetitorSource's `type` (which comes
 * straight from CI Launcher's own data — see schema.prisma). Same idea as
 * FORMAT_COLORS on the Discovery page, keyed off a different vocabulary.
 */
export const SOURCE_TYPE_LABELS: Record<string, string> = {
  notion: "Notion",
  overview: "Overview",
  folder: "Drive folder",
  summary: "Summary",
  battlecard: "Battlecard",
  document: "Document",
  screenshots: "Screenshots",
  pricing: "Pricing",
  comparison: "Comparison",
};

export const SOURCE_TYPE_COLORS: Record<string, string> = {
  notion: "bg-gray-50 text-gray-600",
  overview: "bg-blue-50 text-blue-700",
  folder: "bg-amber-50 text-amber-700",
  summary: "bg-purple-50 text-purple-700",
  battlecard: "bg-red-50 text-red-700",
  document: "bg-orange-50 text-orange-700",
  screenshots: "bg-teal-50 text-teal-700",
  pricing: "bg-green-50 text-green-700",
  comparison: "bg-pink-50 text-pink-700",
};

export function sourceTypeLabel(type: string): string {
  return SOURCE_TYPE_LABELS[type] ?? type;
}

export function sourceTypeColor(type: string): string {
  return SOURCE_TYPE_COLORS[type] ?? "bg-gray-50 text-gray-500";
}
