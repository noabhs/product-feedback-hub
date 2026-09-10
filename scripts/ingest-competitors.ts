/**
 * Reads the documents behind every competitor's links into the hub.
 *
 *   npx tsx scripts/ingest-competitors.ts --dry-run
 *   npx tsx scripts/ingest-competitors.ts --only Innovaccer
 *   npx tsx scripts/ingest-competitors.ts
 *
 * A script rather than an API route on purpose. Reading ninety-nine documents
 * takes far longer than any request should live, and this is a job that runs on
 * a schedule — nobody waits on it in a browser.
 *
 * Start with --dry-run. It reports how many documents can actually be opened
 * without calling the model or writing anything, which is the question worth
 * answering first: a service account reaches some of these Drive files and not
 * others, and there is no point condensing anything until you know the coverage.
 *
 * Needs three environment variables: NEON_DATABASE_URL, GOOGLE_SERVICE_ACCOUNT_JSON
 * (raw JSON or base64), and NOTION_TOKEN. Plus ANTHROPIC_API_KEY for real runs.
 */

import { ingestCompetitors, type Status } from "@/lib/ingest/run";

/** Rough Sonnet 5 input rate, for a spend figure at the end of a real run. */
const USD_PER_MILLION_INPUT = 2;

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function value(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? undefined : process.argv[at + 1];
}

const ICON: Record<Status, string> = { ok: "  ok  ", empty: " empty", skipped: "  --  ", failed: " FAIL " };

async function main(): Promise<void> {
  const only = value("only");
  const limitRaw = value("limit");
  const dryRun = flag("dry-run");

  const report = await ingestCompetitors({
    only: only ? [only] : undefined,
    dryRun,
    force: flag("force"),
    limit: limitRaw ? Number(limitRaw) : undefined,
  });

  let lastCompetitor = "";
  for (const o of report.outcomes) {
    if (o.competitor !== lastCompetitor) {
      console.log(`\n${o.competitor}`);
      lastCompetitor = o.competitor;
    }
    const tags = [o.sensitivity, o.chars ? `${Math.round(o.chars / 1000)}k chars` : null, o.note]
      .filter(Boolean)
      .join(" · ");
    console.log(`  [${ICON[o.status]}] ${o.title}${tags ? `  — ${tags}` : ""}`);
  }

  const { ok, empty, skipped, failed } = report.counts;
  const total = ok + empty + skipped + failed;
  console.log(
    `\n${report.competitorsVisited} competitors · ${total} documents · ` +
      `${ok} read, ${empty} empty, ${skipped} skipped, ${failed} failed`,
  );

  if (report.dryRun) {
    const tokens = Math.round(report.charsRead / 4);
    console.log(
      `Dry run — nothing condensed or stored. A real run would condense ` +
        `~${tokens.toLocaleString()} tokens, roughly $${((tokens / 1e6) * USD_PER_MILLION_INPUT).toFixed(2)} of input.`,
    );
  }

  // A failure count is the point of the run, not a reason to fail the run: the
  // useful outcome is the documents that were read plus an honest list of the
  // ones that were not. A non-zero exit would hide both from a scheduled job.
  if (failed > 0) console.log(`\n${failed} document(s) could not be read — listed as FAIL above.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .then(() => process.exit(0));
