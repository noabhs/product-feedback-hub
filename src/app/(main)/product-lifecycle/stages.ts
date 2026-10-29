const JIRA = "https://navina.atlassian.net/browse";
const DEV_BOARD =
  "https://navina.atlassian.net/jira/boards?page=1&projectLocation=10022&sortKey=name&sortOrder=ASC";

/** Static class strings, so Tailwind can see every one of them. */
export type Stage = {
  slug: "idea" | "dev" | "release";
  board: string;
  type: string;
  who: string;
  exit: string;
  fedBy: string;
  href: string;
  cta: string;
  top: string;
  text: string;
};

export const STAGES: Stage[] = [
  {
    slug: "idea",
    board: "Product board",
    type: "Idea",
    who: "An opportunity under discovery, whatever its source. Owned by the PM.",
    exit: "Definition of Ready complete, R&D handshake",
    fedBy: "The four sources above. Product is the only gatekeeper: no Definition of Ready, no commitment.",
    href: `${JIRA}/PRODUCT`,
    cta: "Open Product board",
    top: "border-t-teal-500",
    text: "text-teal-700",
  },
  {
    slug: "dev",
    board: "Dev board",
    type: "Initiative / Epic / Story",
    who: "Committed build work. Owned by the PM with the R&D lead.",
    exit: "Dev done, PM sign-off",
    fedBy:
      "Ideas that passed Definition of Ready and the R&D handshake. Work is broken into Stories, Tasks and Bugs, each under one Epic.",
    href: DEV_BOARD,
    cta: "Open Dev board",
    top: "border-t-brand-secondary-500",
    text: "text-brand-secondary-600",
  },
  {
    slug: "release",
    board: "Release board",
    type: "Release Event",
    who: "What ships, to whom, and when. Owned by the PM as release owner.",
    exit: "GA rollout, then monitoring",
    fedBy:
      "Epics committed to the roadmap with a target quarter. The PM owns it through Beta, GA and monitoring.",
    href: `${JIRA}/REL`,
    cta: "Open Release board",
    top: "border-t-orange-500",
    text: "text-orange-700",
  },
];

export const NIH_BOARD = `${JIRA}/NIH`;
