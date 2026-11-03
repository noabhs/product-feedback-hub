import { NextRequest, NextResponse } from "next/server";
import { requireEditor, fail } from "../_auth";
import { filterJql, jiraConfigured, listByJql, listIdeas, missingJiraVars, parseJqlLink, parseViewLink } from "@/lib/naming/jira";

export const maxDuration = 60;

/**
 * Reads a link and lists the tickets it covers so the user can choose what to review.
 * A Product Discovery view lists its whole project, because Jira does not expose a view's
 * own filter. An issue-search link carries its JQL, so it lists exactly what the search finds.
 */
export async function POST(req: NextRequest) {
  const u = await requireEditor();
  if ("res" in u) return u.res;
  const { url } = await req.json().catch(() => ({}));
  const view = parseViewLink(String(url ?? ""));
  const search = view ? null : parseJqlLink(String(url ?? ""));
  if (!view && !search) {
    return fail(new Error("This is not a link the hub can read. Paste a Jira Product Discovery view, or the link of a Jira issue search (the page address after you filter issues, which contains jql= or filter=). Board links do not carry their filter."), 400);
  }
  if (!jiraConfigured()) return fail(new Error(`Jira is not connected to this deployment. Missing: ${missingJiraVars().join(", ")}. Add it in Vercel, then redeploy.`), 503);
  try {
    if (view) return NextResponse.json({ kind: "view", ...view, ideas: await listIdeas(view.project) });
    const jql = "jql" in search! ? search.jql : await filterJql(search!.filterId);
    return NextResponse.json({ kind: "search", ideas: await listByJql(jql) });
  } catch (e) {
    return fail(e, 502);
  }
}
