/**
 * Turns a CompetitorSource link into something the fetcher can act on.
 *
 * The links come from CI Launcher and were written for people to click, so they
 * arrive in every shape Google and Notion hand out: a folder, a file, a native
 * Doc, a slide deck, a page whose title is glued to its id. Resolving them is
 * kept pure and apart from the network so the shapes can be checked against the
 * real seed data without a Google token — which is how the "Old" folder and the
 * shortcut in Innovaccer's folder were found in the first place.
 */

export type IngestTarget =
  | { kind: "notion-page"; id: string }
  | { kind: "drive-file"; id: string }
  | { kind: "drive-folder"; id: string }
  | { kind: "unsupported"; reason: string };

/** 32 hex characters, dashed or not — Notion accepts either in its API. */
const NOTION_ID = /([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

const DRIVE_FOLDER = /\/(?:drive\/)?(?:u\/\d+\/)?folders\/([\w-]+)/;
/** Covers /file/d/<id>, /document/d/<id>, /presentation/d/<id>, /spreadsheets/d/<id>. */
const DRIVE_FILE = /\/d\/([\w-]+)/;

export function parseSourceUrl(raw: string): IngestTarget {
  const url = raw.trim();
  if (!url) return { kind: "unsupported", reason: "empty link" };

  let host: string;
  let path: string;
  try {
    const parsed = new URL(url);
    host = parsed.hostname.toLowerCase();
    path = parsed.pathname;
  } catch {
    return { kind: "unsupported", reason: "not a URL" };
  }

  if (host.endsWith("notion.so") || host.endsWith("notion.com") || host.endsWith("notion.site")) {
    const id = NOTION_ID.exec(path)?.[1];
    // A Notion link without an id is a workspace or search URL, not a page.
    return id
      ? { kind: "notion-page", id: id.replace(/-/g, "") }
      : { kind: "unsupported", reason: "Notion link carries no page id" };
  }

  if (host === "drive.google.com" || host === "docs.google.com") {
    // Folders first: /drive/folders/<id> also matches nothing in DRIVE_FILE,
    // but checking in this order keeps the intent obvious.
    const folder = DRIVE_FOLDER.exec(path)?.[1];
    if (folder) return { kind: "drive-folder", id: folder };
    const file = DRIVE_FILE.exec(path)?.[1];
    if (file) return { kind: "drive-file", id: file };
    return { kind: "unsupported", reason: "Google link carries no file id" };
  }

  // Competitor marketing sites live on Competitor.website and are not ingested
  // here: they change without notice and are the competitor's own claims, which
  // the hub already records separately.
  return { kind: "unsupported", reason: `not a Drive or Notion link (${host})` };
}

/**
 * Source types that are deliberately not read.
 *
 * "screenshots" folders hold images. The ask answers in prose and cites what it
 * read, and an image it cannot quote is worse than an absence — it would look
 * like coverage while contributing nothing.
 */
const SKIPPED_SOURCE_TYPES = new Set(["screenshots"]);

export function isSkippedSourceType(type: string): boolean {
  return SKIPPED_SOURCE_TYPES.has(type.toLowerCase());
}

/**
 * Folders whose contents are superseded. Innovaccer's main folder has one
 * called "Old"; ingesting it would put last year's positioning in front of the
 * ask with the same standing as this year's, and nothing in the text says which
 * is which.
 */
const STALE_FOLDER_NAMES = /^(old|archive|archived|deprecated|obsolete)\b/i;

export function isStaleFolderName(name: string): boolean {
  return STALE_FOLDER_NAMES.test(name.trim());
}
