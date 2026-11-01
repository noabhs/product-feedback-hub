import type { LucideIcon } from "lucide-react";
import { FileText, ClipboardList, Lightbulb, Presentation, Megaphone, PackageOpen, MessagesSquare } from "lucide-react";

export const SKILL_CATEGORIES = ["Discovery", "Ideation", "Releases"] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export interface PmSkill {
  name: string;
  category: SkillCategory;
  description: string;
  /** Where the skill lives in Claude. Omitted until the share link is known. */
  url?: string;
  /** Extra reference link shown beside the skill, e.g. the template it follows. */
  extra?: { label: string; url: string };
  /** Shown when somebody has reported the link as not working. */
  note?: string;
  Icon: LucideIcon;
}

/**
 * Shared by Adi Gilad in #product on 2026-11-01. To add one, append it here —
 * the modal groups the list by category, in SKILL_CATEGORIES order.
 */
export const PM_SKILLS: PmSkill[] = [
  {
    name: "Client session recap",
    category: "Discovery",
    description: "Share a transcript or notes from a client session and get an internal Slack recap for the team.",
    url: "https://claude.ai/customize/skills/id/plugin_01GbM4dQnhpFNVXW2RyhamvG",
    Icon: MessagesSquare,
  },
  {
    name: "Product idea creator",
    category: "Ideation",
    description: "Share a brief, an NIH or a bug as context, and get an idea created.",
    url: "https://claude.ai/customize/skills/id/plugin_017sytBZQRJVAzJGG2jzhPrk",
    Icon: Lightbulb,
  },
  {
    name: "Product spec",
    category: "Ideation",
    description: "Share a brief, previous context and your idea, and get a first spec in the Navina template.",
    url: "https://claude.ai/customize/skills/id/plugin_01AnPX8FVsXJQa6Hym8okop6",
    extra: {
      label: "Navina specification format",
      url: "https://app.notion.com/p/navinaai/Navina-Specification-format-Replace-with-feature-product-project-name-c5a308c2e629436dbcdb3e6d4ede4579?source=copy_link",
    },
    note: "Reported as broken on 2026-11-01. If it doesn't open, ask Adi Gilad for a fresh link.",
    Icon: FileText,
  },
  {
    name: "Support handoff doc",
    category: "Releases",
    description: "Give Claude the spec, tech design, Figma and education deck, and get a support handoff doc.",
    url: "https://claude.ai/customize/skills/id/plugin_0183fJXF6TS5ATaFzUJB4aVT",
    Icon: ClipboardList,
  },
  {
    name: "Feature handover deck",
    category: "Releases",
    description: "Get a CS and Support feature handover deck in the Navina template.",
    url: "https://claude.ai/customize/skills/id/plugin_013eo2EgTVGqgcbMgBRKQV39",
    Icon: PackageOpen,
  },
  {
    name: "Feature training deck",
    category: "Releases",
    description: "Share the spec and/or the handoff doc, and get a feature training deck.",
    url: "https://claude.ai/customize/skills/id/plugin_01L9mdbBhSbBBBf7j1eee8gB",
    Icon: Presentation,
  },
  {
    name: "Internal release announcement",
    category: "Releases",
    description: "Share a brief about a release (with spec, handoff doc, training deck) and get a drafted internal message for #product-releases-updates.",
    url: "https://claude.ai/customize/skills/id/plugin_01EaNmP4hZfB3pd7Wo9zEuAg",
    Icon: Megaphone,
  },
];
