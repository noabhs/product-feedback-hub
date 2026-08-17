import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const sources = await prisma.sourceDocument.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ sources });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const source = await prisma.sourceDocument.create({
    data: {
      name: body.name.trim(),
      productArea: body.productArea || "GENERAL",
      format: body.format || null,
      date: body.date ? new Date(body.date) : null,
      topics: body.topics || null,
      link: body.link || null,
      notes: body.notes || null,
      createdBy: session?.user?.email ?? null,
    },
  });
  return NextResponse.json(source, { status: 201 });
}
