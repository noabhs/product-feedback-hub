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

interface BadgeProps {
  type: "area" | "theme" | "source";
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
