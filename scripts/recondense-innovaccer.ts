/**
 * Runs the real condense step over Innovaccer's documents.
 *
 * One-off, and the point is narrow: lib/ingest/condense.ts has never executed.
 * This feeds it the actual document text and overwrites the hand-written
 * summaries from backfill-innovaccer.ts, so the summaries on screen become the
 * pipeline's own output rather than an impression of it. Rows come out stamped
 * with the pipeline's CONDENSE_VERSION, so a later full run leaves them alone.
 *
 * The text is supplied here rather than fetched: the hub still has no Notion or
 * Google credentials. It's the same text those readers would produce — the
 * dossier from the cleaned capture on disk, the rest transcribed as the walkers
 * would emit them.
 *
 *   npx tsx --env-file=.env.local --env-file=.env scripts/recondense-innovaccer.ts
 */

import { readFileSync } from "fs";
import { prisma } from "@/lib/prisma";
import { condense, CONDENSE_VERSION } from "@/lib/ingest/condense";

const DOSSIER_PATH =
  "/private/tmp/claude-502/-Users-noa-bhs/f3a22bc3-31fd-4105-81cc-000528868787/scratchpad/dossier.txt";

const PARENT_PAGE = `[child page: Innovaccer — Pop Health CI Dossier]

# Google drive
**Main folder**
https://drive.google.com/drive/folders/1an3CUSNqebu8MIR0UvuVaVhCtLW5f6G9
**Main deck**
[image omitted]

## What is Innovaccer?
Innovaccer is a healthcare platform that aggregates data from EMRs, claims, pharmacy, labs, and other sources into a unified patient record. It builds modular applications on top of this data, including population health, point of care workflows, care management, CRM, and revenue cycle tools used by providers and payers. The company has expanded through acquisitions and positions itself as a broad end to end platform across clinical, operational, and financial workflows.

## Pricing & Packaging
- **Model:** PMPM-based, modular ("Lego model") — pay only for modules selected
- **Base layer (Gravity/data) is mandatory** for all customers — non-negotiable foundation
- **Contract minimum: 3 years** — discounts available for 5–10 year commitments
- **Performance/risk-based pricing:** not standard — offered only where client enforces consistent workflows across all provider groups
- **No published pricing** — enterprise deals quoted per organization, based on covered lives, module mix, and contract length

## Key products & capabilities
1. **Data & AI**
- **Data platform (Gravity — Core)** Integrates EHR, claims, labs, pharmacy, and SDOH into a single longitudinal patient record. 400+ pre-built connectors, 80+ EHRs. Foundation for all analytics and workflows — required for all other modules.
- **AI automation layer (Agents of Care)** AI agents that automate operational workflows: prior auth, patient outreach, coding support, referral management. Primarily assistive — humans remain in the loop for exceptions and clinical decisions.
2. **Population health & care management**
- **Population health platform (Atlas)** Core application for risk, quality, and population analytics. Supports HCC-CMS, HHS/ACA, CBPS, ACO REACH, MSSP models. Covers HEDIS tracking, cohort building, SDOH, and provider performance management.
- **EHR-integrated workflow layer (InNote)** Overlay on top of EHRs (Epic, Cerner, Athena, ECW, NextGen). Surfaces coding gaps, quality gaps, and care tasks at point of care. Bi-directional with major EHRs. Includes AI-assisted documentation.
- **Care team workflow system (Care Management)** Task management for care teams: work queues, pod assignments, assessments, and patient tracking over time. AI agents assist with scheduling and outreach. Tracks CMS-billable care management time.
3. **Revenue cycle & Access**
- **Prior authorization automation (Flow Auth)** Automates the PA workflow: intake, eligibility check, submission, status tracking, appeal drafting. Reduces manual processing steps; integrates with major EHRs and payer portals.
- **Revenue cycle platform (Flow)** Supports medical coding, clinical documentation, and denial management workflows. Focused on reducing manual RCM work and improving first-pass claim acceptance.
- **Access center platform (Comet)** Manages patient access workflows: inbound calls, scheduling, referrals, and triage routing. Automates intake and reduces manual coordination across care teams.
4. **Payer**
- **Payer analytics platform (Galaxy)** Supports payer workflows for risk adjustment, quality management (HEDIS), and utilization across Medicare Advantage, Medicaid, and commercial populations. Consolidates risk and quality into one system.
- **Patient engagement platform (Cured — CRM)** CRM for outreach campaigns and patient communication (acquired 2024). Links engagement activity to care gaps and outcomes. Used by call center staff to surface relevant gaps during live patient interactions.
5. **Care delivery acquired**
- **Specialty care extension (Story Health)** Virtual care layer focused on cardiology (acquired Sep 2025). Extends Innovaccer from a software platform into direct care delivery — a strategic shift beyond analytics and workflow tools.
- **Patient-facing app (InConnect)** Patient interface for virtual visits, messaging with care teams, appointment tracking, and remote health device integration. Part of the telemedicine layer alongside InNote.

## Demo screenshots
[image omitted]
[image omitted]
[image omitted]
[image omitted]
[image omitted]
[image omitted]
[image omitted]
[image omitted]
[image omitted]`;

const TALK_TRACK = `We are well aware of Innovaccer - an established population health tool in the market.

Navina is implemented side-by-side with population health tools, including Innovaccer, across a number of our accounts (e.g., Upperline). We also have multiple current employees that worked at Innovaccer prior to Navina (including our VP Customer Success).

**In short -**
**Innovaccer today is backoffice-focused, delivering population-level analytics and data warehouse capabilities. They have a basic point of care solution that doesn't compare to Navina (no AI, not clinically oriented, low usage) which is the reason that we have been successful at selling our entire suite on top of Innovaccer while they serve as providers' data aggregating backend.**

**Based on their marketing, they do have a provider copilot strategy and as you know Navina is expanding our pop health capabilities so we expect the overlap to grow and our two companies to become more directly competitive over time.**

**The only way to achieve value-based success with timely clinical and economic intervention is with clinician trust and adoption, and we believe that starting from the point of care and moving into the back office and our clinically informed AI will help us maintain our position as value based leaders and the clinician favorite copilot.**

Attached is a direct comparison between our point of care risk adjustment solution and "Innote", Innovacer's point of care tool - FYI.

—

The only way to achieve value-based success is with clinician trust and adoption, and customers increasingly demand that their technology partners deliver exceptional user experience, and in the value-based care space this is demonstrated with a seamless integration of clinical and value-based workflows.

exceptional
user experience and seamless workflows that integrate the clinical and value-based care workflows.

\\---

Thanks for sharing this information. Venkat's strategic experiance with clinical intelligence, revenue cycle and ambient technology from both the provider and tech side of the house is indeed highly relevant to our product strategy. Looking forward to connecting with him.

We are very familiar with Nuance's healthcare solutions, having engaged with them in the market and working alongside them with our solutions with our customers. Currently, we are developing and expanding our offerings by incorporating an ambient listener into , enhancing the co-pilot experience for physicians.

As we develop our ambient listener, we have also initiated discussions about collaborating with existing ambient solutions. I would love to meet with him to learn about his insights on the ambient solutions market and to get acquainted.

I'm looking forward to connecting with him!

In short -

Innovace's focus is population level (back office) analytics and data warehouse. While they do have a point of care solution, it has low usage and mostly detractors.

  - Mostly data warehouse/analytics - bad point of care
  - Robust suite of functionality but not widely in use

  - dashboards: 10-12c PMPM
  - Care coordination; 10-12c PMPM
  - Innoate: 16c PMPM
  - Texting/inconnect: 8-10c
  - Generating aggregate report: 10-12c
  - Cloud costs: 7-10c (increases per modules - 7c for 2modules, 8c for 3.
  - 0.3-0.6c PMPM
  - Attributed lives on a contract - don't care if opp is never surfaced, they will charge based on attributed lives (covered lives, not usage)
  - 100k lives under risk
  - 0.6c PMPM
  - Doing this based on claims, rosters are loaded first`;

const DECK = `-----
Innovaccer Internal knowledge base

-----
Innovaccer is a healthcare platform that aggregates data from EMRs, claims, pharmacy, labs, and other sources into a unified patient record. It builds modular applications on top of this data, including population health, point of care workflows, care management, CRM, and revenue cycle tools used by providers and payers. The company has expanded through acquisitions and positions itself as a broad end to end platform across clinical, operational, and financial workflows.

10% improvement in coding gap closure rate
Saves 30 Min a day saved per provider
80M+ Patient records
Confidential

-----
Innovaccer product overview
Confidential
Gravity — Data platform. Unifies EHR, claims, labs, pharmacy, and SDOH into a longitudinal patient record.
Agents of Care — AI automation layer. Automates workflows such as prior auth, outreach, and coding support with human oversight.
Data & AI
Atlas — Population health platform. Supports risk, quality, and population analytics across CMS, Medicaid, and ACO models with HEDIS tracking and cohorting.
InNote — EHR workflow layer. Embedded in major EHRs to surface risk, quality, and care gaps at point of care with bi-directional workflows.
Care team workflows
Care Management — Manages work queues, patient tracking, and outreach with support for pod-based workflows.
Pop health & clinical workflows
Flow — RCM & prior authorization. Supports coding, documentation, denial management, and prior auth workflows to reduce manual work.
Comet — Access center platform. Manages scheduling, referrals, and inbound patient interactions across care teams.
Cured — Patient engagement CRM. Coordinates outreach and call center workflows linked to care gaps and outcomes.
Revenue cycle & access
Galaxy — Payer platform. Supports payer-side risk, quality, and utilization workflows across MA, Medicaid, and commercial populations.
Story Health — Care delivery layer. Virtual cardiology care platform extending Innovaccer into direct care delivery.
Payer & expansion

-----
Innovaccer - strengths and weaknesses
Confidential
Strengths
Fast data integration | 400+ connectors, works across 80+ EHRs
Proven at scale | Strong KLAS rankings and large health system deployments
Modular platform | Flexible PMPM pricing across org sizes and use cases
Point-of-care impact | Improves gap closure and saves provider time
Open data access | Transparent data model with direct SQL and Snowflake access
Weaknesses
Data integration not turnkey | Additional cost and effort for full multi-source integration
Limited EHR depth | Full bi-directional integration only for 5 systems
Adoption not guaranteed | Depends on financial incentives, not product alone
No unified workflow | Risk, quality, and care still fragmented for providers
Immature products | Several key modules still in early rollout or pilot
Complex platform | Broad offering creates sales and implementation friction

-----`;

const TARGETS: { externalId: string; title: string; text: string }[] = [
  { externalId: "33931faa1fb780b8bb99c5e2f0ad23f2", title: "Innovaccer", text: PARENT_PAGE },
  {
    externalId: "3c931faa1fb781099acdf4a2bb5ccd26",
    title: "Innovaccer — Pop Health CI Dossier",
    text: readFileSync(DOSSIER_PATH, "utf8"),
  },
  {
    externalId: "1CwYVWAwDnn7KL9QS41PddmpQC5QI97rPZ5Cn1WkfboA",
    title: "Innovaccer - company overview (Main deck)",
    text: DECK,
  },
  { externalId: "1HJ4bcJqjYcQ2V1h_pPAr8mqourn12b8AmGv8nCWNGD0", title: "GS - innocvacer", text: TALK_TRACK },
];

async function main(): Promise<void> {
  const competitor = await prisma.competitor.findFirst({
    where: { name: { contains: "Innovaccer", mode: "insensitive" } },
  });
  if (!competitor) throw new Error("Innovaccer not found");

  for (const t of TARGETS) {
    process.stdout.write(`\n${t.title}  (${(t.text.length / 1000).toFixed(1)}k chars in)\n`);
    const started = Date.now();
    const out = await condense({ competitor: competitor.name, title: t.title, text: t.text });
    const seconds = ((Date.now() - started) / 1000).toFixed(0);

    await prisma.competitorDocument.update({
      where: { competitorId_externalId: { competitorId: competitor.id, externalId: t.externalId } },
      data: {
        text: t.text,
        summary: out.summary,
        sensitivity: out.sensitivity,
        sensitivityReason: out.sensitivityReason || null,
        status: out.empty ? "empty" : "ok",
        condenseVersion: CONDENSE_VERSION,
        fetchedAt: new Date(),
      },
    });

    console.log(
      `  -> ${(out.summary.length / 1000).toFixed(1)}k out · ${out.sensitivity}` +
        `${out.sensitivityReason ? ` (${out.sensitivityReason})` : ""} · ${seconds}s`,
    );
    console.log("  ----------------------------------------");
    console.log(
      out.summary
        .split("\n")
        .map((l) => "  " + l)
        .join("\n"),
    );
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .then(() => process.exit(0));
