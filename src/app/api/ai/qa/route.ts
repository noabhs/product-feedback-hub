import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { answerQuestion } from "@/lib/claude";
import { logEvent, ACTIONS } from "@/lib/events";

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });

  const words = question.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const insights = await prisma.insight.findMany({
    where: {
      OR: words.map((word: string) => ({
        OR: [
          { oneLiner: { contains: word, mode: "insensitive" } },
          { content: { contains: word, mode: "insensitive" } },
        ],
      })),
    },
    take: 15,
    orderBy: { createdAt: "desc" },
  });

  if (insights.length === 0) {
    return NextResponse.json({ answer: "No relevant insights found for this question.", sources: [] });
  }

  const apiKey = req.headers.get("x-anthropic-key") ?? undefined;
  const answer = await answerQuestion(question, insights, apiKey);
  void logEvent(ACTIONS.aiAsk, { label: question });
  return NextResponse.json({
    answer,
    sources: insights.map((i) => ({ id: i.id, oneLiner: i.oneLiner, client: i.client })),
  });
}
