/**
 * Moves the "Competitive Intelligence" pseudo-client's feedback entries into
 * competitor claims (CompetitorInsight).
 *
 *   npx tsx scripts/move-competitive-intel.ts            # dry run, writes nothing
 *   npx tsx scripts/move-competitive-intel.ts --apply    # backup, create, delete
 *
 * Entries are titled "Competitor - claim"; the prefix picks the competitor.
 * No prefix means no competitor, so the entry stays in feedback. Near-duplicates
 * of a claim the competitor already has are skipped. Originals are deleted only
 * after their claim exists, and a JSON backup of every row is written first.
 */
import { writeFileSync } from "node:fs";
import { prisma } from "@/lib/prisma";

const APPLY = process.argv.includes("--apply");
const CLIENT = "Competitive Intelligence";
const BACKUP = process.env.BACKUP_PATH ?? "competitive-intel-backup.json";

const THEME_TOPICS: Record<string, string[]> = {
  PRICING_WTP: ["PRICING"],
  PAIN_POINTS: ["WEAKNESSES"],
  TRUST: ["POSITIONING"],
  WORKFLOW: ["CAPABILITIES"],
  DATA_INTEGRATION: ["INTEGRATIONS"],
  AGENTIC: ["CAPABILITIES"],
  GOALS: ["STRATEGY"],
  OTHER: ["POSITIONING"],
};

// Prefixes that name a regulator, publication or market theme rather than a
// company. They are filed under one catch-all competitor, with the prefix kept
// in the one-liner so the context isn't lost.
const CATCH_ALL = "Market & regulatory";
const NOT_A_COMPETITOR = new Set([
  "cms", "doj", "oig", "medpac", "congress", "white house", "chamber", "jama", "ama", "ama / fierce",
  "market", "ambient market", "competitive landscape", "medicare advantage", "navina", "highmark health",
  "juxly / arcadia", "vytalize / unitedhealth", "lightbeam / apixio / stanson",
]);
const ALIAS: Record<string, string> = {
  foreseemed: "Foresee Medical",
  "eclat / evaire": "Eclat / Evarie",
  "juxly / arcadia": "Arcadia",
  "lightbeam / apixio / stanson": "Lightbeam Health",
  "vytalize / unitedhealth": "Vytalize",
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2);
function jaccard(a: string, b: string) {
  const x = new Set(norm(a)), y = new Set(norm(b));
  if (!x.size || !y.size) return 0;
  let n = 0;
  for (const w of x) if (y.has(w)) n++;
  return n / (x.size + y.size - n);
}

(async () => {
  const rows = await prisma.insight.findMany({ where: { client: CLIENT }, orderBy: { date: "asc" } });
  const competitors = await prisma.competitor.findMany({ include: { insights: { select: { oneLiner: true, content: true } } } });
  const byName = new Map(competitors.map((c) => [c.name.toLowerCase(), c]));
  // "Nuance" should reach "Nuance DAX", "Epic" should reach "Epic Systems".
  const find = (n: string) => {
    const k = n.toLowerCase();
    return byName.get(k) ?? competitors.find((c) => c.name.toLowerCase().startsWith(k + " ") || k.startsWith(c.name.toLowerCase() + " "));
  };

  type Row = (typeof rows)[number];
  type Comp = (typeof competitors)[number];
  const plan = {
    move: [] as { r: Row; name: string; claim: string; comp: Comp | undefined }[],
    dupes: [] as { r: Row; comp: string; dupe: string }[],
    noPrefix: [] as Row[],
    newNames: new Map<string, number>(),
  };
  for (const r of rows) {
    const m = r.oneLiner.match(/^(.{2,40}?)\s+[-–—]\s+(.+)$/);
    if (!m) { plan.noPrefix.push(r); continue; }
    const [, name, claim] = m;
    const key = name.trim().toLowerCase();
    const general = NOT_A_COMPETITOR.has(key) && !ALIAS[key];
    const target = general ? CATCH_ALL : (ALIAS[key] ?? name.trim());
    const comp = find(target);
    // Several-company and general entries keep their original subject up front.
    const claimText = general || ALIAS[key] && ALIAS[key] !== name.trim() ? `${name.trim()}: ${claim}` : claim;
    const pool = comp?.insights ?? [];
    const dupe = pool.find((i) => jaccard(`${claim} ${r.content}`, `${i.oneLiner} ${i.content}`) >= 0.5);
    if (dupe) { plan.dupes.push({ r, comp: comp!.name, dupe: dupe.oneLiner }); continue; }
    if (!comp) plan.newNames.set(target, (plan.newNames.get(target) ?? 0) + 1);
    plan.move.push({ r, name: target, claim: claimText, comp });
  }

  console.log(`rows ${rows.length} | to move ${plan.move.length} | duplicates ${plan.dupes.length} | no competitor prefix ${plan.noPrefix.length}`);
  console.log("new competitors:", [...plan.newNames.entries()]);
  console.log("dupe samples:", plan.dupes.slice(0, 4).map((d) => `${d.comp}: ${d.r.oneLiner.slice(0, 70)}  ~  ${d.dupe.slice(0, 70)}`));
  console.log("no-prefix samples:", plan.noPrefix.slice(0, 8).map((r) => `[${r.sourceName}] ${r.oneLiner.slice(0, 90)}`));
  if (!APPLY) { console.log("dry run: nothing written"); process.exit(0); }

  writeFileSync(BACKUP, JSON.stringify(rows, null, 1));
  console.log(`backup written: ${BACKUP}`);

  const created = new Map<string, string>();
  for (const name of plan.newNames.keys()) {
    const c = await prisma.competitor.create({ data: { name, category: "Other" } });
    created.set(name, c.id);
  }
  const moveIds: string[] = [];
  for (const { r, name, claim, comp } of plan.move) {
    // Slack threads and battlecards are internal working material; the rest is
    // unreviewed, so everything defaults to internal rather than risk leaking.
    await prisma.competitorInsight.create({
      data: {
        competitorId: comp?.id ?? created.get(name)!,
        oneLiner: claim.trim(),
        content: r.content,
        topics: THEME_TOPICS[r.theme] ?? ["POSITIONING"],
        productAreas: r.productAreas.filter((a: string) => a !== "COMPETITIVE"),
        confidence: "REPORTED",
        sensitivity: "internal",
        sensitivityReason: "Moved from product feedback; not reviewed for sharing",
        asOf: r.date,
      },
    });
    moveIds.push(r.id);
  }
  // Duplicates are already represented, so their feedback rows go too.
  const del = [...moveIds, ...plan.dupes.map((d) => d.r.id)];
  const res = await prisma.insight.deleteMany({ where: { id: { in: del } } });
  console.log(`created ${moveIds.length} claims, deleted ${res.count} feedback rows`);
  const left = await prisma.insight.count({ where: { client: CLIENT } });
  console.log(`left in feedback under "${CLIENT}": ${left}`);
  process.exit(0);
})();
