import { prisma } from "@/lib/prisma";
import { parseSourceUrl, isSkippedSourceType } from "@/lib/ingest/source-url";
import { fetchNotionPage, notionConfigured } from "@/lib/ingest/notion";
import { getFile, walkFolder, readContent, driveConfigured, type DriveFile } from "@/lib/ingest/drive";
import { condense, CONDENSE_VERSION } from "@/lib/ingest/condense";

/**
 * Walks every competitor's links, reads what it can, and records what it could
 * not — one row per document either way.
 *
 * Two rules hold throughout. A single unreadable file never stops the run: with
 * ninety-nine links across thirty-six competitors, some will be permission
 * failures and the useful outcome is the other ninety. And nothing is inferred
 * on a miss — a document that could not be read is stored as a miss, so the
 * coverage number stays honest.
 */

export type Status = "ok" | "empty" | "skipped" | "failed";

export interface Outcome {
  competitor: string;
  title: string;
  origin: "notion" | "drive" | "-";
  status: Status;
  note?: string;
  sensitivity?: string;
  chars?: number;
}

export interface IngestReport {
  competitorsVisited: number;
  outcomes: Outcome[];
  counts: Record<Status, number>;
  /** Characters of source text condensed — the number the API bill follows. */
  charsRead: number;
  dryRun: boolean;
}

export interface IngestOptions {
  /** Case-insensitive competitor names. Omit for all of them. */
  only?: string[];
  /**
   * Read and report coverage without calling the model or writing rows. Free,
   * and the sane first run: it answers "how many of these can we even open"
   * before anything is spent condensing them.
   */
  dryRun?: boolean;
  /** Re-read documents that are already stored and still look current. */
  force?: boolean;
  /** Stop after this many documents. For trying one competitor end to end. */
  limit?: number;
}

/** A document located and ready to read, before its content is fetched. */
interface Pending {
  externalId: string;
  origin: "notion" | "drive";
  title: string;
  url: string;
  mimeType?: string;
  sourceId: string | null;
  sourceUpdatedAt: Date | null;
  driveFile?: DriveFile;
}

function driveUrl(file: DriveFile): string {
  return file.url;
}

/**
 * Locates every document behind one competitor's links: Notion pages and their
 * children, single Drive files, and the contents of Drive folders.
 */
async function locate(
  competitorName: string,
  sources: { id: string; label: string; url: string; type: string }[],
  outcomes: Outcome[],
): Promise<Pending[]> {
  const pending: Pending[] = [];

  for (const source of sources) {
    if (isSkippedSourceType(source.type)) {
      outcomes.push({
        competitor: competitorName,
        title: source.label,
        origin: "-",
        status: "skipped",
        note: "screenshots — the ask cannot quote an image",
      });
      continue;
    }

    const target = parseSourceUrl(source.url);

    if (target.kind === "unsupported") {
      outcomes.push({
        competitor: competitorName,
        title: source.label,
        origin: "-",
        status: "skipped",
        note: target.reason,
      });
      continue;
    }

    if (target.kind === "notion-page") {
      pending.push({
        externalId: target.id,
        origin: "notion",
        title: source.label,
        url: source.url,
        sourceId: source.id,
        sourceUpdatedAt: null,
      });
      continue;
    }

    if (target.kind === "drive-file") {
      try {
        const file = await getFile(target.id);
        pending.push({
          externalId: file.id,
          origin: "drive",
          title: file.title,
          url: driveUrl(file),
          mimeType: file.mimeType,
          sourceId: source.id,
          sourceUpdatedAt: file.modifiedTime,
          driveFile: file,
        });
      } catch (e) {
        outcomes.push({
          competitor: competitorName,
          title: source.label,
          origin: "drive",
          status: "failed",
          note: message(e),
        });
      }
      continue;
    }

    // A folder. Its contents become documents in their own right, each keeping
    // the folder link as the source it was reached through.
    try {
      const walk = await walkFolder(target.id, source.label);
      for (const note of walk.notes) {
        outcomes.push({
          competitor: competitorName,
          title: source.label,
          origin: "drive",
          status: "skipped",
          note,
        });
      }
      for (const file of walk.files) {
        pending.push({
          externalId: file.id,
          origin: "drive",
          title: file.title,
          url: driveUrl(file),
          mimeType: file.mimeType,
          sourceId: source.id,
          sourceUpdatedAt: file.modifiedTime,
          driveFile: file,
        });
      }
    } catch (e) {
      outcomes.push({
        competitor: competitorName,
        title: source.label,
        origin: "drive",
        status: "failed",
        note: `folder: ${message(e)}`,
      });
    }
  }

  // The same file reaches us twice often enough to matter — Innovaccer's main
  // deck is both its own "overview" link and an item inside its folder link.
  const seen = new Set<string>();
  return pending.filter((p) => !seen.has(p.externalId) && seen.add(p.externalId));
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export async function ingestCompetitors(options: IngestOptions = {}): Promise<IngestReport> {
  const { only, dryRun = false, force = false, limit } = options;

  if (!driveConfigured()) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set — Drive links cannot be read");
  if (!notionConfigured()) throw new Error("NOTION_TOKEN is not set — Notion links cannot be read");

  const competitors = await prisma.competitor.findMany({
    include: { sources: true },
    orderBy: { name: "asc" },
  });

  const wanted = only?.map((n) => n.toLowerCase());
  const selected = wanted
    ? competitors.filter((c) => wanted.some((w) => c.name.toLowerCase().includes(w)))
    : competitors;

  const outcomes: Outcome[] = [];
  let charsRead = 0;
  let processed = 0;

  for (const competitor of selected) {
    const pending = await locate(competitor.name, competitor.sources, outcomes);

    // Notion child pages surface only once their parent has been walked, so the
    // queue is extended as it is consumed rather than fixed up front.
    const queue = [...pending];
    while (queue.length) {
      if (limit !== undefined && processed >= limit) {
        outcomes.push({
          competitor: competitor.name,
          title: "—",
          origin: "-",
          status: "skipped",
          note: `stopped at the ${limit}-document limit`,
        });
        queue.length = 0;
        break;
      }

      const doc = queue.shift()!;
      processed += 1;

      const existing = await prisma.competitorDocument.findUnique({
        where: { competitorId_externalId: { competitorId: competitor.id, externalId: doc.externalId } },
      });

      // Skip a document already read since it last changed at the origin, unless
      // the condense prompt has moved on — a new prompt means a new summary.
      const current =
        existing?.status === "ok" &&
        existing.condenseVersion === CONDENSE_VERSION &&
        (!doc.sourceUpdatedAt || existing.fetchedAt > doc.sourceUpdatedAt);
      if (current && !force) {
        outcomes.push({
          competitor: competitor.name,
          title: doc.title,
          origin: doc.origin,
          status: "ok",
          note: "unchanged since last read",
          sensitivity: existing.sensitivity ?? undefined,
        });
        continue;
      }

      try {
        let text = "";
        let pdfBase64: string | undefined;
        let truncated = false;
        const notes: string[] = [];
        let title = doc.title;
        let sourceUpdatedAt = doc.sourceUpdatedAt;

        if (doc.origin === "notion") {
          const page = await fetchNotionPage(doc.externalId);
          title = page.title;
          text = page.markdown;
          truncated = page.truncated;
          notes.push(...page.notes);
          sourceUpdatedAt = page.lastEditedAt;
          for (const childId of page.childPageIds) {
            queue.push({
              externalId: childId,
              origin: "notion",
              title: `${page.title} — child page`,
              url: `https://www.notion.so/${childId}`,
              sourceId: doc.sourceId,
              sourceUpdatedAt: null,
            });
          }
        } else {
          const content = await readContent(doc.driveFile!);
          if (content.kind === "skipped") {
            await record(competitor.id, doc, {
              status: "skipped",
              note: content.reason,
              title,
              sourceUpdatedAt,
              dryRun,
            });
            outcomes.push({
              competitor: competitor.name,
              title,
              origin: doc.origin,
              status: "skipped",
              note: content.reason,
            });
            continue;
          }
          if (content.kind === "pdf") pdfBase64 = content.base64;
          else text = content.text;
        }

        if (!pdfBase64 && text.trim().length < 40) {
          await record(competitor.id, doc, {
            status: "empty",
            note: "no readable text",
            title,
            text,
            truncated,
            sourceUpdatedAt,
            dryRun,
          });
          outcomes.push({
            competitor: competitor.name,
            title,
            origin: doc.origin,
            status: "empty",
            note: "no readable text",
          });
          continue;
        }

        charsRead += pdfBase64 ? Math.round(pdfBase64.length * 0.75) : text.length;

        if (dryRun) {
          outcomes.push({
            competitor: competitor.name,
            title,
            origin: doc.origin,
            status: "ok",
            note: "readable (dry run — not condensed or stored)",
            chars: text.length || undefined,
          });
          continue;
        }

        const condensed = await condense({
          competitor: competitor.name,
          title,
          text: text || undefined,
          pdfBase64,
        });

        const note = [...notes, condensed.empty ? "nothing substantive about the competitor" : ""]
          .filter(Boolean)
          .join("; ");

        await record(competitor.id, doc, {
          status: condensed.empty ? "empty" : "ok",
          note: note || undefined,
          title,
          text,
          summary: condensed.summary,
          sensitivity: condensed.sensitivity,
          sensitivityReason: condensed.sensitivityReason || undefined,
          truncated,
          sourceUpdatedAt,
          dryRun,
        });

        outcomes.push({
          competitor: competitor.name,
          title,
          origin: doc.origin,
          status: condensed.empty ? "empty" : "ok",
          note: note || undefined,
          sensitivity: condensed.sensitivity,
          chars: text.length || undefined,
        });
      } catch (e) {
        const note = message(e);
        await record(competitor.id, doc, {
          status: "failed",
          note,
          title: doc.title,
          sourceUpdatedAt: doc.sourceUpdatedAt,
          dryRun,
        }).catch(() => {});
        outcomes.push({
          competitor: competitor.name,
          title: doc.title,
          origin: doc.origin,
          status: "failed",
          note,
        });
      }
    }
  }

  const counts: Record<Status, number> = { ok: 0, empty: 0, skipped: 0, failed: 0 };
  for (const o of outcomes) counts[o.status] += 1;

  return { competitorsVisited: selected.length, outcomes, counts, charsRead, dryRun };
}

interface RecordFields {
  status: Status;
  note?: string;
  title: string;
  text?: string;
  summary?: string;
  sensitivity?: string;
  sensitivityReason?: string;
  truncated?: boolean;
  sourceUpdatedAt: Date | null;
  dryRun: boolean;
}

async function record(competitorId: string, doc: Pending, f: RecordFields): Promise<void> {
  if (f.dryRun) return;

  const data = {
    sourceId: doc.sourceId,
    origin: doc.origin,
    title: f.title,
    url: doc.url,
    mimeType: doc.mimeType ?? null,
    text: f.text ?? null,
    summary: f.summary ?? null,
    sensitivity: f.sensitivity ?? null,
    sensitivityReason: f.sensitivityReason ?? null,
    status: f.status,
    note: f.note ?? null,
    truncated: f.truncated ?? false,
    sourceUpdatedAt: f.sourceUpdatedAt,
    fetchedAt: new Date(),
    condenseVersion: f.summary ? CONDENSE_VERSION : null,
  };

  await prisma.competitorDocument.upsert({
    where: { competitorId_externalId: { competitorId, externalId: doc.externalId } },
    create: { competitorId, externalId: doc.externalId, ...data },
    update: data,
  });
}
