import { NextRequest, NextResponse } from "next/server";
import { requireUser, fail } from "../_auth";
import { jiraConfigured, listIdeas, parseViewLink } from "@/lib/naming/jira";

export const maxDuration = 60;

/** Parses a view link and lists the project's ideas so the user can choose what to review. */
export async function POST(req: NextRequest) {
  const u = await requireUser();
  if ("res" in u) return u.res;
  const { url } = await req.json().catch(() => ({}));
  const parsed = parseViewLink(String(url ?? ""));
  if (!parsed) return fail(new Error("This does not look like a Jira Product Discovery view link on navina.atlassian.net."), 400);
  if (!jiraConfigured()) return fail(new Error("Jira is not connected to the hub yet. Ask the hub owner to add the Jira token."), 503);
  try {
    return NextResponse.json({ ...parsed, ideas: await listIdeas(parsed.project) });
  } catch (e) {
    return fail(e, 502);
  }
}
