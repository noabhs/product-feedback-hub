import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDiscoveryQuestions } from "@/lib/claude";
import { logEvent, ACTIONS } from "@/lib/events";

export async function POST(req: NextRequest) {
  try {
    const { topic, productAreas, persona, clientContext } = await req.json();
    if (!topic?.trim()) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const areas = (productAreas ?? []) as string[];
    // Questions carry one area, insights several — so the two need different
    // operators against the same picked list.
    const questionWhere = areas.length ? { productArea: { in: areas } } : {};
    const insightWhere = areas.length ? { productAreas: { hasSome: areas } } : {};

    const [questions, insights] = await Promise.all([
      prisma.discoveryQuestion.findMany({ where: questionWhere, take: 60 }),
      prisma.insight.findMany({ where: insightWhere, take: 30, orderBy: { createdAt: "desc" } }),
    ]);

    const apiKey = req.headers.get("x-anthropic-key") ?? undefined;
    const generated = await generateDiscoveryQuestions(
      topic,
      persona ?? null,
      clientContext ?? null,
      questions,
      insights.map((i) => ({ oneLiner: i.oneLiner, content: i.content, client: i.client })),
      apiKey
    ) as { sessionContext: string; sections: { title: string; questions: string[] }[] };

    const lines: string[] = [];
    lines.push(`Discovery questions — ${topic}`);
    lines.push("─".repeat(60));
    lines.push("");
    lines.push("Session context");
    lines.push(generated.sessionContext);
    lines.push("");
    for (const section of generated.sections) {
      lines.push(`## ${section.title}`);
      lines.push("");
      for (const q of section.questions) {
        lines.push(q);
        lines.push("");
      }
    }
    lines.push("Navina • Confidential");

    void logEvent(ACTIONS.aiGenerateDoc, { label: topic });
    return NextResponse.json({
      text: lines.join("\n"),
      sections: generated.sections,
      sessionContext: generated.sessionContext,
    });
  } catch (e) {
    console.error("[generate-doc]", e);
    return NextResponse.json({ error: (e as Error).message ?? "Generation failed" }, { status: 500 });
  }
}
