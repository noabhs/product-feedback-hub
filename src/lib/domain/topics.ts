import type { Topic } from "./types";
import { VBC_FUNDAMENTALS } from "./topic-vbc-fundamentals";
import { CARE_ORGANIZATIONS } from "./topic-care-organizations";
import { INSURANCE_MODELS } from "./topic-insurance-models";

/**
 * Written in full: VBC fundamentals, Care organizations, Insurance models,
 * Risk adjustment, and Quality + Star Ratings (the first three live in their own
 * files). The remaining topics carry a summary only and are marked "planned" so the
 * landing page shows the whole map without pretending the content exists.
 *
 * Facts that change every year (V28 phase-in, Star Ratings weights, RADV
 * rules) are dated in the text. Re-check them each fall when CMS publishes the
 * Rate Announcement and the Star Ratings.
 */
export const TOPICS: Topic[] = [
  VBC_FUNDAMENTALS,
  CARE_ORGANIZATIONS,
  INSURANCE_MODELS,
  {
    slug: "risk-adjustment",
    title: "Risk adjustment",
    tagline: "How a patient's documented health becomes a risk score, and a payment.",
    summary:
      "Health plans and risk-bearing groups are paid more for sicker patients and less for healthier ones. Risk adjustment is the system that measures how sick a population is, using the diagnoses documented in a year. The result is a risk score (RAF). Because the score comes from documentation, accurate and complete coding of a patient's conditions directly affects revenue.",
    status: "ready",
    concepts: [
      {
        title: "Why it exists",
        body: "Without it, a plan that enrolls sick patients would lose money and a plan that enrolls healthy ones would profit. Risk adjustment pays for expected cost, so plans compete on care and efficiency rather than on avoiding sick people.",
      },
      {
        title: "Diagnoses become HCCs",
        body: "Each year, the diagnoses documented in visits are mapped from ICD-10 codes to Hierarchical Condition Categories (HCCs). Related conditions are grouped, and within a family only the most severe HCC counts.",
      },
      {
        title: "HCCs add up to a RAF score",
        body: "A patient's Risk Adjustment Factor (RAF) combines a demographic factor (age, sex, Medicaid status) with the weights of their HCCs. A score of 1.0 means expected cost equal to the average beneficiary. 1.5 means expected cost 50% higher.",
      },
      {
        title: "Last year's diagnoses pay this year",
        body: "The model is prospective: conditions documented in calendar year N set the score that drives payment in year N+1. A chronic condition not documented again in a new year drops out of the score, which is why recapture matters.",
      },
      {
        title: "Documentation must hold up",
        body: "A diagnosis only counts if it comes from an acceptable face-to-face (or qualifying audio-video telehealth) encounter with an acceptable provider type, and is supported in the record. CMS audits this through RADV.",
      },
      {
        title: "The model keeps changing",
        body: "CMS updated the model from V24 to V28 and phased it in over three years, ending in 2026. V28 counts fewer diagnosis codes toward payment and re-weights others, which lowered scores for many organizations.",
      },
    ],
    deepDive: [
      {
        heading: "From a visit to a payment",
        body: `1. A clinician sees a patient and documents their conditions in the chart.
2. The practice (or a coder) submits claims with ICD-10 diagnosis codes. Medicare Advantage plans also submit encounter data to CMS.
3. CMS maps the codes to HCCs for that **diagnosis year**.
4. CMS calculates each beneficiary's risk score and uses it to set the plan's payment for the following **payment year**.
5. For an MA plan, the monthly payment for a member is based on a county benchmark, adjusted by the member's risk score. For an ACO in a CMS program, a similar risk score adjusts the spending benchmark the ACO is measured against.

This is why the same patient can be worth very different amounts to a payer depending on whether their chronic conditions were captured accurately.`,
      },
      {
        heading: "The models: CMS-HCC, RxHCC, HHS-HCC",
        body: `Different programs use different models:

- **CMS-HCC** is the main model for Medicare Advantage and many CMS ACO programs. It predicts Part A and B spending.
- **RxHCC** predicts Part D (drug) spending.
- **HHS-HCC** is used for ACA marketplace plans.

**V24 to V28.** CMS introduced the 2024 CMS-HCC model (V28) and phased it in: 2024 payments used a blend of 33% V28 and 67% V24, 2025 used 67% V28 and 33% V24, and 2026 uses V28 only. V28 is built on a newer ICD-10 mapping. It splits conditions into more, more specific HCCs (115 payment HCCs vs. 86 in V24) but counts far fewer diagnosis codes toward payment, and for many conditions the weights are lower. Source: CMS CY 2026 Rate Announcement.`,
      },
      {
        heading: "Recapture vs. suspecting",
        body: `Two different jobs, often mixed up:

- **Recapture** means a condition coded in a prior year that must be documented again this calendar year to stay in the score. It protects the existing baseline.
- **Suspecting** means finding a condition the chart supports but that has never been formally coded. It adds new score.

Both are done before or during the visit (prospective) or by reviewing charts after the visit (retrospective). Prospective work is preferred because the clinician can examine and document the condition at the point of care.`,
      },
      {
        heading: "What makes documentation audit-proof",
        body: `CMS requires that a coded diagnosis be supported by the medical record. The industry commonly uses **MEAT** (Monitor, Evaluate, Assess, Treat) as a checklist: the note should show the clinician did at least one of these for the condition. MEAT is an industry convention, not an official CMS term, so check a plan's own audit guidance too.

A diagnosis also generally needs to come from a face-to-face encounter (or audio-video telehealth) with an acceptable provider type. A problem list entry alone, or a diagnosis only seen on a lab or radiology report, is not enough.`,
      },
      {
        heading: "RADV audits",
        body: `**Risk Adjustment Data Validation (RADV)** is how CMS checks that the diagnoses behind payments are supported by medical records. In 2025 CMS announced it would audit all eligible Medicare Advantage contracts every year, a large increase over the earlier sample of plans, and would hire thousands more coders to do so.

Extrapolation, which projects the error rate found in a sample across a whole contract, is the high-stakes part. A federal court vacated the extrapolation provisions of the 2023 RADV rule in September 2025, and the government appealed. **Check the current status before relying on this.** Either way, plans push audit risk down to providers through documentation requirements and chart requests.`,
      },
      {
        heading: "Why the economics are under pressure",
        body: `Three forces compress the value of risk adjustment for providers and plans:

- **V28** removed or down-weighted many conditions.
- **Coding intensity adjustment.** CMS reduces MA payments by a statutory minimum of 5.9% to account for coding patterns in MA being more intensive than in Original Medicare.
- **Audit risk.** RADV expansion raises the cost of coding aggressively.

The practical effect is a shift toward accurate, evidence-backed documentation over volume, and toward pairing risk adjustment with quality and cost management.`,
      },
    ],
    resources: [
      {
        title: "Risk Glossary: Terms & Acronyms",
        url: "https://app.notion.com/p/3c031faa1fb781c39d4fe98cf229dcd6",
        kind: "internal",
        source: "Notion · Product / Risk",
        note: "How these terms show up in Navina's Risk product and training modules.",
      },
      {
        title: "2026 Medicare Advantage and Part D Rate Announcement",
        url: "https://www.cms.gov/newsroom/fact-sheets/2026-medicare-advantage-part-d-rate-announcement",
        kind: "external",
        source: "CMS",
        note: "The official source for the V28 phase-in and annual payment changes.",
      },
      {
        title: "CY 2026 Risk Adjustment Implementation memo",
        url: "https://www.cms.gov/files/document/cy-2026-risk-adjustment-implementation-memo-g.pdf",
        kind: "external",
        source: "CMS",
        note: "Technical detail on how 2026 risk scores are calculated.",
      },
      {
        title: "Report to Congress: Risk Adjustment in Medicare Advantage (Dec 2024)",
        url: "https://www.cms.gov/files/document/report-congress-risk-adjustment-medicare-advantage-december-2024.pdf",
        kind: "external",
        source: "CMS",
        note: "The long, careful explanation of how the system works and where it is criticized.",
      },
      {
        title: "CMS Rolls Out Aggressive Strategy to Enhance and Accelerate Medicare Advantage Audits",
        url: "https://www.cms.gov/newsroom/press-releases/cms-rolls-out-aggressive-strategy-enhance-accelerate-medicare-advantage-audits",
        kind: "external",
        source: "CMS",
        note: "The 2025 announcement that expanded RADV to all eligible contracts.",
      },
    ],
    related: ["quality-and-stars", "insurance-models", "clinic-roles"],
  },
  {
    slug: "quality-and-stars",
    title: "Quality, care gaps and Star Ratings",
    tagline: "How care quality is measured, closed out, and turned into plan ratings and bonuses.",
    summary:
      "Quality measures check whether patients got recommended care: screenings, vaccines, and control of conditions like diabetes and blood pressure. Each open item for a patient is a care gap. Closing gaps improves outcomes and, for Medicare Advantage, improves the plan's 1 to 5 Star Rating, which decides bonus payments and how attractive the plan is to members.",
    status: "ready",
    concepts: [
      {
        title: "Measures and care gaps",
        body: "A quality measure defines who should get a service (the denominator) and who did (the numerator). When a patient in the denominator has not met the numerator yet, that is a care gap. Closing it means getting the service done and documented.",
      },
      {
        title: "HEDIS",
        body: "HEDIS (Healthcare Effectiveness Data and Information Set) is the standard measure set maintained by NCQA. Health plans report it each year, and many Star Ratings measures are HEDIS measures.",
      },
      {
        title: "Measurement year and lookback",
        body: "Measures are scored over a calendar year (the measurement year) and reported after it ends. Most look back over a defined window, for example a mammogram within the last 27 months. Evidence can come from claims, the EHR, or patient records.",
      },
      {
        title: "Exclusions",
        body: "Some patients are legitimately removed from a measure, for example people in hospice or those who had a relevant surgery. Missing an exclusion makes a practice look worse than it is, so documenting exclusions matters as much as closing gaps.",
      },
      {
        title: "Star Ratings",
        body: "CMS rates every Medicare Advantage and Part D contract from 1 to 5 stars each year, based on dozens of measures across clinical quality, member experience, and plan operations.",
      },
      {
        title: "Why stars pay",
        body: "Contracts rated 4 stars or higher receive a quality bonus payment, and the rating also raises the share of savings the plan keeps as rebate. Plans therefore pass quality targets down to the practices they contract with.",
      },
    ],
    deepDive: [
      {
        heading: "Quality programs at a glance",
        body: `Several programs measure quality, for different audiences:

- **HEDIS** (NCQA) measures health plans, using data from providers. It drives plan accreditation and, for Medicare Advantage, much of the Star Ratings.
- **Star Ratings** (CMS) rate Medicare Advantage and Part D contracts. They drive quality bonus payments, plan rebates, marketing and enrollment.
- **MIPS** (CMS) scores individual clinicians and groups billing Medicare Part B on quality, cost, improvement activities and interoperability. It sets payment adjustments on Part B payments.
- **ACO quality measures** (CMS) apply to ACOs in MSSP, REACH and similar programs. They decide the share of savings an ACO keeps.
- **Payer contract measures** apply to a specific practice or group under its own contract, and drive bonuses and withholds.

The same clinical action (for example a colonoscopy) can count in several of these at once, which is why closing and documenting a gap pays off more than once.`,
      },
      {
        heading: "Life of a care gap",
        body: `1. The payer or plan identifies patients missing a service, usually from claims, and sends a **care gap file** to the practice.
2. The practice finds each gap in its own records. Many are already closed in the chart but the payer never saw a claim.
3. The care team schedules the service, or finds proof it was done elsewhere (an outside lab, a specialist letter, a prior record).
4. The result is documented so it can be submitted: by claim with the right codes (including CPT II codes that report results such as blood pressure), by supplemental data, or by records reviewed for HEDIS.
5. The payer marks the gap compliant. Gaps the plan has closed are different from gaps the practice closed internally until the plan confirms.

Most real-world pain is in steps 2 and 4: evidence that exists but is not where the plan can see it.`,
      },
      {
        heading: "Common measure families",
        body: `- **Cancer screening:** breast, colorectal, cervical.
- **Chronic condition control:** blood pressure control, diabetes glycemic status (HbA1c), kidney health evaluation, eye exam for diabetes.
- **Medication:** statin therapy for cardiovascular disease and diabetes; medication adherence for diabetes, hypertension and cholesterol drugs (Part D).
- **Preventive and wellness:** annual wellness visit, adult immunizations, falls risk assessment, depression screening.
- **Care transitions:** follow-up after emergency visits and hospital discharge, plan all-cause readmissions.
- **Member experience:** CAHPS survey results and health outcomes survey results.

Every measure has an age range, a time window, qualifying services, and exclusions, set by its steward (NCQA, CMS or others). Read the measure specification before trusting a rule of thumb.`,
      },
      {
        heading: "How Star Ratings are built",
        body: `Each contract receives a rating for Part C (medical), Part D (drug) and, for combined plans, an overall rating, in half-star steps from 1 to 5. CMS publishes the ratings each fall for use in the following plan year.

Measures are grouped by type and given a weight. For the 2027 Star Ratings, CMS lists these weights: **process** measures 1, **outcome and intermediate outcome** measures 3, **patient experience and access** measures 2, and **improvement** measures 5. The weight sets how much one measure moves the overall number, so a single outcome measure matters three times as much as a process measure.

Contract performance is turned into 1 to 5 stars using **cut points**, which are set each year from how all contracts performed. That makes the bar for a given star level move from year to year.

CMS changes this system often (measures are added, removed or re-weighted, and the rules for adjustments change). Always check the current year's *Measures and Weights* document.`,
      },
      {
        heading: "What a star is worth",
        body: `Under the Medicare Advantage quality bonus program:

- Contracts with **4 stars or more** get their benchmark raised, by 5 percentage points in most counties and 10 in certain "double bonus" counties.
- The **rebate share** (the part of the gap between the benchmark and the plan's bid that is returned as extra benefits) is higher for better-rated contracts: 70% at 4.5 stars or more, 65% from 3.5 to under 4.5, and 50% below that.
- Bonus payments are large. KFF estimated more than $13 billion in 2026.

Plans therefore treat the 4-star line as a financial cliff, and contracted practices often receive their own bonus or are held to gap-closure targets tied to it.`,
      },
      {
        heading: "Quality and risk adjustment together",
        body: `The same visit often serves both. A wellness visit can close several care gaps, and it is also where chronic conditions get examined and documented for risk adjustment. Teams that plan one visit for both tend to close more gaps and capture conditions more accurately than teams running them as separate programs.`,
      },
    ],
    resources: [
      {
        title: "Intro to Quality (new-hire training)",
        url: "https://app.notion.com/p/3e231faa1fb78158a15be9a4ef602930",
        kind: "internal",
        source: "Notion · Delivery / Training",
        note: "Short internal introduction to HEDIS and Star Ratings.",
      },
      {
        title: "Quality glossary and logic documentation",
        url: "https://docs.google.com/document/d/1anuoz4PUejMRamPI-JxpYaAHexc3psrW7-ggaFAcqiw/edit",
        kind: "internal",
        source: "Google Drive",
        note: "How Navina interprets each supported measure, including exclusions and care gap statuses.",
      },
      {
        title: "2027 Star Ratings Measures and Weights",
        url: "https://www.cms.gov/files/document/2027-star-ratings-measures.pdf",
        kind: "external",
        source: "CMS",
        note: "The list of measures and the weight of each. Check each year.",
      },
      {
        title: "Part C and D Performance Data",
        url: "https://www.cms.gov/medicare/health-drug-plans/part-c-d-performance-data",
        kind: "external",
        source: "CMS",
        note: "Star Ratings data files, technical notes and fact sheets.",
      },
      {
        title: "Contract Year 2027 Medicare Advantage and Part D Final Rule",
        url: "https://www.cms.gov/newsroom/fact-sheets/contract-year-2027-medicare-advantage-part-d-final-rule",
        kind: "external",
        source: "CMS",
        note: "The latest changes to Star Ratings measures.",
      },
      {
        title: "Medicare Will Spend More Than $13 Billion on the Medicare Advantage Quality Bonus Program in 2026",
        url: "https://www.kff.org/medicare/medicare-will-spend-more-than-13-billion-on-the-medicare-advantage-quality-bonus-program-in-2026/",
        kind: "external",
        source: "KFF",
        note: "A clear explanation of what stars are worth in dollars.",
      },
      {
        title: "Redesigning the Medicare Advantage quality bonus program",
        url: "https://www.medpac.gov/wp-content/uploads/import_data/scrape_files/docs/default-source/reports/jun19_ch8_medpac_reporttocongress_sec.pdf",
        kind: "external",
        source: "MedPAC",
        note: "Detailed mechanics of benchmark bonuses and rebates, and the critique of them.",
      },
    ],
    related: ["risk-adjustment", "utilization-and-cost", "clinic-roles"],
  },
  {
    slug: "utilization-and-cost",
    title: "Utilization and cost",
    tagline: "Admissions, ED visits, readmissions and total cost of care.",
    summary:
      "In value-based contracts the cost of all care a patient receives counts against the group, wherever it happens. This topic covers utilization measures, total cost of care, avoidable use and the data that shows it (claims and ADT feeds).",
    status: "planned",
    concepts: [],
    deepDive: [],
    resources: [],
    related: ["vbc-fundamentals", "data-and-interoperability"],
  },
  {
    slug: "cms-and-regulation",
    title: "CMS and regulation",
    tagline: "The agencies, the annual rule cycle and the rules that change the economics.",
    summary:
      "CMS runs Medicare and sets most of the rules in this industry. This topic covers CMS and its Innovation Center, the yearly Advance Notice and Rate Announcement, and the interoperability and prior authorization rules.",
    status: "planned",
    concepts: [],
    deepDive: [],
    resources: [],
    related: ["insurance-models", "risk-adjustment", "data-and-interoperability"],
  },
  {
    slug: "clinic-roles",
    title: "Clinic roles and workflows",
    tagline: "Who does what in a primary care practice, and how a visit flows.",
    summary:
      "From the medical assistant who rooms the patient to the coder who reviews the chart and the care manager who calls after discharge, each role touches quality and risk adjustment differently. This topic maps the roles and the patient journey.",
    status: "planned",
    concepts: [],
    deepDive: [],
    resources: [],
    related: ["risk-adjustment", "quality-and-stars"],
  },
  {
    slug: "data-and-interoperability",
    title: "Data and interoperability",
    tagline: "EHRs, claims, identifiers and the standards that move data between them.",
    summary:
      "Healthcare data is spread across EHRs, payers, labs and hospitals. This topic covers the main data sources, the identifiers that link them (MBI, NPI, TIN), and the standards (FHIR, HL7, CCLF, BCDA).",
    status: "planned",
    concepts: [],
    deepDive: [],
    resources: [],
    related: ["utilization-and-cost", "cms-and-regulation"],
  },
];

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}
