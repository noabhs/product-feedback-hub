import { MessageSquare, Building2, Lightbulb, GraduationCap, Globe } from "lucide-react";
import type { QSource } from "@/lib/ask-history";

export type SourceKind = QSource["kind"];

/** Where a citation chip and the source list send someone for each kind. */
export function hrefFor(source: QSource): string {
  if (source.kind === "web") return source.url;
  if (source.kind === "competitor") return `/competitors?open=${source.id}`;
  if (source.kind === "feature-request") return "/feature-requests";
  if (source.kind === "domain") return source.href || "/know-your-domain";
  return `/insights/${source.id}`;
}

export const KIND_ICON: Record<SourceKind, typeof MessageSquare> = {
  insight: MessageSquare,
  competitor: Building2,
  "feature-request": Lightbulb,
  domain: GraduationCap,
  web: Globe,
};

export const KIND_LABEL: Record<SourceKind, string> = {
  insight: "Feedback",
  competitor: "Competitor",
  "feature-request": "Feature request",
  domain: "Know your domain",
  web: "Web",
};

/**
 * Three questions worth asking, for the blank box. They are the kind Q is
 * actually good at — a pattern across clients rather than a lookup — and
 * clicking one asks it, so the first use costs nothing to think up.
 */
export const EXAMPLES = [
  "What are clients saying about coding workflows?",
  "Which themes came up across more than one client?",
  "Where do we lose to competitors on risk adjustment?",
];
