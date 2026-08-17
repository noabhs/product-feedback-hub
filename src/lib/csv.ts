/**
 * Minimal RFC-4180 CSV parser.
 *
 * Scans character by character so a quoted cell may contain commas, newlines,
 * and escaped quotes (""). The previous implementation split the file on "\n"
 * *before* handling quotes, which shredded any cell containing a line break —
 * and feedback text pasted from call notes very often does.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  // Normalise line endings so CRLF files (what Excel and Sheets produce on
  // Windows) don't leave a stray \r at the end of every last cell.
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const endCell = () => { row.push(cell.trim()); cell = ""; };
  const endRow = () => {
    endCell();
    // Skip blank lines, including a trailing newline at end of file.
    if (row.some((c) => c !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; }  // escaped quote
        else inQuotes = false;
      } else {
        cell += ch;                                    // includes newlines
      }
      continue;
    }

    if (ch === '"') inQuotes = true;
    else if (ch === ",") endCell();
    else if (ch === "\n") endRow();
    else cell += ch;
  }

  // Flush whatever the file ended on.
  if (cell !== "" || row.length > 0) endRow();

  return rows;
}
