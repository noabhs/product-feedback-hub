import { clsx } from "clsx";
import { areaLabel, themeLabel } from "@/lib/labels";

const AREA_CLASSES: Record<string, string> = {
  POP_HEALTH:   "bg-mint-100 text-brand-primary",
  QUALITY:      "bg-lavender text-brand-primary",
  ANALYTICS:    "bg-mint-100 text-brand-primary",
  AGENTIC:      "bg-brand-secondary-500 text-white",
  RISK_DX:      "bg-lavender text-brand-primary",
  AMBIENT:      "bg-mint-200 text-brand-primary",
  COST_AND_UTILIZATION: "bg-mint-200 text-brand-primary",
  HOSPITALIZATION:      "bg-lavender text-brand-primary",
  POINT_OF_CARE:        "bg-mint-100 text-brand-primary",
  PAYERS:               "bg-mint-400 text-brand-primary",
  CARE_MANAGEMENT:      "bg-lavender text-brand-primary",
  CODERS:               "bg-mint-200 text-brand-primary",
  GENERAL:      "bg-surface-app text-brand-primary",
  COMPETITIVE:  "bg-red-100 text-red-800",
};

/**
 * Account health, worst to best. A tint plus a dot plus the word — the word is
 * there on purpose, so "Red" still reads as bad to someone who can't tell these
 * three tints apart.
 */
const HEALTH_CLASSES: Record<string, { pill: string; dot: string }> = {
  Red:    { pill: "bg-red-50 text-red-800 border border-red-200",             dot: "bg-red-500" },
  Yellow: { pill: "bg-amber-50 text-amber-800 border border-amber-200",       dot: "bg-amber-500" },
  Green:  { pill: "bg-emerald-50 text-emerald-800 border border-emerald-200", dot: "bg-emerald-500" },
};

interface BadgeProps {
  type: "area" | "theme" | "source" | "health";
  value: string;
  className?: string;
}

export function Badge({ type, value, className }: BadgeProps) {
  if (type === "area") {
    return (
      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium", AREA_CLASSES[value] ?? "bg-surface-app text-brand-primary border border-black/10", className)}>
        {areaLabel(value)}
      </span>
    );
  }
  if (type === "health") {
    const c = HEALTH_CLASSES[value];
    return (
      <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-semibold", c?.pill ?? "bg-surface-app text-brand-primary border border-black/10", className)}>
        <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", c?.dot ?? "bg-brand-primary/30")} />
        {value}
      </span>
    );
  }
  if (type === "theme") {
    return (
      <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium bg-surface-app text-brand-primary border border-black/10", className)}>
        {themeLabel(value)}
      </span>
    );
  }
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium bg-secondary-50 text-brand-secondary-600", className)}>
      {value}
    </span>
  );
}
