import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOwner, shortName } from "@/lib/people";
import { HUB_DATA_DEFAULT, HUB_DATA_SLUG } from "@/lib/hub-data-default";
import { HubDataView } from "@/components/analytics/HubDataView";

/**
 * What's in the hub and when it changes. Readable by everyone signed in; only the
 * hub owner gets the editor (the API route checks again).
 */
export async function HubDataSection() {
  const [session, row] = await Promise.all([
    auth(),
    prisma.pageContent.findUnique({ where: { slug: HUB_DATA_SLUG } }),
  ]);

  return (
    <HubDataView
      initialBody={row?.body ?? HUB_DATA_DEFAULT}
      canEdit={isOwner(session?.user?.email)}
      updatedAt={row?.updatedAt.toISOString() ?? null}
      updatedBy={row?.updatedBy ? shortName(row.updatedBy) : null}
    />
  );
}
