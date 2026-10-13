import { inflateRawSync } from "node:zlib";

/**
 * Reading the first sheet of an .xlsx into rows of strings.
 *
 * Hand-rolled rather than pulled from npm. An .xlsx is a zip of XML and Node
 * ships zlib, so this is about a hundred lines against a well-known format,
 * which beats a dependency for the one job of reading a Salesforce export. The
 * same reasoning as lib/csv.ts holding its own CSV parser.
 *
 * Server-only: it imports node:zlib.
 */

/** Zip end-of-central-directory signature, scanned for from the tail. */
const EOCD = 0x06054b50;
const CEN = 0x02014b50;

interface Entry {
  name: string;
  method: number;
  compressedSize: number;
  offset: number;
}

/**
 * Entries from the central directory rather than by scanning local headers: a
 * local header may carry a zero size with the real one in a trailing data
 * descriptor, and the central directory always has the true values.
 */
function entries(buf: Buffer): Map<string, Entry> {
  let eocd = -1;
  // The comment field is almost always empty, so the record is at the very end;
  // 64KB back is the furthest it can be.
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 0xffff - 22); i--) {
    if (buf.readUInt32LE(i) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error("Not a valid .xlsx file (no zip directory found)");

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Entry>();

  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== CEN) break;
    const nameLength = buf.readUInt16LE(p + 28);
    const extraLength = buf.readUInt16LE(p + 30);
    const commentLength = buf.readUInt16LE(p + 32);
    out.set(buf.toString("utf8", p + 46, p + 46 + nameLength), {
      name: buf.toString("utf8", p + 46, p + 46 + nameLength),
      method: buf.readUInt16LE(p + 10),
      compressedSize: buf.readUInt32LE(p + 20),
      offset: buf.readUInt32LE(p + 42),
    });
    p += 46 + nameLength + extraLength + commentLength;
  }
  return out;
}

function read(buf: Buffer, entry: Entry): string {
  // The local header's own name and extra fields sit before the data, and its
  // extra length can differ from the central directory's.
  const nameLength = buf.readUInt16LE(entry.offset + 26);
  const extraLength = buf.readUInt16LE(entry.offset + 28);
  const start = entry.offset + 30 + nameLength + extraLength;
  const raw = buf.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return raw.toString("utf8");
  if (entry.method === 8) return inflateRawSync(raw).toString("utf8");
  throw new Error(`Unsupported compression in the .xlsx (method ${entry.method})`);
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
};

function decode(xml: string): string {
  return xml.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (whole, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      return String.fromCodePoint(parseInt(body.slice(2), 16));
    }
    if (body.startsWith("#")) return String.fromCodePoint(parseInt(body.slice(1), 10));
    return ENTITIES[body] ?? whole;
  });
}

/** All the text inside one element's markup, which is how Excel splits runs. */
function textOf(fragment: string): string {
  const parts = [...fragment.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => m[1]);
  return decode(parts.join(""));
}

/** "BC" -> 28. Column letters are base-26 with A = 1. */
function columnIndex(ref: string): number {
  const letters = ref.replace(/[^A-Za-z]/g, "").toUpperCase();
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * The first worksheet as rows of strings.
 *
 * Cells are placed by their `r` reference, not by the order they appear. Excel
 * omits empty cells entirely, so reading them in sequence shifts every column
 * after a blank one — which for this report would silently file a CSM name as a
 * health rating.
 */
export function readXlsxRows(data: Buffer | ArrayBuffer | Uint8Array): string[][] {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
  const zip = entries(buf);

  const sharedEntry = zip.get("xl/sharedStrings.xml");
  const shared: string[] = [];
  if (sharedEntry) {
    for (const m of read(buf, sharedEntry).matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)) {
      shared.push(textOf(m[1]));
    }
  }

  // The sheet the workbook lists first, falling back to the conventional path.
  let sheetPath = "xl/worksheets/sheet1.xml";
  if (!zip.has(sheetPath)) {
    const found = [...zip.keys()].filter((k) => /^xl\/worksheets\/[^/]+\.xml$/.test(k)).sort();
    if (!found.length) throw new Error("That .xlsx has no worksheets");
    sheetPath = found[0];
  }
  const sheet = read(buf, zip.get(sheetPath)!);

  const rows: string[][] = [];
  for (const rowMatch of sheet.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\s([^>]*?)\/>|<c\s([^>]*?)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1] ?? cellMatch[2] ?? "";
      const inner = cellMatch[3] ?? "";
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /t="([^"]+)"/.exec(attrs)?.[1];

      let value = "";
      if (type === "s") {
        const index = Number(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1]);
        value = Number.isInteger(index) ? (shared[index] ?? "") : "";
      } else if (type === "inlineStr") {
        value = textOf(inner);
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
        value = v === undefined ? "" : decode(v);
      }

      const at = ref ? columnIndex(ref) : cells.length;
      while (cells.length < at) cells.push("");
      cells[at] = value;
    }
    rows.push(cells);
  }
  return rows;
}

/** Zip files start "PK\3\4", which is how an .xlsx is told from a CSV. */
export function looksLikeXlsx(data: Buffer | Uint8Array): boolean {
  return data.length > 4 && data[0] === 0x50 && data[1] === 0x4b && data[2] === 0x03 && data[3] === 0x04;
}
