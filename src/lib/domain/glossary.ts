import type { GlossaryTerm, Resource } from "./types";
import { GLOSSARY_PAYMENT_ORGS } from "./glossary-payment-orgs";
import { GLOSSARY_OPS_DATA } from "./glossary-ops-data";

/**
 * Pilot batch of definitions (Risk adjustment, Quality + Stars, and the few
 * anchor terms they depend on). The full term list is in the planning draft;
 * the rest are written topic by topic.
 *
 * Definitions are written from public sources. Where a Navina doc covers the
 * term, it is linked as an internal source rather than copied.
 */

const CMS_RATE_2026: Resource = {
  title: "2026 Medicare Advantage and Part D Rate Announcement",
  url: "https://www.cms.gov/newsroom/fact-sheets/2026-medicare-advantage-part-d-rate-announcement",
  kind: "external",
  source: "CMS",
};
const CMS_RISK_REPORT: Resource = {
  title: "Report to Congress: Risk Adjustment in Medicare Advantage (Dec 2024)",
  url: "https://www.cms.gov/files/document/report-congress-risk-adjustment-medicare-advantage-december-2024.pdf",
  kind: "external",
  source: "CMS",
};
const NAVINA_RISK_GLOSSARY: Resource = {
  title: "Risk Glossary: Terms & Acronyms",
  url: "https://app.notion.com/p/3c031faa1fb781c39d4fe98cf229dcd6",
  kind: "internal",
  source: "Notion",
};
const NAVINA_QUALITY_GLOSSARY: Resource = {
  title: "Quality glossary and logic documentation",
  url: "https://docs.google.com/document/d/1anuoz4PUejMRamPI-JxpYaAHexc3psrW7-ggaFAcqiw/edit",
  kind: "internal",
  source: "Google Drive",
};
const CMS_STAR_MEASURES: Resource = {
  title: "2027 Star Ratings Measures and Weights",
  url: "https://www.cms.gov/files/document/2027-star-ratings-measures.pdf",
  kind: "external",
  source: "CMS",
};
const CMS_PERF_DATA: Resource = {
  title: "Part C and D Performance Data",
  url: "https://www.cms.gov/medicare/health-drug-plans/part-c-d-performance-data",
  kind: "external",
  source: "CMS",
};
const KFF_QBP: Resource = {
  title: "Medicare Will Spend More Than $13 Billion on the Medicare Advantage Quality Bonus Program in 2026",
  url: "https://www.kff.org/medicare/medicare-will-spend-more-than-13-billion-on-the-medicare-advantage-quality-bonus-program-in-2026/",
  kind: "external",
  source: "KFF",
};
const CMS_RADV: Resource = {
  title: "CMS Rolls Out Aggressive Strategy to Enhance and Accelerate Medicare Advantage Audits",
  url: "https://www.cms.gov/newsroom/press-releases/cms-rolls-out-aggressive-strategy-enhance-accelerate-medicare-advantage-audits",
  kind: "external",
  source: "CMS",
};

const CORE_TERMS: GlossaryTerm[] = [
  // ── Anchor terms ─────────────────────────────────────────────────────────
  {
    term: "Value-based care",
    expansion: "VBC",
    short: "Payment tied to the cost and quality of care for a group of patients, not to the number of services delivered.",
    explanation:
      "In fee-for-service, a clinic earns more by doing more. In value-based care, a payer pays based on outcomes, quality and total cost for a defined group of patients, often sharing savings or losses with the clinic or group. The more of the financial risk a group takes on, the more it is paid when care is efficient and the more it loses when it is not.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["Fee-for-service", "Medicare Advantage", "Risk adjustment"],
    sources: [NAVINA_RISK_GLOSSARY],
  },
  {
    term: "Fee-for-service",
    expansion: "FFS",
    short: "A payment model where providers are paid for each visit, test or procedure.",
    explanation:
      "Each billed service has its own payment, so volume drives revenue. It is still the default for most outpatient care in the US, and value-based models are usually built by adjusting or replacing it.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["Value-based care", "Capitation"],
    sources: [],
  },
  {
    term: "Capitation",
    short: "A fixed payment per patient per month, regardless of how many services the patient uses.",
    explanation:
      "The payer pays a set amount for each attributed or enrolled patient, and the group takes on the cost of their care. Partial capitation covers some services, and full (global) capitation covers nearly all of them. Capitation payments are usually adjusted by the patient's risk score.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["Risk adjustment", "RAF score"],
    sources: [],
  },
  {
    term: "Medicare Advantage",
    expansion: "MA, Medicare Part C",
    short: "Private health plans that deliver Medicare benefits as an alternative to Original Medicare.",
    explanation:
      "A person with Medicare can choose to get their Part A and B benefits (and usually Part D drug coverage) through a private plan such as Humana or UnitedHealthcare. CMS pays the plan a monthly amount per member, adjusted by the member's risk score. It replaces Original Medicare coverage, which is different from Medigap, an extra policy that sits on top of Original Medicare.",
    topics: ["insurance-models", "risk-adjustment"],
    seeAlso: ["Risk adjustment", "Star Ratings", "Capitation"],
    sources: [CMS_RISK_REPORT],
  },

  // ── Risk adjustment ──────────────────────────────────────────────────────
  {
    term: "Risk adjustment",
    short: "Adjusting payment to match how sick a patient population is expected to be.",
    explanation:
      "Payers pay more for populations expected to cost more. The expected cost is calculated from the diagnoses documented for each patient in a year, plus demographics. It keeps plans from being rewarded for avoiding sick patients, and it makes accurate documentation of chronic conditions a financial matter.",
    topics: ["risk-adjustment"],
    seeAlso: ["HCC", "RAF score", "CMS-HCC V28"],
    sources: [CMS_RISK_REPORT, NAVINA_RISK_GLOSSARY],
  },
  {
    term: "HCC",
    expansion: "Hierarchical Condition Category",
    short: "A group of related diagnoses that carries a weight in the risk score.",
    explanation:
      "Thousands of ICD-10 diagnosis codes are mapped to a smaller set of HCCs, each representing a clinically related group of conditions with a similar expected cost. 'Hierarchical' means that when a patient has several HCCs in the same family, only the most severe one counts.",
    topics: ["risk-adjustment"],
    seeAlso: ["RAF score", "ICD-10", "CMS-HCC V28"],
    sources: [CMS_RISK_REPORT, NAVINA_RISK_GLOSSARY],
  },
  {
    term: "RAF score",
    expansion: "Risk Adjustment Factor",
    short: "A patient's risk score: expected cost relative to the average beneficiary, which is 1.0.",
    explanation:
      "The RAF adds a demographic factor (age, sex, Medicaid status and similar) to the weights of the patient's HCCs. A score of 1.0 is average, and 1.5 means expected cost 50% above average. Scores are recalculated each year from that year's documented diagnoses, so a condition has to be documented again to keep counting.",
    topics: ["risk-adjustment"],
    seeAlso: ["HCC", "Recapture", "Risk adjustment"],
    sources: [CMS_RISK_REPORT, NAVINA_RISK_GLOSSARY],
  },
  {
    term: "CMS-HCC V28",
    expansion: "2024 CMS-HCC model",
    short: "The current CMS risk model for Medicare Advantage, fully in effect from 2026 payments.",
    explanation:
      "CMS replaced the older V24 model with V28 and phased it in: 2024 payments used 33% V28, 2025 used 67%, and 2026 uses 100%. V28 uses a newer ICD-10 mapping, with more specific HCCs (115 payment HCCs vs. 86) but far fewer diagnosis codes counting toward payment, and lower weights for many conditions. The result was lower risk scores for many organizations.",
    topics: ["risk-adjustment"],
    seeAlso: ["HCC", "RAF score", "RxHCC"],
    sources: [CMS_RATE_2026],
  },
  {
    term: "RxHCC",
    short: "The risk model that predicts Medicare Part D (prescription drug) spending.",
    explanation:
      "Like CMS-HCC, it maps diagnoses to categories with weights, but it predicts drug costs instead of medical costs. Plans with drug coverage are paid using both models.",
    topics: ["risk-adjustment"],
    seeAlso: ["CMS-HCC V28", "HHS-HCC"],
    sources: [CMS_RATE_2026],
  },
  {
    term: "HHS-HCC",
    short: "The risk model used for ACA marketplace (individual and small group) plans.",
    explanation:
      "It is a separate model from CMS-HCC, calibrated on a younger, commercially insured population, and used in the ACA risk adjustment program that moves money between plans.",
    topics: ["risk-adjustment"],
    seeAlso: ["CMS-HCC V28", "RxHCC"],
    sources: [],
  },
  {
    term: "ICD-10",
    expansion: "International Classification of Diseases, 10th revision (ICD-10-CM in the US)",
    short: "The code set used to report diagnoses on claims and in charts.",
    explanation:
      "Each diagnosis has a code, for example E11.9 for type 2 diabetes without complications. Risk models map ICD-10 codes to HCCs, so the specificity of the code matters: a vague code may map to a lower-weight category or to none.",
    topics: ["risk-adjustment"],
    seeAlso: ["HCC"],
    sources: [NAVINA_RISK_GLOSSARY],
  },
  {
    term: "Recapture",
    short: "Documenting a previously coded chronic condition again in the new year so it stays in the risk score.",
    explanation:
      "Risk scores reset every January, so chronic conditions a patient already has must be evaluated and documented again each calendar year. Recapture protects the existing baseline, and missing it silently lowers next year's score.",
    topics: ["risk-adjustment"],
    seeAlso: ["Suspecting", "RAF score"],
    sources: [NAVINA_RISK_GLOSSARY],
  },
  {
    term: "Suspecting",
    short: "Finding a condition the chart supports but that has never been formally coded.",
    explanation:
      "Evidence in the record, such as medications, labs, notes or imaging, can point to a diagnosis nobody has documented. A suspect is a prompt for the clinician to evaluate the patient, not a diagnosis. It is only valid when the clinician examines the patient and documents the condition.",
    topics: ["risk-adjustment"],
    seeAlso: ["Recapture", "MEAT"],
    sources: [NAVINA_RISK_GLOSSARY],
  },
  {
    term: "MEAT",
    expansion: "Monitor, Evaluate, Assess, Treat",
    short: "A common checklist for showing a diagnosis is supported in a clinical note.",
    explanation:
      "If a note shows the clinician monitored, evaluated, assessed or treated the condition, the diagnosis is far easier to defend in an audit. MEAT is an industry convention rather than an official CMS term, so a plan's own audit guidance may use different wording.",
    topics: ["risk-adjustment"],
    seeAlso: ["RADV", "Suspecting"],
    sources: [NAVINA_RISK_GLOSSARY],
  },
  {
    term: "RADV",
    expansion: "Risk Adjustment Data Validation",
    short: "CMS audits that check whether diagnoses behind Medicare Advantage payments are supported by medical records.",
    explanation:
      "Auditors review a sample of members' records for the diagnoses that drove payment. Unsupported diagnoses can lead to repayment. In 2025 CMS announced it would audit all eligible contracts every year. Whether findings can be extrapolated across a whole contract was in litigation after a federal court vacated that provision in September 2025, so check the current status.",
    topics: ["risk-adjustment"],
    seeAlso: ["MEAT", "Risk adjustment"],
    sources: [CMS_RADV],
  },
  {
    term: "Coding intensity adjustment",
    short: "A reduction CMS applies to Medicare Advantage risk scores to account for more intensive coding than in Original Medicare.",
    explanation:
      "Plans tend to document more diagnoses than providers do in Original Medicare, which inflates scores. CMS reduces MA payments by a set percentage to offset this, with a statutory minimum of 5.9%.",
    topics: ["risk-adjustment"],
    seeAlso: ["RAF score", "Medicare Advantage"],
    sources: [CMS_RISK_REPORT],
  },

  // ── Quality and Star Ratings ─────────────────────────────────────────────
  {
    term: "Quality measure",
    short: "A defined test of whether patients received recommended care or had good results.",
    explanation:
      "Each measure states who is eligible (the denominator), who met the standard (the numerator), who can be excluded, and the time window. Examples are mammograms for women in an age range, or blood pressure under control for patients with hypertension.",
    topics: ["quality-and-stars"],
    seeAlso: ["HEDIS", "Care gap", "Exclusion"],
    sources: [NAVINA_QUALITY_GLOSSARY],
  },
  {
    term: "HEDIS",
    expansion: "Healthcare Effectiveness Data and Information Set",
    short: "The standard set of health plan quality measures, maintained by NCQA.",
    explanation:
      "Plans report HEDIS results every year, and many Medicare Advantage Star Ratings measures are HEDIS measures. NCQA updates the specifications each year, so the rules for a measure can change between measurement years.",
    topics: ["quality-and-stars"],
    seeAlso: ["NCQA", "Quality measure", "Star Ratings"],
    sources: [NAVINA_QUALITY_GLOSSARY],
  },
  {
    term: "NCQA",
    expansion: "National Committee for Quality Assurance",
    short: "The non-profit that maintains HEDIS and accredits health plans and practices.",
    explanation:
      "It writes and updates the HEDIS measure specifications. It also runs recognition programs, such as Patient-Centered Medical Home recognition for practices.",
    topics: ["quality-and-stars"],
    seeAlso: ["HEDIS"],
    sources: [],
  },
  {
    term: "Care gap",
    short: "A recommended service a patient in a measure's eligible group has not yet received or had documented.",
    explanation:
      "Care gaps usually come from payers, who identify them from claims and send a file to the practice. Many are already closed in the chart but invisible to the payer, so closing a gap often means finding and submitting existing evidence rather than a new visit.",
    topics: ["quality-and-stars"],
    seeAlso: ["Quality measure", "Exclusion", "Measurement year"],
    sources: [NAVINA_QUALITY_GLOSSARY],
  },
  {
    term: "Exclusion",
    short: "A legitimate reason to remove a patient from a measure's denominator.",
    explanation:
      "Examples are hospice enrollment, palliative care, or a surgery that removes the need for a screening. Documenting exclusions properly prevents a practice from being penalized for patients the measure should not apply to.",
    topics: ["quality-and-stars"],
    seeAlso: ["Care gap", "Quality measure"],
    sources: [NAVINA_QUALITY_GLOSSARY],
  },
  {
    term: "Measurement year",
    expansion: "MY",
    short: "The calendar year a quality measure is scored over.",
    explanation:
      "Results for a measurement year are reported after it ends. Most measures also look back further for some services, for example a colonoscopy counts for ten years.",
    topics: ["quality-and-stars"],
    seeAlso: ["HEDIS", "Care gap"],
    sources: [],
  },
  {
    term: "MIPS",
    expansion: "Merit-based Incentive Payment System",
    short: "A CMS program that adjusts clinicians' Medicare Part B payments based on performance.",
    explanation:
      "Clinicians and groups are scored on quality, cost, improvement activities and promoting interoperability, and the score sets a payment adjustment for a later year. It is separate from Star Ratings, which rate health plans, not clinicians.",
    topics: ["quality-and-stars"],
    seeAlso: ["HEDIS", "Star Ratings"],
    sources: [],
  },
  {
    term: "Star Ratings",
    short: "CMS's 1 to 5 star ratings of Medicare Advantage and Part D contracts.",
    explanation:
      "Each contract is rated in half-star steps from clinical quality, member experience and plan operations measures. Ratings are published each fall and shape plan marketing, enrollment and, through the quality bonus program, payment.",
    topics: ["quality-and-stars"],
    seeAlso: ["Quality bonus payment", "Cut points", "HEDIS"],
    sources: [CMS_PERF_DATA, CMS_STAR_MEASURES],
  },
  {
    term: "Cut points",
    short: "The score thresholds that turn a contract's measure results into 1 to 5 stars.",
    explanation:
      "CMS sets them each year from how all contracts performed, so the performance needed for a given star level can move from year to year even if a plan's own results stay the same.",
    topics: ["quality-and-stars"],
    seeAlso: ["Star Ratings"],
    sources: [CMS_PERF_DATA],
  },
  {
    term: "Quality bonus payment",
    expansion: "QBP",
    short: "Extra Medicare payment to Medicare Advantage plans rated 4 stars or higher.",
    explanation:
      "Contracts at 4 stars or above get a higher benchmark, 5 percentage points in most counties and 10 in certain 'double bonus' counties. Higher-rated contracts also keep a bigger share of the gap between benchmark and bid as rebate (70% at 4.5 stars or more, 65% from 3.5 to under 4.5, 50% below that). KFF estimated the program at more than $13 billion in 2026.",
    topics: ["quality-and-stars"],
    seeAlso: ["Star Ratings", "Medicare Advantage"],
    sources: [KFF_QBP],
  },
  {
    term: "CAHPS",
    expansion: "Consumer Assessment of Healthcare Providers and Systems",
    short: "Patient surveys on experience with their care and plan, used in Star Ratings.",
    explanation:
      "Members are asked about getting appointments and care quickly, communication with doctors, and plan customer service. Practices influence these results through access and the patient experience.",
    topics: ["quality-and-stars"],
    seeAlso: ["Star Ratings"],
    sources: [CMS_STAR_MEASURES],
  },
  {
    term: "CPT II codes",
    short: "Optional codes that report quality-related results on a claim, such as a blood pressure reading.",
    explanation:
      "Category II CPT codes carry performance information, such as that a patient's last blood pressure was under 140/90. Submitting them on a claim lets a payer close a care gap without chasing the medical record.",
    topics: ["quality-and-stars"],
    seeAlso: ["Care gap", "HEDIS"],
    sources: [],
  },
];

export const GLOSSARY: GlossaryTerm[] = [...CORE_TERMS, ...GLOSSARY_PAYMENT_ORGS, ...GLOSSARY_OPS_DATA];

export function getTerm(term: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.term === term);
}

/** Anchor id for a term, used for deep links like /know-your-domain/glossary#hcc. */
export function termId(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
