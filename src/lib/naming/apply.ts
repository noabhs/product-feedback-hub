import { prisma } from "@/lib/prisma";
import { renameIssue } from "./jira";
import type { ItemData } from "./types";

type Log = { by: string; reviewId: string | null; itemKey: string };

async function rename(log: Log, action: string, key: string, from: string, to: string) {
  let ok = true;
  let error: string | undefined;
  try {
    const r = await renameIssue(key, to);
    if (!r.verified) error = "Jira did not show the new name afterwards.";
  } catch (e) {
    ok = false;
    error = e instanceof Error ? e.message : "Unknown error";
  }
  await prisma.namingAudit.create({ data: { by: log.by, reviewId: log.reviewId, action, key, itemKey: log.itemKey, from, to, result: ok ? "ok" : "failed", error } });
  return { ok, error };
}

/**
 * Renames an accepted idea, then its delivery tickets, then their Release Events and
 * steps. A step is only renamed after its event, an event only after its Epic, and
 * nothing below the idea is touched if the idea itself failed.
 */
export async function applyItem(itemId: string, by: string) {
  const item = await prisma.namingItem.findUniqueOrThrow({ where: { id: itemId } });
  const name = item.proposed.trim();
  if (!name || name.length > 255) throw new Error("Write a name first.");
  const data = structuredClone(item.data as unknown as ItemData);
  const log: Log = { by, reviewId: item.reviewId, itemKey: item.key };

  const idea = await rename(log, "rename_idea", item.key, item.current, name);
  if (!idea.ok) {
    return prisma.namingItem.update({ where: { id: itemId }, data: { state: "failed", data: { ...data, error: idea.error ?? "Jira refused the change" } } });
  }
  const failed: string[] = [];
  for (const d of data.delivery) {
    if (d.action !== "rename") { d.done = "left"; continue; }
    const r = await rename(log, "rename_delivery", d.key, d.title, name);
    if (r.ok) { d.title = name; d.done = "renamed"; } else { d.done = "failed"; d.error = r.error; failed.push(d.key); }
  }
  for (const rel of data.releases) {
    const epic = data.delivery.find((d) => d.key === rel.epic);
    if (rel.action !== "rename" || epic?.done !== "renamed") { rel.done = "left"; continue; }
    const r = await rename(log, "rename_release", rel.key, rel.title, name);
    if (!r.ok) { rel.done = "failed"; rel.error = r.error; failed.push(rel.key); continue; }
    rel.title = name; rel.done = "renamed";
    for (const c of rel.children) {
      if (c.suffix == null) { c.done = "left"; continue; }
      const next = name + c.suffix;
      const cr = await rename(log, "rename_release_step", c.key, c.title, next);
      if (cr.ok) { c.title = next; c.done = "renamed"; } else { c.done = "failed"; c.error = cr.error; failed.push(c.key); }
    }
  }
  data.error = failed.length ? `Not renamed: ${failed.join(", ")}` : null;
  return prisma.namingItem.update({ where: { id: itemId }, data: { state: "applied", appliedAt: new Date(), data: { ...data } } });
}

/** Puts an old name back. Only the one ticket the audit row names. */
export async function revertAudit(id: string, by: string) {
  const row = await prisma.namingAudit.findUniqueOrThrow({ where: { id } });
  if (row.reverted || !row.action.startsWith("rename_")) throw new Error("This change cannot be reverted.");
  const r = await rename({ by, reviewId: row.reviewId, itemKey: row.itemKey ?? row.key }, "revert", row.key, row.to, row.from);
  if (!r.ok) throw new Error(r.error ?? "Jira refused the change");
  await prisma.namingAudit.update({ where: { id }, data: { reverted: true } });
  if (row.action === "rename_idea" && row.reviewId && row.itemKey) {
    await prisma.namingItem.updateMany({ where: { reviewId: row.reviewId, key: row.itemKey, state: "applied" }, data: { state: "pending" } });
  }
}
