/**
 * One-off manual backfill of Innovaccer's documents.
 *
 * Read through this session's Notion and Drive connectors and condensed by hand,
 * because the hub has no NOTION_TOKEN or GOOGLE_SERVICE_ACCOUNT_JSON yet and no
 * local ANTHROPIC_API_KEY to run the real condense step. Its purpose is to put
 * real rows behind the panel so the display can be judged before credentials
 * land.
 *
 * Every row is stamped condenseVersion "manual-1". The pipeline's own version is
 * "ingest-1", so a later real run sees these as stale and re-reads them — this
 * backfill replaces itself rather than having to be cleaned up.
 *
 *   npx tsx --env-file=.env scripts/backfill-innovaccer.ts
 */

import { prisma } from "@/lib/prisma";

const VERSION = "manual-1";

interface Row {
  /** Matched against CompetitorSource.url to attach the document to its link. */
  sourceUrl: string | null;
  externalId: string;
  origin: "notion" | "drive";
  title: string;
  url: string;
  mimeType?: string;
  text?: string;
  summary?: string;
  sensitivity?: "internal" | "external";
  sensitivityReason?: string;
  status: "ok" | "empty" | "skipped" | "failed";
  note?: string;
  truncated?: boolean;
  sourceUpdatedAt?: string;
}

const DOSSIER_SUMMARY = `A working CI dossier, tagged throughout with its own confidence levels — **VERIFIED** (multiple independent sources), **REPORTED** (single credible source), **CLAIMED** (Innovaccer's own marketing).

**Company.** Founded 2014, San Francisco, private. All four co-founders still in senior roles: Abhinav Shashank (CEO), Kanav Hasija (CPO), Sandeep Gupta (COO/President), Sachin Jaiswal. Significant India-based engineering and delivery. No CRO or head of enterprise sales surfaced publicly.

**Funding.** ~$675M raised over 9 rounds; $275M Series F January 2025 at ~$3.45B post-money. Series F investors include Kaiser Permanente and Banner Health — Kaiser is both investor and named customer. Claimed ~$252M ARR for 2025 (up from ~$130M), 50% YoY growth for five consecutive years, and 115% net revenue retention; the dossier marks all three CLAIMED, sourced to a self-reported aggregator or Innovaccer's own site. The CEO states an IPO target of $400–500M ARR, which the dossier reads as roughly two years out and as reason to expect heavy discounting to grow ARR.

**Layoffs — the dossier's stated key signal.** Three rounds in four years: ~90 (8%) September 2022, ~245 (15%) January 2023, ~340 (15%, majority overseas) May 2026. The last came five months after the Series F and four months after a $75M ESOP buyback, justified as an "AI-native" transition. The dossier's reading is that each round grew while the framing moved from defensive to offensive.

**Acquisitions — five in two years.** Cured (2024, patient CRM and outreach), Humbi AI (January 2025, actuarial and VBC contract modelling), Story Health (September 2025, AI specialty care, accepted into the CMS ACCESS model), Pharmacy Quality Solutions (2024, pharmacy Stars), CaduceusHealth (May 2026, ~$66M, RCM services with ~200 staff and ~4,000 providers). The dossier notes that in the 2023 Kaiser PHMI RFP "no acquisitions" was cited as an Innovaccer advantage over Health Catalyst, and argues that advantage is now gone.

**Delivery model.** January 2026: Coforge named "preferred platinum implementation partner" for Gravity, under a joint initiative called G-Forge. The dossier flags the sequence — partnership in January, ESOP buyback in January, layoffs in May — as Innovaccer shifting implementation headcount off its own books, and treats SI-led implementation as a possible displacement trigger. The CEO has said a first deployment cost $12M+ in data harmonisation on a relatively small contract.

**Products.** Gravity is the mandatory data foundation (400+ connectors, 80+ EHRs, 6,000+ data quality rules, 80M+ patient records; Best in KLAS 2026 at 93.2). Layered on top: Atlas (population health), InNote (EHR-embedded point of care), Care Management, Flow (RCM and prior auth), Comet (access centre), Cured (CRM), Galaxy (payer), PQS (pharmacy), StoryHealth, Humbi. The dossier flags that the KLAS wins are for data, CRM and payer platforms — there is no dedicated KLAS Population Health Management badge on the Atlas page.

**Pricing.** PMPM and modular — a "Lego model" where the Gravity base layer is mandatory, with a three-year contract minimum and no published pricing. Module estimates come from a Navina SAM analysis (July 2026) based on real pricing from a large deal roughly four years ago with a 40% uplift applied, explicitly marked REPORTED rather than verified: InNote ~$0.25 PMPM, InCare ~$0.17 PMPM, full stack ~$1.06 PMPM. The dossier draws the displacement conclusion directly — Navina's Care Management list price is $1.50 PMPM standalone and the full Risk Enterprise plus Care Management bundle is $2.65 PMPM, so replacing Innovaccer with Navina is a material price increase the compare-and-contrast framing has to address. It also records a website claim of "outcome-based pricing — we charge for work done, not access", which it treats as contradicting or supplementing the PMPM model and needing verification.

**Its own conclusion for Navina:** the workflows Navina plays in — HCC capture, care gap closure, care management — are all data-dependency workflows, which is Innovaccer's strongest territory rather than a weak spot. Differentiation therefore has to come from clinical depth, data quality and workflow integration, not from claiming a different category.

**Open gaps the document names:** who runs Innovaccer's enterprise sales; which products Ascension actually uses; whether Comet is genuinely bundled with Atlas; and current pricing structure following the Atlas launch. It names an internal colleague as the only reliable current source on pricing, and states the pricing figures must not be used in external-facing material without verification.`;

const PARENT_SUMMARY = `Innovaccer aggregates data from EMRs, claims, pharmacy and labs into a unified patient record, then builds modular applications on top — population health, point-of-care workflows, care management, CRM and revenue cycle — sold to both providers and payers. It has expanded through acquisition and positions itself as a broad end-to-end platform across clinical, operational and financial workflows.

**Pricing and packaging**
- PMPM-based and modular (a "Lego model") — the customer pays only for the modules selected.
- The Gravity data layer is a mandatory base for every customer, described as a non-negotiable foundation.
- Three-year contract minimum, with discounts available for five- to ten-year commitments.
- Performance or risk-based pricing is not standard; the page says it is offered only where the client enforces consistent workflows across all provider groups.
- No published pricing — enterprise deals are quoted per organisation on covered lives, module mix and contract length.

**Products, as the page groups them**
- *Data and AI*: Gravity (the data platform — 400+ connectors, 80+ EHRs) and Agents of Care (AI agents automating prior auth, outreach, coding support, with humans retained for exceptions).
- *Population health and care management*: Atlas (risk, quality and population analytics across HCC-CMS, HHS/ACA, CBPS, ACO REACH and MSSP, plus HEDIS and SDOH), InNote (an overlay on Epic, Cerner, Athena, ECW and NextGen surfacing coding and quality gaps at the point of care, bi-directional with major EHRs, with AI-assisted documentation), and Care Management (work queues, pod assignments, assessments, and tracking of CMS-billable care management time).
- *Revenue cycle and access*: Flow Auth (prior authorisation from intake through appeal drafting), Flow (coding, documentation and denial management), Comet (patient access — inbound calls, scheduling, referrals, triage).
- *Payer*: Galaxy (risk adjustment, HEDIS and utilisation across Medicare Advantage, Medicaid and commercial) and Cured (outreach CRM, acquired 2024, linking engagement activity to care gaps).
- *Care delivery, acquired*: Story Health (virtual cardiology, acquired September 2025 — a shift from software into direct care delivery) and InConnect (patient-facing app for virtual visits, messaging and remote devices).`;

const TALK_TRACK_SUMMARY = `An internal talk track for responding to Innovaccer in a deal, not a competitor profile.

Its position: Innovaccer today is back-office focused — population-level analytics and data warehousing. It has a point-of-care product, which the notes characterise as having no AI, not being clinically oriented, and seeing low usage with mostly detractors. The notes state this is why Navina has succeeded in selling its full suite on top of Innovaccer while Innovaccer serves as the provider's data-aggregating backend, and that Navina runs side by side with Innovaccer at a number of accounts.

It expects the overlap to grow: Innovaccer's marketing points to a provider copilot strategy while Navina expands its own population health capabilities, so the notes anticipate the two becoming more directly competitive over time.

Its strategic argument is that value-based success requires clinician trust and adoption, and that starting at the point of care and moving back into the back office is what keeps Navina positioned as the clinician-favoured copilot.

**Competitor module pricing recorded in these notes** (per member per month): dashboards 10–12c, care coordination 10–12c, InNote 16c, texting/InConnect 8–10c, aggregate reporting 10–12c, cloud costs 7–10c rising with module count (7c for two modules, 8c for three). Charging is on attributed lives under contract rather than usage — the notes observe Innovaccer will charge on covered lives whether or not an opportunity is ever surfaced.

The document is a working draft: it contains several paragraphs about Nuance and an unrelated introduction that belong to a different conversation, and repeats its core positioning sentence in three different draft states.`;

const DECK_SUMMARY = `A four-slide internal knowledge-base deck on Innovaccer, marked Confidential.

**Framing.** Innovaccer aggregates data from EMRs, claims, pharmacy and labs into a unified patient record, then builds modular applications on top across clinical, operational and financial workflows, sold to providers and payers, expanded through acquisition. Figures on the opening slide: 10% improvement in coding gap closure rate, 30 minutes a day saved per provider, 80M+ patient records.

**Product map**, grouped as the deck presents it: Gravity (data platform) and Agents of Care (AI automation) under Data and AI; Atlas (population health), InNote (EHR workflow layer) and Care Management under population health and clinical workflows; Flow (RCM and prior auth), Comet (access centre) and Cured (patient engagement CRM) under revenue cycle and access; Galaxy (payer platform) and Story Health (virtual cardiology) under payer and expansion.

**Strengths the deck credits them with:** fast data integration (400+ connectors, 80+ EHRs); proven at scale, with strong KLAS rankings and large health-system deployments; a modular platform with flexible PMPM pricing across organisation sizes; point-of-care impact on gap closure and provider time; and open data access, including direct SQL and Snowflake access.

**Weaknesses it identifies:** data integration is not turnkey, with additional cost and effort for full multi-source integration; limited EHR depth, with full bi-directional integration for only five systems; adoption depends on financial incentives rather than the product alone; no unified workflow, leaving risk, quality and care fragmented for providers; several key modules still in early rollout or pilot; and a broad offering that creates sales and implementation friction.`;

async function main(): Promise<void> {
  const competitor = await prisma.competitor.findFirst({
    where: { name: { contains: "Innovaccer", mode: "insensitive" } },
    include: { sources: true },
  });
  if (!competitor) throw new Error("Innovaccer not found");

  const sourceIdFor = (url: string | null): string | null => {
    if (!url) return null;
    const hit = competitor.sources.find((s) => s.url === url);
    return hit?.id ?? null;
  };

  const NOTION_LINK = "https://www.notion.so/navinaai/Innovaccer-33931faa1fb780b8bb99c5e2f0ad23f2";
  const DECK_LINK = "https://docs.google.com/presentation/d/1CwYVWAwDnn7KL9QS41PddmpQC5QI97rPZ5Cn1WkfboA/edit";
  const FOLDER_LINK = "https://drive.google.com/drive/folders/1an3CUSNqebu8MIR0UvuVaVhCtLW5f6G9";
  const SCREENSHOTS_LINK = "https://drive.google.com/drive/folders/1VlzSJOn5NESG8FE76F8ya-3k80Izh4TT";
  const SUMMARY_LINK = "https://drive.google.com/file/d/1geWKT_-JaPz38Xi9DvnF8spdrWedlzAt/view";

  const rows: Row[] = [
    {
      sourceUrl: NOTION_LINK,
      externalId: "33931faa1fb780b8bb99c5e2f0ad23f2",
      origin: "notion",
      title: "Innovaccer",
      url: NOTION_LINK,
      summary: PARENT_SUMMARY,
      sensitivity: "internal",
      sensitivityReason: "competitor pricing and contract terms gathered privately",
      status: "ok",
      truncated: true,
      note: "an embedded deck on the page could not be expanded",
      sourceUpdatedAt: "2026-08-27T11:29:01.960Z",
    },
    {
      sourceUrl: NOTION_LINK,
      externalId: "3c931faa1fb781099acdf4a2bb5ccd26",
      origin: "notion",
      title: "Innovaccer — Pop Health CI Dossier",
      url: "https://www.notion.so/3c931faa1fb781099acdf4a2bb5ccd26",
      summary: DOSSIER_SUMMARY,
      sensitivity: "internal",
      sensitivityReason: "Navina's own price book, competitor pricing estimates, and named internal sources",
      status: "ok",
      sourceUpdatedAt: "2026-09-08T18:45:00.253Z",
    },
    {
      sourceUrl: DECK_LINK,
      externalId: "1CwYVWAwDnn7KL9QS41PddmpQC5QI97rPZ5Cn1WkfboA",
      origin: "drive",
      title: "Innovaccer - company overview (Main deck)",
      url: DECK_LINK,
      mimeType: "application/vnd.google-apps.presentation",
      summary: DECK_SUMMARY,
      sensitivity: "internal",
      sensitivityReason: "marked Confidential; Navina's own competitive assessment",
      status: "ok",
      sourceUpdatedAt: "2026-05-17T11:58:47.127Z",
    },
    {
      sourceUrl: FOLDER_LINK,
      externalId: "1HJ4bcJqjYcQ2V1h_pPAr8mqourn12b8AmGv8nCWNGD0",
      origin: "drive",
      title: "GS - innocvacer",
      url: "https://docs.google.com/document/d/1HJ4bcJqjYcQ2V1h_pPAr8mqourn12b8AmGv8nCWNGD0/edit",
      mimeType: "application/vnd.google-apps.document",
      summary: TALK_TRACK_SUMMARY,
      sensitivity: "internal",
      sensitivityReason: "Navina sales talk track, a named account, personnel notes, competitor PMPM pricing",
      status: "ok",
      sourceUpdatedAt: "2025-01-01T16:39:38.089Z",
    },
    // Misses, recorded so the coverage count is honest rather than flattering.
    {
      sourceUrl: SCREENSHOTS_LINK,
      externalId: "1VlzSJOn5NESG8FE76F8ya-3k80Izh4TT",
      origin: "drive",
      title: "Demo Screenshots - Innovaccer",
      url: SCREENSHOTS_LINK,
      status: "skipped",
      note: "images — the ask cannot quote them",
    },
    {
      sourceUrl: SUMMARY_LINK,
      externalId: "1geWKT_-JaPz38Xi9DvnF8spdrWedlzAt",
      origin: "drive",
      title: "Innovaccer Platform Evaluation for Aegis Healthcare.pdf",
      url: SUMMARY_LINK,
      mimeType: "application/pdf",
      status: "skipped",
      note: "held back — check whether this third-party evaluation is ours to store",
    },
    {
      sourceUrl: FOLDER_LINK,
      externalId: "1wqsr8Zeo1IQ6zA1G6clG6wFdMpefli8o",
      origin: "drive",
      title: "Innovaccer demo - 21.12",
      url: "https://drive.google.com/file/d/1wqsr8Zeo1IQ6zA1G6clG6wFdMpefli8o/view",
      status: "skipped",
      note: "a Drive shortcut; its target was not followed in this manual pass",
    },
  ];

  for (const r of rows) {
    const data = {
      sourceId: sourceIdFor(r.sourceUrl),
      origin: r.origin,
      title: r.title,
      url: r.url,
      mimeType: r.mimeType ?? null,
      text: r.text ?? null,
      summary: r.summary ?? null,
      sensitivity: r.sensitivity ?? null,
      sensitivityReason: r.sensitivityReason ?? null,
      status: r.status,
      note: r.note ?? null,
      truncated: r.truncated ?? false,
      sourceUpdatedAt: r.sourceUpdatedAt ? new Date(r.sourceUpdatedAt) : null,
      fetchedAt: new Date(),
      condenseVersion: r.summary ? VERSION : null,
    };

    await prisma.competitorDocument.upsert({
      where: { competitorId_externalId: { competitorId: competitor.id, externalId: r.externalId } },
      create: { competitorId: competitor.id, externalId: r.externalId, ...data },
      update: data,
    });
    console.log(`  [${r.status}] ${r.title}${data.sourceId ? "" : "  (no matching source link)"}`);
  }

  const stored = await prisma.competitorDocument.findMany({
    where: { competitorId: competitor.id },
    select: { status: true },
  });
  console.log(
    `\n${competitor.name}: ${stored.filter((s) => s.status === "ok").length} read, ` +
      `${stored.filter((s) => s.status === "skipped").length} skipped, ${stored.length} rows total.`,
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .then(() => process.exit(0));
