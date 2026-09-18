import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEvent, ACTIONS } from "@/lib/events";
import { hashId, mapProductArea, mapTheme, parseDate, importFeedbackRows } from "@/lib/csv-import";

export async function POST(req: NextRequest) {
  try {
    const { type, rows } = await req.json(); // type: "questions" | "feedback"
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
    }

    let imported = 0;
    const errors: string[] = [];

    if (type === "questions") {
      for (const row of rows) {
        const [productAreaRaw, themeRaw, persona, question, notesIntent, source] = row;
        if (!question?.trim()) continue;
        const id = hashId("q", question);
        try {
          await prisma.discoveryQuestion.upsert({
            where: { id },
            create: {
              id,
              productArea: mapProductArea(productAreaRaw ?? ""),
              theme: mapTheme(themeRaw ?? ""),
              persona: persona?.trim() || null,
              question: question.trim(),
              notesIntent: notesIntent?.trim() || null,
              source: source?.trim() || null,
            },
            update: {},
          });
          imported++;
        } catch (e) { errors.push((e as Error).message); }
      }
    }

    if (type === "feedback") {
      const result = await importFeedbackRows(rows);
      imported += result.imported;
      errors.push(...result.errors);
    }

    if (type === "sources") {
      for (const row of rows) {
        const [name, productAreaRaw, date, format, topics, link, notes] = row;
        if (!name?.trim()) continue;
        const id = hashId("src", name);
        try {
          await prisma.sourceDocument.upsert({
            where: { id },
            create: {
              id,
              name: name.trim(),
              productArea: mapProductArea(productAreaRaw ?? ""),
              date: parseDate(date ?? ""),
              format: format?.trim() || null,
              topics: topics?.trim() || null,
              link: link?.trim() || null,
              notes: notes?.trim() || null,
            },
            update: {},
          });
          imported++;
        } catch (e) { errors.push((e as Error).message); }
      }
    }

    void logEvent(ACTIONS.csvImported, { label: `${imported} ${type} rows` });
    return NextResponse.json({ imported, errors });
  } catch (e) {
    console.error("[import]", e);
    return NextResponse.json({ error: (e as Error).message ?? "Import failed" }, { status: 500 });
  }
}
