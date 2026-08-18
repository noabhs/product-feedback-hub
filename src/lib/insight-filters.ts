/**
 * The feed filters are multi-select, so a filter arrives as a repeated param
 * (?client=Aegis&client=NOMS) rather than one comma-joined string — a client
 * name containing a comma would otherwise split into two bogus filters.
 *
 * Shared by the feed and the CSV export so an export can't quietly apply
 * different filters than the table the user is looking at.
 */
export function insightWhere(searchParams: URLSearchParams): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  // Deliberately no comma-splitting: "Smith, Inc." is one client, not two.
  const picked = (key: string) =>
    searchParams.getAll(key).map((v) => v.trim()).filter(Boolean);

  const productArea = picked("productArea");
  const theme = picked("theme");
  const client = picked("client");

  // `in` with a single entry behaves the same as equality, so one code path
  // covers both, and a bare ?client=Aegis link keeps working.
  if (productArea.length) where.productArea = { in: productArea };
  if (theme.length) where.theme = { in: theme };
  if (client.length) where.client = { in: client };

  const search = searchParams.get("search")?.trim();
  if (search) {
    where.OR = [
      { oneLiner: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { client: { contains: search, mode: "insensitive" } },
      { persona: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}
