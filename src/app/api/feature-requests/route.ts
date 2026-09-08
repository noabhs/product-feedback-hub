import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logEvent, ACTIONS } from "@/lib/events";
import { DEFAULT_FEATURE_REQUEST_STATUS, isFeatureRequestStatus } from "@/lib/feature-request-status";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const [session, requests] = await Promise.all([
    auth(),
    prisma.featureRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ requests, me: session?.user?.email ?? null });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to file a feature request" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (!body.painToSolve?.trim()) {
    return NextResponse.json({ error: "Pain to solve is required" }, { status: 400 });
  }

  const created = await prisma.featureRequest.create({
    data: {
      title: body.title.trim(),
      description: body.description.trim(),
      painToSolve: body.painToSolve.trim(),
      // The reporter is always the signed-in user on create — unlike Insight's
      // createdBy, there's no "entering it on someone else's behalf" case here.
      reporter: session.user.email,
      status: isFeatureRequestStatus(body.status) ? body.status : DEFAULT_FEATURE_REQUEST_STATUS,
    },
  });

  void logEvent(ACTIONS.featureRequestCreated, { target: created.id, label: created.title });
  return NextResponse.json(created, { status: 201 });
}
