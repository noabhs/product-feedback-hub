import { cleanKey } from "@/lib/claude";
import type { IdeaRow } from "./types";

export const JIRA_HOST = "navina.atlassian.net";
const PRODUCT_FIELD = "customfield_12183";
const TEAM_FIELD = "customfield_10001";

export function jiraConfigured(): boolean {
  return !!(cleanKey(process.env.JIRA_EMAIL) && cleanKey(process.env.JIRA_API_TOKEN));
}

function authHeader(): string {
  const email = cleanKey(process.env.JIRA_EMAIL);
  const token = cleanKey(process.env.JIRA_API_TOKEN);
  if (!email || !token) throw new Error("Jira is not connected. JIRA_EMAIL and JIRA_API_TOKEN are not set.");
  return "Basic " + Buffer.from(`${email}:${token}`).toString("base64");
}

async function jira(path: string, init?: RequestInit) {
  const res = await fetch(`https://${JIRA_HOST}/rest/api/3${path}`, {
    ...init,
    headers: { Authorization: authHeader(), Accept: "application/json", "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Jira ${res.status}: ${text.slice(0, 200) || res.statusText}`);
  }
  return res.status === 204 ? null : res.json();
}

export type JiraIssue = {
  key: string;
  fields: {
    summary: string;
    status?: { name: string };
    issuetype?: { name: string; hierarchyLevel?: number };
    description?: unknown;
    issuelinks?: IssueLink[];
    parent?: { key: string };
    [k: string]: unknown;
  };
};

export type IssueLink = {
  type: { name: string };
  inwardIssue?: LinkedIssue;
  outwardIssue?: LinkedIssue;
};
type LinkedIssue = { key: string; fields: { summary: string; status?: { name: string }; issuetype?: { name: string } } };

/** All issues matching a JQL query, following the token pagination. */
export async function searchAll(jql: string, fields: string[], cap = 600): Promise<JiraIssue[]> {
  const out: JiraIssue[] = [];
  let token: string | undefined;
  do {
    const data = await jira("/search/jql", {
      method: "POST",
      body: JSON.stringify({ jql, fields, maxResults: 100, ...(token ? { nextPageToken: token } : {}) }),
    });
    out.push(...(data.issues as JiraIssue[]));
    token = data.nextPageToken;
  } while (token && out.length < cap);
  return out;
}

/** Sets the summary and returns what Jira now holds, so the caller can verify. */
export async function renameIssue(key: string, name: string): Promise<{ verified: boolean }> {
  await jira(`/issue/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ fields: { summary: name } }) });
  const now = await jira(`/issue/${encodeURIComponent(key)}?fields=summary`);
  return { verified: now?.fields?.summary === name };
}

/** The ideas of a project, for choosing which to review. */
export async function listIdeas(project: string): Promise<IdeaRow[]> {
  const issues = await searchAll(`project = "${project}" ORDER BY created ASC`, ["summary", "status", PRODUCT_FIELD, TEAM_FIELD]);
  return issues.map((i) => {
    const product = i.fields[PRODUCT_FIELD] as { value?: string } | null | undefined;
    const team = i.fields[TEAM_FIELD] as { name?: string } | null | undefined;
    return { key: i.key, summary: i.fields.summary, status: i.fields.status?.name ?? "", team: team?.name ?? "", product: product?.value ?? "" };
  });
}

/** Atlassian Document Format to plain text, enough to read a description. */
export function adfText(node: unknown): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  const n = node as { type?: string; text?: string; content?: unknown[] };
  if (n.text) return n.text;
  const inner = (n.content ?? []).map(adfText).join(n.type === "doc" || n.type === "bulletList" || n.type === "orderedList" ? "\n" : "");
  return ["paragraph", "heading", "listItem"].includes(n.type ?? "") ? inner + "\n" : inner;
}

/** Parses a Polaris view link into its project key and view id. */
export function parseViewLink(raw: string): { project: string; viewId: string } | null {
  try {
    const u = new URL(raw.trim());
    if (u.host !== JIRA_HOST) return null;
    const m = u.pathname.match(/\/projects\/([A-Z][A-Z0-9_]+)\/ideas\/view\/([0-9a-fA-F-]{8,})/);
    return m ? { project: m[1], viewId: m[2] } : null;
  } catch {
    return null;
  }
}

const DELIVERY_LINK = "Polaris work item link";
const CHILD_OF_LINK = "Is child task of";

export type Context = {
  delivery: { key: string; type: string; status: string; title: string; epicLinks: IssueLink[] }[];
};

/** The delivery tickets an idea is "implemented by", read from the idea's own links. */
export function deliveryFromLinks(links: IssueLink[] | undefined) {
  return (links ?? [])
    .filter((l) => l.type.name === DELIVERY_LINK && l.inwardIssue)
    .map((l) => l.inwardIssue!)
    .map((i) => ({ key: i.key, type: i.fields.issuetype?.name ?? "", status: i.fields.status?.name ?? "", title: i.fields.summary }));
}

/** Release Events (REL-) that a delivery Epic is a child of. */
export function releaseKeysFromLinks(links: IssueLink[] | undefined): string[] {
  return (links ?? [])
    .filter((l) => l.type.name === CHILD_OF_LINK)
    .map((l) => l.inwardIssue ?? l.outwardIssue)
    .filter((i): i is LinkedIssue => !!i && i.key.startsWith("REL-"))
    .map((i) => i.key);
}
