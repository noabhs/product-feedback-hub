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
  RISK_DX: "Risk / Dx",
  AMBIENT: "Ambient",
  GENERAL: "General",
  COMPETITIVE: "Competitive",
};

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

export const AREA_COLORS: Record<string, string> = {
  POP_HEALTH: "#5d07e2",
  QUALITY: "#322B5F",
  ANALYTICS: "#0F6E56",
  AGENTIC: "#9333ea",
  RISK_DX: "#dc2626",
  AMBIENT: "#0891b2",
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
