/**
 * One-off manual backfill of Innovaccer's claims.
 *
 * The hub still has no Notion or Google credentials and no working Anthropic
 * key, so lib/ingest/extract.ts has never run. These claims were read out of the
 * same four documents by hand, through this session's Notion and Drive
 * connectors, so the panel and the claims table can be judged against real
 * material instead of an empty state.
 *
 * Every row is attached to the CompetitorDocument it came from, so provenance
 * works. Nothing here is stamped with EXTRACT_VERSION, which means a real
 * ingestion run treats those documents as unread and replaces all of it — this
 * backfill removes itself rather than needing cleanup.
 *
 *   npx tsx --env-file=.env scripts/backfill-innovaccer-claims.ts
 */

import { prisma } from "@/lib/prisma";

interface Claim {
  /** externalId of the document this was read out of. */
  doc: string;
  oneLiner: string;
  content: string;
  topics: string[];
  productAreas?: string[];
  confidence: "VERIFIED" | "REPORTED" | "CLAIMED";
  sensitivity: "internal" | "external";
  sensitivityReason?: string;
}

const DOSSIER = "3c931faa1fb781099acdf4a2bb5ccd26";
const PAGE = "33931faa1fb780b8bb99c5e2f0ad23f2";
const DECK = "1CwYVWAwDnn7KL9QS41PddmpQC5QI97rPZ5Cn1WkfboA";
const TALK = "1HJ4bcJqjYcQ2V1h_pPAr8mqourn12b8AmGv8nCWNGD0";

const CLAIMS: Claim[] = [
  // ---- Packaging and pricing -------------------------------------------------
  {
    doc: PAGE,
    oneLiner: "Pricing is PMPM and modular — a \"Lego model\"",
    content:
      "Customers pay only for the modules they select. Innovaccer's own framing per the hub's Notion page.",
    topics: ["PRICING", "PACKAGING"],
    confidence: "REPORTED",
    sensitivity: "external",
  },
  {
    doc: PAGE,
    oneLiner: "The Gravity data layer is mandatory for every customer",
    content:
      "Described as a non-negotiable foundation: every other module sits on top of it, so no deal exists without it. This is the structural reason an Innovaccer footprint is hard to remove piecemeal.",
    topics: ["PACKAGING", "CAPABILITIES"],
    productAreas: ["ANALYTICS"],
    confidence: "REPORTED",
    sensitivity: "external",
  },
  {
    doc: PAGE,
    oneLiner: "Three-year contract minimum, with discounts for five to ten years",
    content: "No shorter term is offered. Longer commitments attract discounts.",
    topics: ["PRICING", "PACKAGING"],
    confidence: "REPORTED",
    sensitivity: "internal",
    sensitivityReason: "contract terms gathered privately, not published",
  },
  {
    doc: PAGE,
    oneLiner: "No published pricing; deals are quoted per organisation",
    content:
      "Enterprise deals are priced on covered lives, module mix and contract length. Nothing is listed publicly, so any figure the hub holds came from a deal or a conversation.",
    topics: ["PRICING"],
    confidence: "REPORTED",
    sensitivity: "external",
  },
  {
    doc: PAGE,
    oneLiner: "Performance or risk-based pricing is not standard",
    content:
      "Offered only where the client enforces consistent workflows across all provider groups — a condition few organisations can meet.",
    topics: ["PRICING"],
    confidence: "REPORTED",
    sensitivity: "external",
  },
  {
    doc: TALK,
    oneLiner: "Module rates recorded from a deal: InNote 16c, care coordination 10-12c PMPM",
    content:
      "Per member per month, as recorded in an internal talk track: dashboards 10-12c, care coordination 10-12c, InNote 16c, texting/InConnect 8-10c, aggregate reporting 10-12c, cloud costs 7-10c rising with module count (7c for two modules, 8c for three). Note these disagree with the dossier's SAM-derived estimates, which put InNote nearer $0.25 — different bases, and neither is verified.",
    topics: ["PRICING", "PACKAGING"],
    confidence: "REPORTED",
    sensitivity: "internal",
    sensitivityReason: "competitor pricing gathered privately from a deal",
  },
  {
    doc: TALK,
    oneLiner: "Charges on attributed lives under contract, not on usage",
    content:
      "Billing follows covered lives whether or not an opportunity is ever surfaced. Based on claims, with rosters loaded first.",
    topics: ["PRICING", "PACKAGING"],
    confidence: "REPORTED",
    sensitivity: "internal",
    sensitivityReason: "commercial detail gathered privately",
  },
  {
    doc: DOSSIER,
    oneLiner: "Full-stack estimate ~$1.06 PMPM, below Navina's bundle at $2.65",
    content:
      "Module estimates from a Navina SAM analysis (July 2026), derived from real pricing on a large deal about four years ago with a 40% uplift applied: InNote ~$0.25 PMPM, InCare ~$0.17 PMPM, full stack ~$1.06 PMPM. Against Navina's Care Management list price of $1.50 PMPM standalone and $2.65 for the Risk Enterprise plus Care Management bundle. The dossier states these figures must not be used in external-facing material without verification.",
    topics: ["PRICING", "VS_NAVINA"],
    productAreas: ["RISK_DX", "CARE_MANAGEMENT"],
    confidence: "REPORTED",
    sensitivity: "internal",
    sensitivityReason: "Navina's own price book alongside privately estimated competitor pricing",
  },
  {
    doc: DOSSIER,
    oneLiner: "Website claims outcome-based pricing — charging for work done, not access",
    content:
      "Taken from Innovaccer's Healthcare Autonomy Platform page. The dossier treats this as contradicting or supplementing the PMPM model and flags it as needing verification, suggesting it likely applies to Managed Programs or the Bootcamp entry motion rather than standard SaaS contracts.",
    topics: ["PRICING", "POSITIONING"],
    confidence: "CLAIMED",
    sensitivity: "external",
  },

  // ---- Capabilities and integrations ----------------------------------------
  {
    doc: PAGE,
    oneLiner: "Gravity unifies EHR, claims, labs, pharmacy and SDOH into one patient record",
    content:
      "400+ pre-built connectors across 80+ EHRs. The foundation every other module depends on.",
    topics: ["CAPABILITIES", "INTEGRATIONS"],
    productAreas: ["ANALYTICS", "POP_HEALTH"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: PAGE,
    oneLiner: "InNote surfaces coding and quality gaps at the point of care",
    content:
      "An overlay on Epic, Cerner, Athena, eCW and NextGen, bi-directional with the major ones, including AI-assisted documentation. This is the module that competes most directly with Navina's point-of-care layer.",
    topics: ["CAPABILITIES", "INTEGRATIONS", "VS_NAVINA"],
    productAreas: ["POINT_OF_CARE", "RISK_DX", "QUALITY"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: PAGE,
    oneLiner: "Atlas covers risk, quality and population analytics across major VBC models",
    content:
      "Supports HCC-CMS, HHS/ACA, CBPS, ACO REACH and MSSP, with HEDIS tracking, cohort building, SDOH and provider performance management.",
    topics: ["CAPABILITIES"],
    productAreas: ["POP_HEALTH", "QUALITY", "RISK_DX"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: PAGE,
    oneLiner: "Agents of Care automates prior auth, outreach and coding support",
    content:
      "AI agents for operational workflows, described as primarily assistive — humans stay in the loop for exceptions and clinical decisions.",
    topics: ["CAPABILITIES"],
    productAreas: ["AGENTIC"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: PAGE,
    oneLiner: "Care Management tracks CMS-billable care management time",
    content:
      "Work queues, pod assignments, assessments and patient tracking, with AI agents assisting scheduling and outreach.",
    topics: ["CAPABILITIES"],
    productAreas: ["CARE_MANAGEMENT"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: PAGE,
    oneLiner: "Galaxy covers payer-side risk, quality and utilisation",
    content:
      "Medicare Advantage, Medicaid and commercial populations, consolidating risk adjustment and HEDIS into one system.",
    topics: ["CAPABILITIES"],
    productAreas: ["PAYERS"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: DOSSIER,
    oneLiner: "Gravity took Best in KLAS 2026 at 93.2, but not for population health",
    content:
      "KLAS 2026 wins are #1 Data and Analytics Platform, #1 CRM and #1 Payer Data and Analytics Platform. The dossier flags that there is no dedicated KLAS Population Health Management badge on the Atlas page, and that the CRM wins belong to Comet rather than Atlas.",
    topics: ["CAPABILITIES", "POSITIONING", "WEAKNESSES"],
    productAreas: ["POP_HEALTH", "ANALYTICS"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },

  // ---- Weaknesses -----------------------------------------------------------
  {
    doc: DECK,
    oneLiner: "Full bi-directional EHR integration exists for only five systems",
    content:
      "Navina's own assessment: data integration is not turnkey, with additional cost and effort for full multi-source integration, and EHR depth limited to five systems bi-directionally.",
    topics: ["WEAKNESSES", "INTEGRATIONS"],
    productAreas: ["POINT_OF_CARE"],
    confidence: "REPORTED",
    sensitivity: "internal",
    sensitivityReason: "Navina's own competitive assessment, marked Confidential",
  },
  {
    doc: DECK,
    oneLiner: "Risk, quality and care remain fragmented for providers",
    content:
      "Listed as a weakness alongside several key modules still in early rollout or pilot, and a broad offering that creates sales and implementation friction.",
    topics: ["WEAKNESSES", "CAPABILITIES"],
    productAreas: ["POINT_OF_CARE", "QUALITY", "RISK_DX"],
    confidence: "REPORTED",
    sensitivity: "internal",
    sensitivityReason: "Navina's own competitive assessment, marked Confidential",
  },
  {
    doc: TALK,
    oneLiner: "Point-of-care product has low usage and mostly detractors",
    content:
      "The internal position: Innovaccer is back-office focused — population analytics and data warehousing — and its point-of-care product has no AI, is not clinically oriented, and sees low usage.",
    topics: ["WEAKNESSES", "VS_NAVINA"],
    productAreas: ["POINT_OF_CARE"],
    confidence: "REPORTED",
    sensitivity: "internal",
    sensitivityReason: "Navina sales positioning, not an observed fact",
  },
  {
    doc: DOSSIER,
    oneLiner: "First deployment cost $12M+ in data harmonisation on a small contract",
    content:
      "The CEO's own figure, given in an Out of Pocket interview (December 2025), on what he described as a relatively small contract. Each deployment gets easier as they learn the shape of different databases. The dossier reads the Coforge partnership as a response to this cost problem.",
    topics: ["WEAKNESSES", "DELIVERY"],
    confidence: "REPORTED",
    sensitivity: "external",
  },
  {
    doc: DOSSIER,
    oneLiner: "Only 51% of employees would recommend working there",
    content:
      "Glassdoor sentiment, which the dossier marks anecdotal: frequent layoffs creating job insecurity, internal politics, and heavy dependence on proprietary tooling.",
    topics: ["WEAKNESSES", "ORG_AND_PEOPLE"],
    confidence: "CLAIMED",
    sensitivity: "external",
  },

  // ---- Funding --------------------------------------------------------------
  {
    doc: DOSSIER,
    oneLiner: "Raised ~$675M over nine rounds, valued ~$3.45B",
    content:
      "Most recent is a $275M Series F in January 2025 at roughly $3.45B post-money on the primary, with the secondary component likely at a discount per TechCrunch. Series F investors include Kaiser Permanente, Banner Health, Danaher Ventures, B Capital and Generation Investment Management — Kaiser being both investor and named customer.",
    topics: ["FUNDING"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: DOSSIER,
    oneLiner: "Claims ~$252M ARR for 2025 and 115% net revenue retention",
    content:
      "Up from ~$130M in 2024, with 50% year-on-year growth claimed for five consecutive years and positive cash flow from Q4 2024. The dossier marks all of it CLAIMED — the revenue figures come from Getlatka, a self-reported aggregator, and the retention figure from Innovaccer's own website.",
    topics: ["FUNDING"],
    confidence: "CLAIMED",
    sensitivity: "external",
  },
  {
    doc: DOSSIER,
    oneLiner: "IPO target of $400-500M ARR, roughly two years out",
    content:
      "Per CEO Shashank. At the claimed 50% growth rate the dossier puts this about two years away, and draws the inference that an aggressive land-grab heading into an IPO window likely means discounting heavily to grow ARR.",
    topics: ["FUNDING", "STRATEGY"],
    confidence: "REPORTED",
    sensitivity: "external",
  },

  // ---- Org and people -------------------------------------------------------
  {
    doc: DOSSIER,
    oneLiner: "Three layoff rounds in four years, each larger than the last",
    content:
      "~90 (8%) in September 2022, ~245 (15%) in January 2023, and ~340 (15%, majority overseas) in May 2026. The last came five months after the $275M Series F and four months after a $75M ESOP buyback, and was justified as an \"AI-native\" transition. The dossier treats the framing shift as the signal: defensive in 2022, strategic refocus in 2023, offensive repositioning in 2026.",
    topics: ["ORG_AND_PEOPLE"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: DOSSIER,
    oneLiner: "All four co-founders still in senior roles after twelve years",
    content:
      "Abhinav Shashank (CEO), Kanav Hasija (CPO), Sandeep Gupta (COO/President) and Sachin Jaiswal. The dossier notes this is unusual founder stability for a company of this age. Headcount is roughly 1,200-1,500 after the May 2026 restructuring, with significant India-based engineering and delivery.",
    topics: ["ORG_AND_PEOPLE"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: DOSSIER,
    oneLiner: "No CRO or head of enterprise sales surfaced publicly",
    content:
      "Named as an open gap in the dossier. The clinical credibility anchor in enterprise sales is CMO David Nace (ex-McKesson, UnitedHealth, Aetna); Andy Burtis joined as marketing CMO from C3.ai and McKesson, which the dossier reads as an enterprise marketing push.",
    topics: ["ORG_AND_PEOPLE", "WEAKNESSES"],
    confidence: "REPORTED",
    sensitivity: "external",
  },

  // ---- Strategy and delivery ------------------------------------------------
  {
    doc: DOSSIER,
    oneLiner: "Five acquisitions in two years, erasing their own \"no acquisitions\" advantage",
    content:
      "Cured (2024, patient CRM), Pharmacy Quality Solutions (2024), Humbi AI (January 2025, actuarial and VBC contract modelling), Story Health (September 2025, AI specialty care, accepted into the CMS ACCESS model), CaduceusHealth (May 2026, ~$66M, RCM services with ~200 staff and ~4,000 providers). In the 2023 Kaiser PHMI RFP, evaluators cited \"most modern, cohesive architecture, no acquisitions\" as an Innovaccer advantage over Health Catalyst — the dossier argues that advantage is now gone and the same coherence question applies.",
    topics: ["STRATEGY", "CAPABILITIES"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: DOSSIER,
    oneLiner: "Implementation is shifting to Coforge, a third-party integrator",
    content:
      "January 2026: Coforge (India-based IT services, ~45,000 employees) named preferred platinum implementation partner for Gravity under a joint initiative called G-Forge, covering implementation, integration and managed services with forward-deployed engineers. The dossier flags the sequence — partnership January, ESOP buyback January, layoffs May — as Innovaccer systematically moving implementation headcount off its own books, and treats SI-led implementation as a displacement trigger if it shows up in KLAS or customer feedback.",
    topics: ["DELIVERY", "STRATEGY"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: DOSSIER,
    oneLiner: "Story Health acquisition moves them from software into care delivery",
    content:
      "Accepted into the CMS ACCESS model with a July 2026 launch, making Innovaccer a care delivery partner in VBC programmes rather than only a software vendor. Combined with CaduceusHealth's RCM services, the dossier's reading is that a buyer comparing Navina to Innovaccer increasingly compares a pure software company against one that will also staff and run operations.",
    topics: ["STRATEGY", "VS_NAVINA"],
    confidence: "VERIFIED",
    sensitivity: "external",
  },
  {
    doc: TALK,
    oneLiner: "Expected to become more directly competitive as both expand",
    content:
      "Innovaccer's marketing points to a provider copilot strategy while Navina expands its own population health capabilities, so the internal expectation is growing overlap over time.",
    topics: ["STRATEGY", "VS_NAVINA"],
    productAreas: ["POP_HEALTH", "POINT_OF_CARE"],
    confidence: "REPORTED",
    sensitivity: "internal",
    sensitivityReason: "Navina's own strategic read",
  },

  // ---- vs Navina ------------------------------------------------------------
  {
    doc: DOSSIER,
    oneLiner: "Navina competes in Innovaccer's strongest territory, not its weak spots",
    content:
      "The dossier's own conclusion: HCC capture, care gap closure and care management are all data-dependency workflows, which is where Innovaccer is strongest. Differentiation therefore has to come from clinical depth, data quality and workflow integration rather than from claiming a different category.",
    topics: ["VS_NAVINA", "STRATEGY"],
    productAreas: ["RISK_DX", "CARE_MANAGEMENT", "QUALITY"],
    confidence: "REPORTED",
    sensitivity: "internal",
    sensitivityReason: "Navina's own competitive strategy",
  },
  {
    doc: TALK,
    oneLiner: "Navina sells its full suite on top of Innovaccer at several accounts",
    content:
      "Deployed side by side with population health tools including Innovaccer, with Innovaccer serving as the provider's data-aggregating backend. The talk track names a client and notes several current Navina employees came from Innovaccer, including a VP.",
    topics: ["VS_NAVINA", "CUSTOMERS"],
    confidence: "REPORTED",
    sensitivity: "internal",
    sensitivityReason: "names a Navina client and personnel who moved between the companies",
  },

  // ---- Customers ------------------------------------------------------------
  {
    doc: DOSSIER,
    oneLiner: "Kaiser is both a Series F investor and a named customer",
    content:
      "The dossier treats the dual relationship as a significant alignment signal. Ascension is named by the CEO (MedCity, April 2026) as an active customer linking its contact centre to population health, and appears in Navina's own Gong data as an active opportunity mid-Innovaccer implementation — which products is listed as an open gap.",
    topics: ["CUSTOMERS"],
    confidence: "REPORTED",
    sensitivity: "internal",
    sensitivityReason: "cross-references Navina's own pipeline data",
  },
  {
    doc: DECK,
    oneLiner: "Marketing figures: 10% better gap closure, 30 minutes saved per provider per day",
    content:
      "Alongside 80M+ patient records. These are Innovaccer's own headline numbers as reproduced in the internal knowledge-base deck.",
    topics: ["POSITIONING", "CAPABILITIES"],
    productAreas: ["POINT_OF_CARE", "QUALITY"],
    confidence: "CLAIMED",
    sensitivity: "external",
  },
];

async function main(): Promise<void> {
  const competitor = await prisma.competitor.findFirst({
    where: { name: { contains: "Innovaccer", mode: "insensitive" } },
    include: { documents: { select: { id: true, externalId: true, sourceUpdatedAt: true } } },
  });
  if (!competitor) throw new Error("Innovaccer not found");

  const byExternalId = new Map(competitor.documents.map((d) => [d.externalId, d]));
  const missing = [...new Set(CLAIMS.map((c) => c.doc))].filter((d) => !byExternalId.has(d));
  if (missing.length) throw new Error(`no stored document for: ${missing.join(", ")}`);

  // Replaced wholesale, so re-running this is idempotent rather than additive.
  const removed = await prisma.competitorInsight.deleteMany({ where: { competitorId: competitor.id } });

  await prisma.competitorInsight.createMany({
    data: CLAIMS.map((c) => {
      const doc = byExternalId.get(c.doc)!;
      return {
        competitorId: competitor.id,
        documentId: doc.id,
        oneLiner: c.oneLiner,
        content: c.content,
        topics: c.topics,
        productAreas: c.productAreas ?? [],
        confidence: c.confidence,
        sensitivity: c.sensitivity,
        sensitivityReason: c.sensitivityReason ?? null,
        asOf: doc.sourceUpdatedAt,
      };
    }),
  });

  const stored = await prisma.competitorInsight.findMany({
    where: { competitorId: competitor.id },
    select: { topics: true, confidence: true, sensitivity: true },
  });

  const tally = (key: (r: (typeof stored)[number]) => string[]) => {
    const counts: Record<string, number> = {};
    for (const r of stored) for (const v of key(r)) counts[v] = (counts[v] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(" · ");
  };

  console.log(`replaced ${removed.count} → ${stored.length} claims for ${competitor.name}\n`);
  console.log("by topic:      ", tally((r) => r.topics));
  console.log("by confidence: ", tally((r) => [r.confidence]));
  console.log("by sensitivity:", tally((r) => [r.sensitivity]));
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .then(() => process.exit(0));
