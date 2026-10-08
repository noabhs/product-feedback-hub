import type { GlossaryTerm, Resource } from "./types";

/**
 * Third batch: Utilization and cost, CMS and regulation, Clinic roles, Data and
 * interoperability, plus a few risk adjustment terms added by the 2027 rate
 * announcement. Merged into GLOSSARY in glossary.ts.
 */

const NAVINA_VBC_VOCAB: Resource = {
  title: "VBC Vocabulary and the Entity Hierarchy",
  url: "https://app.notion.com/p/39d31faa1fb780738decd35c7ea923b7",
  kind: "internal",
  source: "Notion",
};
const NAVINA_RISK_GLOSSARY: Resource = {
  title: "Risk Glossary: Terms & Acronyms",
  url: "https://app.notion.com/p/3c031faa1fb781c39d4fe98cf229dcd6",
  kind: "internal",
  source: "Notion",
};
const CMS_TCM: Resource = {
  title: "Transitional Care Management Services (MLN)",
  url: "https://www.cms.gov/files/document/mln908628-transitional-care-management-services.pdf",
  kind: "external",
  source: "CMS",
};
const CMS_CCM: Resource = {
  title: "Chronic Care Management Services (MLN)",
  url: "https://www.cms.gov/files/document/chroniccaremanagement.pdf",
  kind: "external",
  source: "CMS",
};
const CMS_HRRP: Resource = {
  title: "Hospital Readmissions Reduction Program",
  url: "https://www.cms.gov/medicare/payment/prospective-payment-systems/acute-inpatient-pps/hospital-readmissions-reduction-program-hrrp",
  kind: "external",
  source: "CMS",
};
const AHRQ_MEPS: Resource = {
  title: "Concentration of Healthcare Expenditures, 2018–2022",
  url: "https://meps.ahrq.gov/data_files/publications/st560/stat560.shtml",
  kind: "external",
  source: "AHRQ",
};
const CMS_RATE_2027: Resource = {
  title: "2027 Medicare Advantage and Part D Rate Announcement",
  url: "https://www.cms.gov/newsroom/fact-sheets/2027-medicare-advantage-part-d-rate-announcement",
  kind: "external",
  source: "CMS",
};
const CMS_0057: Resource = {
  title: "CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F)",
  url: "https://www.cms.gov/initiatives/burden-reduction/overview/interoperability/policies-regulations/cms-interoperability-prior-authorization-final-rule-cms-0057-f",
  kind: "external",
  source: "CMS",
};
const CMS_BCDA: Resource = {
  title: "Beneficiary Claims Data API (BCDA)",
  url: "https://bcda.cms.gov/",
  kind: "external",
  source: "CMS",
};
const CMS_BCDA_CCLF: Resource = {
  title: "Comparison of BCDA and CCLF Files",
  url: "https://bcda.cms.gov/bcda-data/comparison-bcda-cclf-files.html",
  kind: "external",
  source: "CMS",
};
const CMS_MA_RATES: Resource = {
  title: "Medicare Advantage Rates & Statistics",
  url: "https://www.cms.gov/medicare/payment/medicare-advantage-rates-statistics",
  kind: "external",
  source: "CMS",
};

export const GLOSSARY_OPS_DATA: GlossaryTerm[] = [
  // ── Risk adjustment additions (2027 rules) ───────────────────────────────
  {
    term: "Unlinked chart review",
    expansion: "Unlinked chart review record, unlinked CRR",
    short: "A diagnosis found in a chart review that is not tied to a specific patient visit.",
    explanation:
      "Plans used to submit diagnoses found by reviewing charts after the fact, without linking them to the encounter where they were documented. For 2027 payment, CMS excludes diagnoses from unlinked chart reviews from risk scores, except for patients who switch from one plan to another. It is another push toward documentation tied to a real visit.",
    topics: ["risk-adjustment", "cms-and-regulation"],
    seeAlso: ["Audio-only encounter", "RADV", "RAF score"],
    sources: [CMS_RATE_2027],
  },
  {
    term: "Audio-only encounter",
    short: "A visit conducted by phone without video.",
    explanation:
      "For 2027 payment CMS excludes diagnoses from audio-only encounters when it calculates risk scores. Audio-video telehealth visits can still support risk adjustment diagnoses. Documentation should record the type of visit.",
    topics: ["risk-adjustment", "clinic-roles"],
    seeAlso: ["Unlinked chart review", "RAF score"],
    sources: [CMS_RATE_2027],
  },

  // ── Utilization and cost ─────────────────────────────────────────────────
  {
    term: "Utilization",
    short: "How much care a population uses: hospital stays, emergency visits, specialist visits and drugs.",
    explanation:
      "It is usually counted per 1,000 patients so groups of different sizes can be compared. Controlling avoidable utilization is the main way value-based groups save money.",
    topics: ["utilization-and-cost"],
    seeAlso: ["Admits per 1,000", "Total cost of care", "Readmission"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "Admits per 1,000",
    expansion: "Admissions per 1,000 members",
    short: "Hospital inpatient stays per 1,000 patients in a year.",
    explanation:
      "The standard rate for comparing hospital use across groups and over time. Bed days per 1,000 adds how long patients stayed.",
    topics: ["utilization-and-cost"],
    seeAlso: ["Utilization", "Length of stay"],
    sources: [],
  },
  {
    term: "Length of stay",
    expansion: "LOS, ALOS (average length of stay)",
    short: "The number of days a patient stays in a hospital or facility.",
    explanation:
      "Longer stays cost more and, for older patients, raise the risk of complications. Hospital payment for a stay is usually a fixed amount per diagnosis group, so the hospital's incentive is to discharge sooner.",
    topics: ["utilization-and-cost"],
    seeAlso: ["Admits per 1,000", "DRG"],
    sources: [],
  },
  {
    term: "Observation stay",
    short: "A short hospital stay billed as outpatient care while doctors decide whether to admit the patient.",
    explanation:
      "Observation changes what the patient pays and how the stay appears in utilization data. In Original Medicare, observation days do not count toward the three-day inpatient stay required for skilled nursing facility coverage.",
    topics: ["utilization-and-cost", "insurance-models"],
    seeAlso: ["Admits per 1,000", "Post-acute care"],
    sources: [],
  },
  {
    term: "Readmission",
    short: "An unplanned return to the hospital shortly after discharge, usually within 30 days.",
    explanation:
      "It is a common quality signal because many readmissions come from gaps in discharge planning or follow-up. Medicare cuts payment to hospitals with high readmission rates, and Plan All-Cause Readmissions is a Star Ratings measure.",
    topics: ["utilization-and-cost", "quality-and-stars"],
    seeAlso: ["Transitional care management", "Hospital Readmissions Reduction Program"],
    sources: [CMS_HRRP],
  },
  {
    term: "Hospital Readmissions Reduction Program",
    expansion: "HRRP",
    short: "A Medicare program that reduces payment to hospitals with higher-than-expected 30-day readmissions.",
    explanation:
      "The penalty is capped at 3% of a hospital's Medicare payments. Measures have historically covered heart attack, heart failure, pneumonia, COPD and hip and knee replacement. It pushes hospitals to coordinate discharge with primary care.",
    topics: ["utilization-and-cost", "cms-and-regulation"],
    seeAlso: ["Readmission"],
    sources: [CMS_HRRP],
  },
  {
    term: "Post-acute care",
    short: "Care after a hospital stay: skilled nursing, rehab, home health.",
    explanation:
      "It is a large and variable part of total cost, and a place where care managers can influence outcomes. A skilled nursing facility (SNF) stay in Original Medicare requires a qualifying three-day inpatient hospital stay, which many Medicare Advantage plans waive.",
    topics: ["utilization-and-cost"],
    seeAlso: ["Observation stay", "Total cost of care"],
    sources: [],
  },
  {
    term: "Transitional care management",
    expansion: "TCM",
    short: "Medicare-paid services in the 30 days after a hospital discharge, with a quick contact and a follow-up visit.",
    explanation:
      "CPT 99495 and 99496 both require contact with the patient within 2 business days of discharge. 99495 needs at least moderate-complexity decision-making and a face-to-face visit within 14 days. 99496 needs high-complexity decision-making and a visit within 7 days. Only one practitioner can bill TCM per discharge.",
    topics: ["utilization-and-cost", "clinic-roles"],
    seeAlso: ["Readmission", "ADT feed"],
    sources: [CMS_TCM],
  },
  {
    term: "Chronic care management",
    expansion: "CCM",
    short: "A Medicare service where the care team supports patients with multiple chronic conditions between visits.",
    explanation:
      "It is for patients with two or more chronic conditions, delivered monthly with a care plan and minimum time requirements. It funds the between-visit work that keeps patients stable.",
    topics: ["utilization-and-cost", "clinic-roles"],
    seeAlso: ["Care manager", "Risk stratification"],
    sources: [CMS_CCM],
  },
  {
    term: "Risk stratification",
    short: "Sorting patients by expected need or cost so the care team focuses on those who benefit most.",
    explanation:
      "Models combine diagnoses, past use, medications and sometimes social factors into a risk tier. 'Rising risk' patients are those likely to become high-cost soon, who may be easier to help than those already very sick.",
    topics: ["utilization-and-cost"],
    seeAlso: ["High-cost claimant", "Care manager"],
    sources: [],
  },
  {
    term: "High-cost claimant",
    short: "A patient whose spending in a period is far above average.",
    explanation:
      "Spending is concentrated: in AHRQ's survey, the top 5% of the population account for about half of spending. Plans and groups watch high-cost claimants, and stop-loss insurance often covers costs above a threshold for a single patient.",
    topics: ["utilization-and-cost"],
    seeAlso: ["Risk stratification", "Total cost of care"],
    sources: [AHRQ_MEPS],
  },
  {
    term: "Allowed amount",
    short: "The price a payer decides a service is worth, the standard 'cost of care' number.",
    explanation:
      "It is lower than the billed charge. The allowed amount is split between what the payer pays and the patient's cost sharing. Be careful: this simple relationship fits outpatient and physician claims in Medicare Part B, while hospital stays and drugs are paid differently.",
    topics: ["utilization-and-cost", "insurance-models"],
    seeAlso: ["Claim", "Cost sharing", "Total cost of care"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "Shadow spend",
    short: "Care the group's patients receive elsewhere (hospital, specialist, pharmacy) that the group's systems never see.",
    explanation:
      "The payer pays for it and it counts against the group's budget, but the record exists only in payer data. It is the data gap behind much of the work on claims integration.",
    topics: ["utilization-and-cost", "data-and-interoperability"],
    seeAlso: ["Total cost of care", "Network leakage", "Claim"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "Network leakage",
    short: "Patients getting care outside the preferred network of providers.",
    explanation:
      "Out-of-network care is often costlier and less coordinated. Groups with downside risk track leakage to see where patients go and why.",
    topics: ["utilization-and-cost"],
    seeAlso: ["Shadow spend", "Total cost of care"],
    sources: [],
  },
  {
    term: "DRG",
    expansion: "Diagnosis-Related Group, MS-DRG",
    short: "A category used to pay a hospital a fixed amount for an inpatient stay, based on the diagnosis and procedures.",
    explanation:
      "Hospitals are paid by the DRG, not by the day. That is why a hospital claim has no per-line 'allowed' amount in Medicare Part A: the whole stay has one payment.",
    topics: ["utilization-and-cost"],
    seeAlso: ["Allowed amount", "Length of stay"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "Claim lag",
    expansion: "Claim run-out, IBNR (incurred but not reported)",
    short: "The delay between care and the claim appearing in the data.",
    explanation:
      "Claims arrive weeks to months after care. Recent months therefore look artificially cheap until they 'run out', and analysts add an estimate for unreported claims (IBNR) when judging recent performance.",
    topics: ["utilization-and-cost", "data-and-interoperability"],
    seeAlso: ["Total cost of care", "Shadow spend"],
    sources: [],
  },
  {
    term: "ADT feed",
    expansion: "Admit, Discharge, Transfer",
    short: "Real-time notices that a patient entered, left or moved within a hospital or emergency department.",
    explanation:
      "The messages follow the HL7 v2 format and carry the event, not clinical detail. They are the fastest trigger for post-discharge follow-up, and feed quality (delays, missing messages) varies.",
    topics: ["utilization-and-cost", "data-and-interoperability"],
    seeAlso: ["Transitional care management", "HL7", "HIE"],
    sources: [],
  },

  // ── CMS and regulation ───────────────────────────────────────────────────
  {
    term: "CMS",
    expansion: "Centers for Medicare & Medicaid Services",
    short: "The federal agency that runs Medicare and works with states on Medicaid.",
    explanation:
      "It sits inside the Department of Health and Human Services and sets payment rates, quality programs and rules. Almost every topic here traces back to something CMS decided.",
    topics: ["cms-and-regulation"],
    seeAlso: ["HHS", "CMMI", "Rate Announcement"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "HHS",
    expansion: "Department of Health and Human Services",
    short: "The federal department that includes CMS, the FDA, the CDC and others.",
    explanation:
      "HHS also houses OIG (fraud and abuse investigations) and OCR (HIPAA privacy enforcement), and the office that oversees national health IT policy.",
    topics: ["cms-and-regulation"],
    seeAlso: ["CMS", "OIG", "HIPAA"],
    sources: [],
  },
  {
    term: "CMMI",
    expansion: "Center for Medicare and Medicaid Innovation",
    short: "The part of CMS that designs and tests new payment models.",
    explanation:
      "It created ACO REACH and its successor LEAD, among others. CMS often calls its programs 'models', which is why the word is overloaded in this industry.",
    topics: ["cms-and-regulation", "vbc-fundamentals"],
    seeAlso: ["CMS", "ACO REACH", "LEAD model"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "OIG",
    expansion: "Office of Inspector General (HHS)",
    short: "The HHS office that investigates fraud, waste and abuse in federal health programs.",
    explanation:
      "It maintains the exclusion list of people and companies barred from federal programs, and audits Medicare Advantage risk adjustment among other things.",
    topics: ["cms-and-regulation"],
    seeAlso: ["Fraud, waste and abuse", "RADV", "False Claims Act"],
    sources: [],
  },
  {
    term: "Advance Notice",
    short: "CMS's proposed payment changes for the next Medicare Advantage year, published for comment in winter.",
    explanation:
      "It previews risk model changes and the rate trend, and the industry lobbies heavily on it. The final version is the Rate Announcement.",
    topics: ["cms-and-regulation"],
    seeAlso: ["Rate Announcement", "CMS-HCC V28"],
    sources: [CMS_MA_RATES],
  },
  {
    term: "Rate Announcement",
    short: "CMS's final payment rates and policies for the next Medicare Advantage year, published by early April.",
    explanation:
      "The 2027 announcement projected a 2.48% payment increase (4.98% including expected risk score growth), kept the 2024 risk model, and excluded diagnoses from audio-only visits and unlinked chart reviews from risk scores.",
    topics: ["cms-and-regulation", "risk-adjustment"],
    seeAlso: ["Advance Notice", "Unlinked chart review", "CMS-HCC V28"],
    sources: [CMS_RATE_2027],
  },
  {
    term: "Annual enrollment period",
    expansion: "AEP, open enrollment",
    short: "The October 15 to December 7 window when Medicare patients can change plans.",
    explanation:
      "Star Ratings and plan benefits are published before it starts, so a plan's rating can affect how many members it gains or loses.",
    topics: ["cms-and-regulation", "insurance-models"],
    seeAlso: ["Star Ratings", "Medicare Advantage"],
    sources: [],
  },
  {
    term: "Physician Fee Schedule",
    expansion: "PFS",
    short: "The annual CMS rule that sets what Medicare pays for physician services.",
    explanation:
      "The yearly update also changes the Shared Savings Program and MIPS, so it matters to ACOs and clinicians as well as to billing.",
    topics: ["cms-and-regulation"],
    seeAlso: ["MSSP", "MIPS"],
    sources: [],
  },
  {
    term: "CMS-0057-F",
    expansion: "Interoperability and Prior Authorization final rule",
    short: "A 2024 CMS rule making many payers decide prior authorizations faster and offer standard FHIR APIs.",
    explanation:
      "From 2026, decisions are due within 72 hours for urgent requests and 7 calendar days for standard ones. From 2027, payers must offer Patient Access, Provider Access, Payer-to-Payer and Prior Authorization APIs. The mandated data is narrower than a full claims feed.",
    topics: ["cms-and-regulation", "data-and-interoperability"],
    seeAlso: ["FHIR", "Prior authorization", "Information blocking"],
    sources: [CMS_0057],
  },
  {
    term: "HIPAA",
    expansion: "Health Insurance Portability and Accountability Act",
    short: "The US law that protects the privacy and security of patient health information.",
    explanation:
      "It applies to health plans, most providers and clearinghouses (covered entities), and to companies that handle patient data on their behalf (business associates).",
    topics: ["cms-and-regulation", "data-and-interoperability"],
    seeAlso: ["Business associate", "PHI", "BAA"],
    sources: [],
  },
  {
    term: "Business associate",
    short: "A company that handles patient health information on behalf of a covered entity.",
    explanation:
      "Software vendors are usually business associates of the practices they serve. They sign a business associate agreement (BAA) and must follow HIPAA's security rules.",
    topics: ["cms-and-regulation", "data-and-interoperability"],
    seeAlso: ["HIPAA", "BAA", "PHI"],
    sources: [],
  },
  {
    term: "Information blocking",
    short: "Unreasonably withholding or interfering with access to electronic health information, which federal law prohibits.",
    explanation:
      "It comes from the 21st Century Cures Act and applies to providers, health IT developers and health information networks. It supports patients' and providers' access to data.",
    topics: ["cms-and-regulation", "data-and-interoperability"],
    seeAlso: ["TEFCA", "CMS-0057-F"],
    sources: [],
  },
  {
    term: "TEFCA",
    expansion: "Trusted Exchange Framework and Common Agreement",
    short: "A national framework for connecting health information networks so data can be shared across them.",
    explanation:
      "Networks that meet its requirements can exchange data with each other, so one connection can reach many organizations. It is meant to reduce the need for separate agreements with each exchange.",
    topics: ["cms-and-regulation", "data-and-interoperability"],
    seeAlso: ["HIE", "Information blocking"],
    sources: [],
  },
  {
    term: "False Claims Act",
    short: "A federal law that penalizes knowingly submitting false claims to the government.",
    explanation:
      "Overstated diagnoses or billing for care not delivered can trigger it, and whistleblowers can bring cases. It is the background risk behind risk adjustment audits.",
    topics: ["cms-and-regulation", "risk-adjustment"],
    seeAlso: ["RADV", "Fraud, waste and abuse"],
    sources: [],
  },
  {
    term: "Anti-Kickback Statute",
    short: "A federal law that prohibits paying or receiving anything of value to induce referrals for federal health program business.",
    explanation:
      "It matters wherever tools, incentives or payments sit inside referral or value-based workflows. Safe harbors allow some arrangements.",
    topics: ["cms-and-regulation"],
    seeAlso: ["Stark law", "False Claims Act"],
    sources: [],
  },
  {
    term: "Stark law",
    short: "A federal law restricting physicians from referring Medicare patients for certain services to entities they have a financial relationship with.",
    explanation:
      "Unlike the Anti-Kickback Statute, it does not require intent to violate, so compliance is checked structurally.",
    topics: ["cms-and-regulation"],
    seeAlso: ["Anti-Kickback Statute"],
    sources: [],
  },
  {
    term: "Fraud, waste and abuse",
    expansion: "FWA",
    short: "The umbrella term for improper billing and payment, and the training and detection programs aimed at it.",
    explanation:
      "Plans hold their contractors to FWA programs, and many require FWA training by contract. CMS holds plans accountable for the compliance of the organizations they delegate work to.",
    topics: ["cms-and-regulation"],
    seeAlso: ["False Claims Act", "OIG"],
    sources: [],
  },

  // ── Clinic roles and workflows ───────────────────────────────────────────
  {
    term: "PCP",
    expansion: "Primary care provider",
    short: "The clinician a patient sees first for regular care: a physician, nurse practitioner or physician assistant.",
    explanation:
      "Patient attribution in value-based programs usually follows where patients receive their primary care, so the PCP relationship decides who is accountable for the patient.",
    topics: ["clinic-roles"],
    seeAlso: ["Attribution", "NP", "PA"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "NP",
    expansion: "Nurse practitioner",
    short: "An advanced practice nurse who can diagnose and treat patients, within state rules.",
    explanation:
      "Many primary care practices rely on NPs for a large share of visits. Their diagnoses count for risk adjustment like any other acceptable provider's.",
    topics: ["clinic-roles"],
    seeAlso: ["PA", "PCP"],
    sources: [],
  },
  {
    term: "PA",
    expansion: "Physician assistant",
    short: "A clinician licensed to practice medicine in a team with physicians, within state rules.",
    explanation:
      "PAs examine, diagnose and treat patients. Like NPs, they often provide primary care in value-based practices.",
    topics: ["clinic-roles"],
    seeAlso: ["NP", "PCP"],
    sources: [],
  },
  {
    term: "Medical assistant",
    expansion: "MA",
    short: "A clinical support staff member who rooms patients, takes vitals and helps with screenings.",
    explanation:
      "The blood pressure and screening results an MA records feed quality measures, so accurate entry in the right place matters. The abbreviation 'MA' is also used for Medicare Advantage, so read the context.",
    topics: ["clinic-roles"],
    seeAlso: ["Care gap", "Quality measure"],
    sources: [],
  },
  {
    term: "Care manager",
    short: "A nurse or social worker who supports patients with complex needs between visits.",
    explanation:
      "They follow up after discharge, help patients manage chronic conditions, and work lists of patients with open gaps. A care coordinator handles scheduling and referrals.",
    topics: ["clinic-roles", "utilization-and-cost"],
    seeAlso: ["Chronic care management", "Transitional care management"],
    sources: [],
  },
  {
    term: "Medical coder",
    expansion: "Risk adjustment coder, CRC",
    short: "A specialist who turns clinical notes into diagnosis and procedure codes.",
    explanation:
      "In value-based practices, coders also review charts before visits to find conditions that should be re-evaluated or newly documented. Many hold the certified risk adjustment coder (CRC) credential.",
    topics: ["clinic-roles", "risk-adjustment"],
    seeAlso: ["Recapture", "Suspecting", "CDI"],
    sources: [NAVINA_RISK_GLOSSARY],
  },
  {
    term: "CDI",
    expansion: "Clinical documentation improvement",
    short: "Work with clinicians to make notes specific, complete and defensible.",
    explanation:
      "A CDI specialist may query a clinician when a note lacks detail, for example the type of heart failure. Better specificity improves coding accuracy and survives audits.",
    topics: ["clinic-roles", "risk-adjustment"],
    seeAlso: ["MEAT", "Medical coder"],
    sources: [],
  },
  {
    term: "Pre-visit planning",
    short: "Reviewing a patient's chart before the visit to list care gaps and conditions to address.",
    explanation:
      "A nurse or coder prepares a short summary for the clinician. Done well it makes the visit do double duty: closing gaps and documenting chronic conditions.",
    topics: ["clinic-roles", "risk-adjustment"],
    seeAlso: ["Recapture", "Care gap"],
    sources: [],
  },
  {
    term: "Annual wellness visit",
    expansion: "AWV",
    short: "A yearly Medicare preventive visit, not a full physical.",
    explanation:
      "It reviews health risks and a prevention plan and closes several quality measures. Practices use it as a moment to review and document chronic conditions.",
    topics: ["clinic-roles", "quality-and-stars"],
    seeAlso: ["Care gap", "Pre-visit planning"],
    sources: [],
  },
  {
    term: "SOAP note",
    expansion: "Subjective, Objective, Assessment, Plan",
    short: "The common structure of a clinical visit note.",
    explanation:
      "The Assessment section is where the clinician states diagnoses, so it is the key part for coding. In clinic vocabulary an 'assessment' is a medical diagnosis, for example sleep apnea or kidney failure.",
    topics: ["clinic-roles"],
    seeAlso: ["MEAT", "Date of service"],
    sources: [],
  },
  {
    term: "Date of service",
    expansion: "DOS",
    short: "The date a service was delivered.",
    explanation:
      "Claims, risk scores and measure windows are all keyed to it. A diagnosis counts for the year of its date of service.",
    topics: ["clinic-roles", "risk-adjustment"],
    seeAlso: ["Claim", "Measurement year"],
    sources: [],
  },
  {
    term: "Claim",
    short: "The bill a provider sends a payer for a service or stay.",
    explanation:
      "It lists the diagnosis codes (ICD-10) and procedure codes (CPT) and the amounts. Nearly all cost data comes from claims, since money only moves when someone bills someone. A professional claim is billed by a clinician, an institutional claim by a facility.",
    topics: ["clinic-roles", "data-and-interoperability", "utilization-and-cost"],
    seeAlso: ["Allowed amount", "CPT", "ICD-10"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "Clearinghouse",
    short: "A service that checks and forwards claims from providers to payers.",
    explanation:
      "It catches formatting errors before submission and routes the claim to the right payer, reducing denials.",
    topics: ["clinic-roles", "data-and-interoperability"],
    seeAlso: ["Claim", "RCM"],
    sources: [],
  },
  {
    term: "RCM",
    expansion: "Revenue cycle management",
    short: "The process of getting paid: scheduling, coding, billing, collecting and handling denials.",
    explanation:
      "It covers everything between a patient booking a visit and the money arriving. Billers and coders are its core staff.",
    topics: ["clinic-roles"],
    seeAlso: ["Claim", "Clearinghouse"],
    sources: [],
  },

  // ── Data and interoperability ────────────────────────────────────────────
  {
    term: "EHR",
    expansion: "Electronic health record (also EMR, electronic medical record)",
    short: "The practice's clinical system of record: notes, diagnoses, medications, labs, orders.",
    explanation:
      "Common vendors include Epic, athenahealth, eClinicalWorks and Oracle Health (Cerner). It is rich in clinical detail for patients seen at the practice and holds little cost information.",
    topics: ["data-and-interoperability"],
    seeAlso: ["MRN", "FHIR", "HIE"],
    sources: [NAVINA_RISK_GLOSSARY],
  },
  {
    term: "MRN",
    expansion: "Medical record number",
    short: "A patient's ID inside one practice or hospital's EHR.",
    explanation:
      "It differs between organizations, so the same patient has several MRNs. Linking records across systems needs a master patient index or matching on other fields.",
    topics: ["data-and-interoperability"],
    seeAlso: ["MBI", "EHR"],
    sources: [],
  },
  {
    term: "MBI",
    expansion: "Medicare Beneficiary Identifier",
    short: "The ID on a patient's Medicare card.",
    explanation:
      "It is the main key for matching a Medicare claim to an EHR patient. It replaced the older Social Security-based number.",
    topics: ["data-and-interoperability", "insurance-models"],
    seeAlso: ["MRN", "CCLF"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "CCLF",
    expansion: "Claim and Claim Line Feed",
    short: "Monthly files of Traditional Medicare claims that CMS sends to an ACO for its attributed patients.",
    explanation:
      "The files are fixed-width (positional), not FHIR, and decoded with a CMS record layout. They contain Traditional Medicare claims only. Medicare Advantage claims are not included.",
    topics: ["data-and-interoperability", "utilization-and-cost"],
    seeAlso: ["BCDA", "MBI", "Attribution"],
    sources: [CMS_BCDA_CCLF, NAVINA_VBC_VOCAB],
  },
  {
    term: "BCDA",
    expansion: "Beneficiary Claims Data API",
    short: "A CMS API that delivers Traditional Medicare claims for an ACO's patients in FHIR format.",
    explanation:
      "It carries similar content to CCLF but updates more often: adjudicated claims weekly and partially adjudicated claims daily. Access is tied to the ACO's credentials and covers Traditional Medicare only.",
    topics: ["data-and-interoperability"],
    seeAlso: ["CCLF", "FHIR", "ACO"],
    sources: [CMS_BCDA, CMS_BCDA_CCLF],
  },
  {
    term: "FHIR",
    expansion: "Fast Healthcare Interoperability Resources",
    short: "A modern standard for exchanging health data as web APIs.",
    explanation:
      "Data are organized as resources (Patient, Observation, Claim) in JSON. A claim in FHIR is an ExplanationOfBenefit. Both BCDA and the payer APIs required from 2027 use it.",
    topics: ["data-and-interoperability"],
    seeAlso: ["HL7", "SMART on FHIR", "BCDA"],
    sources: [NAVINA_RISK_GLOSSARY],
  },
  {
    term: "SMART on FHIR",
    short: "A way for apps to launch inside an EHR and use its data securely through FHIR.",
    explanation:
      "Epic uses it for embedded apps. It enables near-real-time access without a separate login or an overlay that reads the screen.",
    topics: ["data-and-interoperability"],
    seeAlso: ["FHIR", "EHR"],
    sources: [NAVINA_RISK_GLOSSARY],
  },
  {
    term: "HL7",
    expansion: "Health Level Seven",
    short: "The standards body behind HL7 v2 messages, C-CDA documents and FHIR.",
    explanation:
      "HL7 v2 is the older, pipe-delimited message format still used for ADT feeds and lab results. The newer standards are FHIR and C-CDA.",
    topics: ["data-and-interoperability"],
    seeAlso: ["FHIR", "ADT feed", "C-CDA"],
    sources: [],
  },
  {
    term: "C-CDA",
    expansion: "Consolidated Clinical Document Architecture",
    short: "An XML format for clinical documents such as visit summaries and discharge summaries.",
    explanation:
      "It is how many systems exchange a patient summary with each other. CDA is the underlying standard, and C-CDA is the set of templates used in the US.",
    topics: ["data-and-interoperability"],
    seeAlso: ["HL7", "FHIR", "HIE"],
    sources: [],
  },
  {
    term: "HIE",
    expansion: "Health information exchange",
    short: "A network or protocol for sharing clinical records between organizations.",
    explanation:
      "Carequality, CommonWell and eHealth Exchange are the largest national networks. They can surface records from outside facilities when a patient is seen elsewhere. Availability depends on the EHR and the customer's connections.",
    topics: ["data-and-interoperability"],
    seeAlso: ["TEFCA", "ADT feed", "EHR"],
    sources: [NAVINA_RISK_GLOSSARY],
  },
  {
    term: "CPT",
    expansion: "Current Procedural Terminology",
    short: "The code set for medical services and procedures, owned by the American Medical Association.",
    explanation:
      "Every billed service has a CPT code, such as an office visit or an annual wellness visit, and Medicare sets a payment for each. CPT II codes are optional codes that report quality results.",
    topics: ["data-and-interoperability", "clinic-roles"],
    seeAlso: ["ICD-10", "HCPCS", "CPT II codes"],
    sources: [],
  },
  {
    term: "HCPCS",
    expansion: "Healthcare Common Procedure Coding System",
    short: "The code set that includes CPT plus codes for supplies, equipment and drugs.",
    explanation:
      "Level I is CPT. Level II codes cover items CPT does not, such as ambulance services and some injectable drugs.",
    topics: ["data-and-interoperability"],
    seeAlso: ["CPT", "ICD-10"],
    sources: [],
  },
  {
    term: "SNOMED CT",
    short: "A detailed clinical vocabulary of conditions, findings and procedures.",
    explanation:
      "It describes concepts as a graph, so 'type 2 diabetes' and its complications are related. It is richer than ICD-10, which is why mapping between them is hard. ECL is its query language.",
    topics: ["data-and-interoperability"],
    seeAlso: ["ICD-10", "LOINC"],
    sources: [],
  },
  {
    term: "LOINC",
    short: "The code set for lab tests and clinical observations.",
    explanation:
      "It identifies a specific lab result (observation), a group of results (panel), and reference ranges, so an HbA1c from any lab means the same thing.",
    topics: ["data-and-interoperability"],
    seeAlso: ["SNOMED CT", "RxNorm"],
    sources: [],
  },
  {
    term: "RxNorm",
    short: "The US standard that normalizes drug names and maps different drug products to each other.",
    explanation:
      "It is used to match a drug across systems, for example to link NDC package codes to the same medicine.",
    topics: ["data-and-interoperability"],
    seeAlso: ["NDC", "LOINC"],
    sources: [],
  },
  {
    term: "NDC",
    expansion: "National Drug Code",
    short: "A code that identifies each drug product, including labeler and package size.",
    explanation:
      "A different package size or label gets a different NDC for the same medicine, so analysts map NDCs to RxNorm or ATC classes to group them.",
    topics: ["data-and-interoperability"],
    seeAlso: ["RxNorm"],
    sources: [],
  },
  {
    term: "PHI",
    expansion: "Protected health information",
    short: "Health information that identifies a person and is protected by HIPAA.",
    explanation:
      "It includes names, dates, record numbers and any combination of data that could identify someone. Vendors handling it sign a business associate agreement.",
    topics: ["data-and-interoperability", "cms-and-regulation"],
    seeAlso: ["HIPAA", "Business associate", "BAA"],
    sources: [],
  },
  {
    term: "BAA",
    expansion: "Business associate agreement",
    short: "The contract that sets how a vendor may use and protect a provider's patient data.",
    explanation:
      "HIPAA requires one between a covered entity and any business associate that handles PHI. It limits the vendor's use of the data to the services it provides.",
    topics: ["data-and-interoperability", "cms-and-regulation"],
    seeAlso: ["Business associate", "PHI", "HIPAA"],
    sources: [],
  },
];
