import { PRODUCT_FIELD, adfText, deliveryFromLinks, releaseKeysFromLinks, searchAll } from "./jira";
import { proposeNames, type Proposal } from "./propose";
import type { DeliveryLink, ItemData, ReleaseChild, ReleaseLink } from "./types";

export type BuiltItem = { key: string; order: number; current: string; proposed: string; state: "pending" | "needs_context"; data: ItemData };

const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const inList = (keys: string[]) => `key in (${keys.join(",")})`;

/**
 * Reads the chosen ideas with their linked Epics, Release Events and steps, then asks
 * Claude for a name per idea. Nothing is written to Jira here.
 */
export async function buildItems(keys: string[]): Promise<BuiltItem[]> {
  const ideas = await searchAll(inList(keys), ["summary", "status", "description", "issuelinks", "issuetype", PRODUCT_FIELD]);
  const byKey = new Map(ideas.map((i) => [i.key, i]));
  const ordered = keys.filter((k) => byKey.has(k));

  const deliveryOf = new Map(ordered.map((k) => [k, deliveryFromLinks(byKey.get(k)!.fields.issuelinks)]));
  const epicUse = new Map<string, number>();
  for (const list of deliveryOf.values()) for (const d of list) epicUse.set(d.key, (epicUse.get(d.key) ?? 0) + 1);
  const epicKeys = [...epicUse.keys()];

  // Release Events hang off the Epic by an "Is child task of" link.
  const eventsOfEpic = new Map<string, string[]>();
  for (const part of chunk(epicKeys, 50)) {
    for (const e of await searchAll(inList(part), ["issuelinks"])) eventsOfEpic.set(e.key, releaseKeysFromLinks(e.fields.issuelinks));
  }
  const eventKeys = [...new Set([...eventsOfEpic.values()].flat())];
  const eventUse = new Map<string, number>();
  for (const evs of eventsOfEpic.values()) for (const k of evs) eventUse.set(k, (eventUse.get(k) ?? 0) + 1);

  const events = new Map<string, { key: string; type: string; status: string; title: string }>();
  const kids = new Map<string, ReleaseChild[]>();
  if (eventKeys.length) {
    const fields = ["summary", "status", "issuetype", "parent"];
    for (const e of await searchAll(inList(eventKeys), fields)) {
      events.set(e.key, { key: e.key, type: e.fields.issuetype?.name ?? "Release Event", status: e.fields.status?.name ?? "", title: e.fields.summary });
    }
    const phases = await searchAll(`parent in (${eventKeys.join(",")})`, fields);
    const phaseKeys = phases.map((p) => p.key);
    const below = phaseKeys.length ? await searchAll(`parent in (${phaseKeys.join(",")})`, fields) : [];
    const parentOf = new Map<string, string>();
    for (const p of phases) parentOf.set(p.key, p.fields.parent!.key);
    for (const c of below) parentOf.set(c.key, parentOf.get(c.fields.parent!.key)!);
    for (const c of [...phases, ...below]) {
      const ev = events.get(parentOf.get(c.key)!);
      if (!ev) continue;
      const suffix = c.fields.summary.startsWith(ev.title) ? c.fields.summary.slice(ev.title.length) : null;
      const list = kids.get(ev.key) ?? [];
      list.push({ key: c.key, type: c.fields.issuetype?.name ?? "", status: c.fields.status?.name ?? "", title: c.fields.summary, suffix });
      kids.set(ev.key, list);
    }
  }

  // Proposals, a few batches at a time.
  const proposals = new Map<string, Proposal>();
  const batches = chunk(ordered, 10);
  for (let i = 0; i < batches.length; i += 3) {
    await Promise.all(
      batches.slice(i, i + 3).map(async (b) => {
        const got = await proposeNames(
          b.map((k) => {
            const f = byKey.get(k)!.fields;
            return {
              key: k,
              title: f.summary,
              description: adfText(f.description),
              status: f.status?.name ?? "",
              product: (f[PRODUCT_FIELD] as { value?: string } | null | undefined)?.value ?? "",
              delivery: (deliveryOf.get(k) ?? []).map((d) => ({ type: d.type, title: d.title })),
            };
          }),
        );
        got.forEach((v, k) => proposals.set(k, v));
      }),
    );
  }

  return ordered.map((key, idx) => {
    const f = byKey.get(key)!.fields;
    const p = proposals.get(key);
    const proposed = (p?.proposed ?? "").trim();
    const hasName = proposed.length > 0 && proposed !== f.summary;
    const delivery: DeliveryLink[] = (deliveryOf.get(key) ?? []).map((d) => {
      const shared = (epicUse.get(d.key) ?? 0) > 1;
      const isEpic = d.type === "Epic" || d.type === "Initiative";
      const leave = !hasName || shared || !isEpic;
      return { ...d, action: leave ? "leave" : "rename", reason: shared ? `Shared by ${epicUse.get(d.key)} ideas` : !isEpic ? `It is a ${d.type}` : "" };
    });
    const releases: ReleaseLink[] = [];
    for (const d of delivery) {
      for (const ek of eventsOfEpic.get(d.key) ?? []) {
        const ev = events.get(ek);
        if (!ev) continue;
        const shared = (eventUse.get(ek) ?? 0) > 1;
        const leave = d.action !== "rename" || shared;
        releases.push({ ...ev, epic: d.key, action: leave ? "leave" : "rename", reason: shared ? "Shared by several Epics" : d.action !== "rename" ? "Its Epic is left as is" : "", children: kids.get(ek) ?? [] });
      }
    }
    return {
      key,
      order: idx + 1,
      current: f.summary,
      proposed: hasName ? proposed : "",
      state: hasName ? "pending" : p?.question || !proposed ? "needs_context" : "pending",
      data: {
        level: p?.level ?? "Epic",
        inferred: !!p?.inferred,
        question: hasName ? null : p?.question ?? null,
        jstatus: f.status?.name ?? "",
        desc: adfText(f.description).slice(0, 1200),
        delivery,
        releases,
        error: null,
      },
    };
  });
}
