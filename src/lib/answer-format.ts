/**
 * Turns an AI answer into the blocks the UI renders.
 *
 * The model writes Markdown. The ask bar used to drop the whole string into a
 * single <p>, so `**bold**` showed its asterisks and every theme ran into the
 * next one — a wall of text no one reads. Parsing lives here, apart from React,
 * so it can be checked against real logged answers without a browser.
 *
 * This is a deliberate subset: paragraphs, bullets, numbered items, bold spans
 * and [n] citations. Headings, tables and nesting are not parsed because the
 * prompt tells the model not to write them.
 */

export interface AnswerItem {
  /** "-" for a bullet, "2." for a numbered item — what plain text should use. */
  marker: string;
  text: string;
}

export type AnswerBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: AnswerItem[] }
  | { kind: "ol"; items: AnswerItem[] };

const BULLET = /^[-*•]\s+(.*)$/;
const NUMBERED = /^(\d{1,2})[.)]\s+(.*)$/;

/**
 * Answers written before the prompt asked for one theme per line enumerate
 * inside a single paragraph: "...trust is eroding [8]. 2. **Feature awareness
 * gap** — ...". Those are already in the log, so break them apart on the way
 * out. The split needs a number introducing a bold label, which leaves prose
 * like "$4.4M" and "grew 3.5%" alone.
 */
function splitRunOnList(answer: string): string {
  return answer.replace(/\r\n?/g, "\n").replace(/[ \t]+(?=\d{1,2}[.)]\s+\*\*)/g, "\n");
}

export function parseAnswer(answer: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];

  for (const line of splitRunOnList(answer).split("\n")) {
    const text = line.trim();
    if (!text) continue;

    const bullet = BULLET.exec(text);
    const numbered = bullet ? null : NUMBERED.exec(text);
    if (!bullet && !numbered) {
      // Every newline-separated run of prose is its own paragraph. Markdown
      // would join single-newline lines into one; keeping them apart matches
      // what the writer saw in their editor and reads better in a narrow box.
      blocks.push({ kind: "p", text });
      continue;
    }

    const kind = bullet ? "ul" : "ol";
    const item: AnswerItem = bullet
      ? { marker: "-", text: bullet[1].trim() }
      : { marker: `${numbered![1]}.`, text: numbered![2].trim() };

    // Consecutive items of the same kind belong to one list, so the gap between
    // two bullets stays tighter than the gap between a list and a paragraph.
    const last = blocks[blocks.length - 1];
    if (last && last.kind === kind) last.items.push(item);
    else blocks.push({ kind, items: [item] });
  }

  return blocks;
}

/** Drops the Markdown marks, for copying to Slack and for one-line previews. */
export function stripMarks(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
}

/** The answer as plain text, one block per line, marks and asterisks gone. */
export function plainAnswer(answer: string): string {
  return parseAnswer(answer)
    .flatMap((block) =>
      block.kind === "p"
        ? [stripMarks(block.text)]
        : block.items.map((item) => `${item.marker} ${stripMarks(item.text)}`),
    )
    .join("\n");
}
