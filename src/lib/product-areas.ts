import { prisma } from "@/lib/prisma";

/**
 * Who owns which product area. Data comes from the Product & R&D Map sheet and
 * lives in ProductArea / ProductAreaOwner (migration 20261112000000).
 *
 * Intended uses: tag the owners of an item's areas (comments, mentions,
 * notifications), and show "owned by" next to an area. Everything here is
 * read-only; the table is a snapshot refreshed by migration.
 */
export const OWNER_ROLES = ["pm", "medical_manager", "medical_lead", "sponsor"] as const;
export type OwnerRole = (typeof OWNER_ROLES)[number];

export const OWNER_ROLE_LABELS: Record<OwnerRole, string> = {
  pm: "PM",
  medical_manager: "Medical manager",
  medical_lead: "Medical lead",
  sponsor: "Sponsor",
};

export type Owner = {
  name: string;
  /** Null when the sheet name has no confident match to a hub address. */
  email: string | null;
  role: OwnerRole;
  scope: string | null;
  areaId: string;
  areaName: string;
};

/**
 * The people to tag on an item filed under these hub area keys (the values of
 * Insight.productAreas). Defaults to the PMs only; pass more roles to widen it.
 * One person owning several matching areas appears once per role, with the
 * first area that matched. People without an email are returned too — the
 * caller decides whether to skip them.
 */
export async function ownersForHubAreas(
  hubAreas: string[],
  roles: OwnerRole[] = ["pm"],
): Promise<Owner[]> {
  if (hubAreas.length === 0) return [];
  const areas = await prisma.productArea.findMany({
    where: { hubAreas: { hasSome: hubAreas } },
    orderBy: { sortOrder: "asc" },
    include: { owners: { where: { role: { in: roles } } } },
  });
  const seen = new Set<string>();
  const out: Owner[] = [];
  for (const a of areas) {
    for (const o of a.owners) {
      const key = `${o.role}:${o.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        name: o.name,
        email: o.email,
        role: o.role as OwnerRole,
        scope: o.scope,
        areaId: a.id,
        areaName: a.name,
      });
    }
  }
  return out;
}

/** The areas a person owns, for "items in my ownership". Matches on email. */
export async function areasOwnedBy(email: string, roles?: OwnerRole[]) {
  const rows = await prisma.productAreaOwner.findMany({
    where: { email: email.toLowerCase(), ...(roles ? { role: { in: roles } } : {}) },
    include: { area: true },
    orderBy: { area: { sortOrder: "asc" } },
  });
  return rows.map((r) => ({ role: r.role as OwnerRole, scope: r.scope, area: r.area }));
}
