import { clsx } from "clsx";

const AREA_COLORS: Record<string, string> = {
  POP_HEALTH:   "bg-mint-100 text-brand-primary",
  QUALITY:      "bg-lavender text-brand-primary",
  ANALYTICS:    "bg-mint-100 text-brand-primary",
  AGENTIC:      "bg-brand-secondary-500 text-white",
  RISK_DX:      "bg-lavender text-brand-primary",
  AMBIENT:      "bg-mint-200 text-brand-primary",
  GENERAL:      "bg-surface-app text-brand-primary",
  COMPETITIVE:  "bg-red-100 text-red-800",
};

export const AREA_LABELS: Record<string, string> = {
  POP_HEALTH:  "Pop health",
  QUALITY:     "Quality",
  ANALYTICS:   "Analytics",
  AGENTIC:     "Agentic",
  RISK_DX:     "Risk / Dx",
  AMBIENT:     "Ambient",
  GENERAL:     "General",
  COMPETITIVE: "Competitive",
};

export const THEME_LABELS: Record<string, string> = {
  WORKFLOW:        "Workflow",
  DATA_INTEGRATION:"Data & integration",
  TRUST:           "Trust",
  PAIN_POINTS:     "Pain points",
  GOALS:           "Goals",
  PRICING_WTP:     "Pricing / WTP",
  AGENTIC:         "Agentic",
  OTHER:           "Other",
};

interface BadgeProps {
  type: "area" | "theme" | "source";
  value: string;
  className?: string;
}

export function Badge({ type, value, className }: BadgeProps) {
  if (type === "area") {
    return (
      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium", AREA_COLORS[value] ?? "bg-surface-app text-brand-primary", className)}>
        {AREA_LABELS[value] ?? value}
      </span>
    );
  }
  if (type === "theme") {
    return (
      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium bg-surface-app text-brand-primary border border-black/10", className)}>
        {THEME_LABELS[value] ?? value}
      </span>
    );
  }
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium bg-secondary-50 text-brand-secondary-600", className)}>
      {value}
    </span>
  );
}
