import { google, type drive_v3 } from "googleapis";
import { isStaleFolderName } from "@/lib/ingest/source-url";

/**
 * Reads Google Drive files and expands Drive folders.
 *
 * A "folder" link in CI Launcher is not a document, and Innovaccer's showed why
 * that matters: its main folder held the deck, a *shortcut* to a demo recording,
 * a Google Doc, and three sub-folders — one of them named "Old". Walking it
 * naively would ingest superseded positioning and stop dead on the shortcut, so
 * this expands folders, follows shortcuts to their target, and refuses anything
 * under a folder whose name says it has been superseded.
 */

const MAX_FOLDER_DEPTH = 3;
/** Enough for a competitor's folder; a hit means the folder is a dumping ground. */
const MAX_FILES_PER_FOLDER = 60;
/** The Messages API caps a request at 32MB; stay well clear of it. */
const MAX_PDF_BYTES = 12 * 1024 * 1024;

const FIELDS = "id,name,mimeType,modifiedTime,webViewLink,size,shortcutDetails,trashed";

export interface DriveFile {
  id: string;
  title: string;
  mimeType: string;
  modifiedTime: Date | null;
  url: string;
}

export type DriveContent =
  | { kind: "text"; text: string }
  | { kind: "pdf"; base64: string }
  | { kind: "skipped"; reason: string };

export function driveConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
}

/**
 * Reads the service account from one env var, accepting base64 as well as raw
 * JSON. Vercel's dashboard mangles pasted multi-line JSON often enough that
 * base64 is the form people end up using, and failing on it is a confusing
 * half-hour.
 */
function credentials(): Record<string, unknown> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json);
}

let cached: drive_v3.Drive | null = null;

function drive(): drive_v3.Drive {
  if (cached) return cached;
  const auth = new google.auth.GoogleAuth({
    credentials: credentials(),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  cached = google.drive({ version: "v3", auth });
  return cached;
}

function toFile(f: drive_v3.Schema$File): DriveFile {
  return {
    id: f.id!,
    title: f.name ?? "Untitled",
    mimeType: f.mimeType ?? "application/octet-stream",
    modifiedTime: f.modifiedTime ? new Date(f.modifiedTime) : null,
    url: f.webViewLink ?? `https://drive.google.com/file/d/${f.id}/view`,
  };
}

const FOLDER = "application/vnd.google-apps.folder";
const SHORTCUT = "application/vnd.google-apps.shortcut";

/** Resolves a shortcut to the file it points at; returns others unchanged. */
async function resolve(f: drive_v3.Schema$File): Promise<drive_v3.Schema$File | null> {
  if (f.mimeType !== SHORTCUT) return f;
  const targetId = f.shortcutDetails?.targetId;
  if (!targetId) return null;
  const res = await drive().files.get({
    fileId: targetId,
    fields: FIELDS,
    supportsAllDrives: true,
  });
  // A shortcut can point at another shortcut. One hop is all this follows —
  // beyond that it is almost always a loop.
  return res.data.mimeType === SHORTCUT ? null : res.data;
}

export async function getFile(fileId: string): Promise<DriveFile> {
  const res = await drive().files.get({ fileId, fields: FIELDS, supportsAllDrives: true });
  const resolved = await resolve(res.data);
  if (!resolved) throw new Error("shortcut points at another shortcut");
  return toFile(resolved);
}

export interface FolderWalk {
  files: DriveFile[];
  notes: string[];
}

/**
 * Every readable file under a folder, sub-folders included. Folders are visited
 * breadth-first so a depth cap trims the deepest material rather than a whole
 * branch of the shallowest.
 */
export async function walkFolder(folderId: string, folderName = "folder"): Promise<FolderWalk> {
  const files: DriveFile[] = [];
  const notes: string[] = [];
  const seen = new Set<string>();
  let queue: { id: string; name: string; depth: number }[] = [{ id: folderId, name: folderName, depth: 0 }];

  while (queue.length) {
    const next: typeof queue = [];
    for (const folder of queue) {
      if (folder.depth > MAX_FOLDER_DEPTH) {
        notes.push(`stopped at folder depth ${MAX_FOLDER_DEPTH} ("${folder.name}")`);
        continue;
      }

      let cursor: string | undefined;
      let countInFolder = 0;
      do {
        const res = await drive().files.list({
          q: `'${folder.id}' in parents and trashed = false`,
          fields: `nextPageToken, files(${FIELDS})`,
          pageSize: 100,
          pageToken: cursor,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });
        cursor = res.data.nextPageToken ?? undefined;

        for (const raw of res.data.files ?? []) {
          if (countInFolder >= MAX_FILES_PER_FOLDER) {
            notes.push(`stopped after ${MAX_FILES_PER_FOLDER} items in "${folder.name}"`);
            cursor = undefined;
            break;
          }
          countInFolder += 1;

          const entry = await resolve(raw).catch(() => null);
          if (!entry?.id) {
            notes.push(`skipped "${raw.name ?? "untitled"}" — unresolvable shortcut`);
            continue;
          }
          if (seen.has(entry.id)) continue;
          seen.add(entry.id);

          if (entry.mimeType === FOLDER) {
            const name = entry.name ?? "untitled";
            if (isStaleFolderName(name)) {
              notes.push(`skipped folder "${name}" — superseded material`);
              continue;
            }
            next.push({ id: entry.id, name, depth: folder.depth + 1 });
            continue;
          }

          files.push(toFile(entry));
        }
      } while (cursor);
    }
    queue = next;
  }

  return { files, notes };
}

/**
 * Google-native formats export to text directly. Anything uploaded rather than
 * created in Google — .docx, .pptx — cannot, and is reported as skipped instead
 * of guessed at.
 */
const EXPORT_AS: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
};

export async function readContent(file: DriveFile): Promise<DriveContent> {
  const exportType = EXPORT_AS[file.mimeType];
  if (exportType) {
    const res = await drive().files.export(
      { fileId: file.id, mimeType: exportType },
      { responseType: "text" },
    );
    return { kind: "text", text: String(res.data ?? "").trim() };
  }

  if (file.mimeType === "application/pdf") {
    const res = await drive().files.get(
      { fileId: file.id, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" },
    );
    const buffer = Buffer.from(res.data as ArrayBuffer);
    if (buffer.byteLength > MAX_PDF_BYTES) {
      return { kind: "skipped", reason: `PDF is ${Math.round(buffer.byteLength / 1e6)}MB` };
    }
    // Handed to Claude as a document block rather than parsed here: it reads
    // PDFs natively, which keeps a PDF text extractor out of the dependencies.
    return { kind: "pdf", base64: buffer.toString("base64") };
  }

  if (file.mimeType.startsWith("image/") || file.mimeType.startsWith("video/")) {
    return { kind: "skipped", reason: `${file.mimeType} — the ask cannot quote it` };
  }

  return { kind: "skipped", reason: `no text export for ${file.mimeType}` };
}
