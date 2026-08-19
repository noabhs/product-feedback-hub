/**
 * Product area and theme are free-form strings, not DB enums — users can add
 * their own from the feedback form. The maps below cover the built-in values;
 * anything else is prettified from its stored form so a custom
 * "BILLING_PAYMENTS" renders as "Billing payments" rather than shouting.
 */

export const AREA_LABELS: Record<string, string> = {
  POP_HEALTH: "Pop health",
  QUALITY: "Quality",
  ANALYTICS: "Analytics",
  AGENTIC: "Agentic",
  // Stored key stays RISK_DX so existing entries keep their area; only the
  // display name changed to "Risk Adjustment".
  RISK_DX: "Risk Adjustment",
  AMBIENT: "Ambient",
  COST_AND_UTILIZATION: "Cost and Utilization",
  HOSPITALIZATION: "Hospitalization",
  POINT_OF_CARE: "Point of care",
  PAYERS: "Payers",
  CARE_MANAGEMENT: "Care Management",
  CODERS: "Coders",
  GENERAL: "General",
  COMPETITIVE: "Competitive",
};

/**
 * The built-in areas as dropdown options, in the curated order above. Every
 * area picker in the app reads this, so adding a key to AREA_LABELS is all it
 * takes to offer a new area everywhere.
 */
export const AREA_OPTIONS = Object.entries(AREA_LABELS).map(([value, label]) => ({ value, label }));

export const THEME_LABELS: Record<string, string> = {
  WORKFLOW: "Workflow",
  DATA_INTEGRATION: "Data & integration",
  TRUST: "Trust",
  PAIN_POINTS: "Pain points",
  GOALS: "Goals",
  PRICING_WTP: "Pricing / WTP",
  AGENTIC: "Agentic",
  OTHER: "Other",
};

/**
 * The built-in themes as dropdown options. Same reasoning as AREA_OPTIONS: these
 * feed edit controls now, so a list missing a value (OTHER, in three of the four
 * copies this replaced) would display the wrong theme for a question.
 */
export const THEME_OPTIONS = Object.entries(THEME_LABELS).map(([value, label]) => ({ value, label }));

export const AREA_COLORS: Record<string, string> = {
  POP_HEALTH: "#5d07e2",
  QUALITY: "#322B5F",
  ANALYTICS: "#0F6E56",
  AGENTIC: "#9333ea",
  RISK_DX: "#dc2626",
  AMBIENT: "#0891b2",
  COST_AND_UTILIZATION: "#4d7c0f",
  HOSPITALIZATION: "#be185d",
  POINT_OF_CARE: "#0d9488",
  PAYERS: "#1d4ed8",
  CARE_MANAGEMENT: "#4338ca",
  CODERS: "#7c2d12",
  GENERAL: "#78716c",
  COMPETITIVE: "#d97706",
};

/** "BILLING_PAYMENTS" -> "Billing payments" */
export function prettify(value: string): string {
  const spaced = value.replace(/_/g, " ").toLowerCase().trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function areaLabel(value: string): string {
  return AREA_LABELS[value] ?? prettify(value);
}

export function themeLabel(value: string): string {
  return THEME_LABELS[value] ?? prettify(value);
}

/** Stable colour for a custom area, so charts don't all render grey. */
const FALLBACK_COLORS = ["#0d9488", "#7c3aed", "#c2410c", "#0369a1", "#a16207", "#be185d"];

export function areaColor(value: string): string {
  if (AREA_COLORS[value]) return AREA_COLORS[value];
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

/**
 * Incoming product areas, normalised and de-duplicated. Accepts an array or a
 * lone string, so a caller (or a CSV row) sending a single area still works.
 *
 * Returns an empty array when nothing usable arrived, rather than defaulting to
 * GENERAL: the routes decide whether to reject that or let it through, and a
 * silent fallback would file entries under an area nobody chose.
 */
export function normalizeAreas(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : input === null || input === undefined ? [] : [input];
  return [
    ...new Set(
      raw
        .filter((v): v is string => typeof v === "string")
        .map(normalizeKey)
        .filter(Boolean),
    ),
  ];
}

/**
 * Normalise a user-typed area/theme to the stored convention so "Billing",
 * "billing" and "Billing " don't become three separate groups in the charts.
 */
export function normalizeKey(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
