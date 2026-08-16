import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDiscoveryQuestions } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { topic, productAreas, persona, clientContext } = await req.json();
    if (!topic?.trim()) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const where = productAreas?.length > 0 ? { productArea: { in: productAreas as string[] } } : {};

    const [questions, insights] = await Promise.all([
      prisma.discoveryQuestion.findMany({ where, take: 60 }),
      prisma.insight.findMany({ where, take: 30, orderBy: { createdAt: "desc" } }),
    ]);

    const generated = await generateDiscoveryQuestions(
      topic,
      persona ?? null,
      clientContext ?? null,
      questions,
      insights.map((i) => ({ oneLiner: i.oneLiner, content: i.content, client: i.client }))
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
