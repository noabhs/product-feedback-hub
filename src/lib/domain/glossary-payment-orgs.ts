import type { GlossaryTerm, Resource } from "./types";

/**
 * Second batch: VBC fundamentals, Care organizations, Insurance models.
 * Merged into GLOSSARY in glossary.ts.
 */

const CMS_ACO_2026: Resource = {
  title: "2026 Medicare Accountable Care Organization Initiatives Participation Highlights",
  url: "https://www.cms.gov/newsroom/fact-sheets/2026-medicare-accountable-care-organization-initiatives-participation-highlights",
  kind: "external",
  source: "CMS",
};
const CMS_ACO_COMPARE: Resource = {
  title: "ACO Comparison: LEAD, ACO REACH, and Medicare Shared Savings Program",
  url: "https://www.cms.gov/priorities/innovation/files/aco-model-comparison.pdf",
  kind: "external",
  source: "CMS Innovation Center",
};
const CMS_MSSP_TRACKS: Resource = {
  title: "Comparison of BASIC track and ENHANCED track",
  url: "https://www.cms.gov/Medicare/Medicare-Fee-for-Service-Payment/sharedsavingsprogram/Downloads/ssp-aco-participation-options.pdf",
  kind: "external",
  source: "CMS",
};
const KFF_MA_2026: Resource = {
  title: "Medicare Advantage in 2026: Enrollment Update and Key Trends",
  url: "https://www.kff.org/medicare/medicare-advantage-in-2026-enrollment-update-and-key-trends/",
  kind: "external",
  source: "KFF",
};
const KFF_MA_PAYMENT: Resource = {
  title: "How Medicare Pays Medicare Advantage Plans: Issues and Policy Options",
  url: "https://www.kff.org/medicare/how-medicare-pays-medicare-advantage-plans-issues-and-policy-options/",
  kind: "external",
  source: "KFF",
};
const NAVINA_VBC_VOCAB: Resource = {
  title: "VBC Vocabulary and the Entity Hierarchy",
  url: "https://app.notion.com/p/39d31faa1fb780738decd35c7ea923b7",
  kind: "internal",
  source: "Notion",
};

export const GLOSSARY_PAYMENT_ORGS: GlossaryTerm[] = [
  // ── VBC fundamentals ─────────────────────────────────────────────────────
  {
    term: "Alternative payment model",
    expansion: "APM",
    short: "Any payment approach that links payment to quality, cost or population results instead of paying purely per service.",
    explanation:
      "The term covers everything from quality bonuses on top of fee-for-service to shared savings, bundled payments and capitation. CMS also uses 'Advanced APM' for the subset of models that meet requirements for Medicare's clinician payment program.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["Value-based care", "Shared savings", "Capitation"],
    sources: [CMS_ACO_COMPARE],
  },
  {
    term: "LAN APM framework",
    short: "A four-category scheme for sorting payment models from fee-for-service to population-based payment.",
    explanation:
      "Category 1 is fee-for-service with no link to quality. Category 2 is fee-for-service linked to quality or value. Category 3 is models built on fee-for-service with shared savings or risk, or bundled payment. Category 4 is population-based payment such as capitation. It is published by the Health Care Payment Learning & Action Network.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["Alternative payment model", "Capitation"],
    sources: [],
  },
  {
    term: "Pay-for-performance",
    expansion: "P4P",
    short: "Bonuses or penalties added to fee-for-service payments based on quality or cost results.",
    explanation:
      "The payer keeps paying per service and adds a bonus (or withholds part of payment) depending on measures such as care gap closure or readmissions. It is the lightest form of value-based payment because the provider carries little financial risk.",
    topics: ["vbc-fundamentals", "quality-and-stars"],
    seeAlso: ["Fee-for-service", "Shared savings"],
    sources: [],
  },
  {
    term: "Shared savings",
    short: "An arrangement where a group keeps a share of the money saved when its patients cost less than a benchmark.",
    explanation:
      "The payer sets a spending benchmark for the group's patients. If actual spending comes in below it, by more than a minimum threshold and with enough quality, the savings are split between the payer and the group. The share varies by program and track, and is often scaled by the quality score. For example, in Medicare's MSSP the maximum sharing rate is 40% to 50% in the BASIC track and up to 75% in the ENHANCED track.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["Benchmark", "Minimum savings rate", "Two-sided risk"],
    sources: [CMS_MSSP_TRACKS],
  },
  {
    term: "Two-sided risk",
    expansion: "Downside risk",
    short: "A risk arrangement where the group shares both savings and losses.",
    explanation:
      "If spending exceeds the benchmark, the group repays part of the overage. This is opposite to upside-only (one-sided) risk, where the group can only gain. Programs usually offer a higher share of savings to groups that accept two-sided risk.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["Shared savings", "Upside-only risk"],
    sources: [CMS_MSSP_TRACKS],
  },
  {
    term: "Upside-only risk",
    expansion: "One-sided risk",
    short: "A risk arrangement where the group can earn savings but never owes losses.",
    explanation:
      "It is a common starting point for groups new to value-based contracts, such as the first levels of the MSSP BASIC track. The group learns to manage cost with no downside, at the price of a lower share of savings.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["Two-sided risk", "Shared savings"],
    sources: [CMS_MSSP_TRACKS],
  },
  {
    term: "Benchmark",
    short: "The spending target a group's patients are measured against.",
    explanation:
      "In shared savings it is the expected total cost of the attributed patients, set from past spending and adjusted for risk. In Medicare Advantage the word means something different: the county-level payment ceiling that plan bids are compared to.",
    topics: ["vbc-fundamentals", "insurance-models"],
    seeAlso: ["Shared savings", "Risk adjustment", "Minimum savings rate"],
    sources: [KFF_MA_PAYMENT],
  },
  {
    term: "Minimum savings rate",
    expansion: "MSR",
    short: "The savings threshold a group must clear before it can share in savings.",
    explanation:
      "It exists so normal random variation in spending is not mistaken for real savings. If an ACO's spending falls below the benchmark by less than the MSR, no savings are shared. A matching minimum loss rate protects groups with downside risk.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["Benchmark", "Shared savings"],
    sources: [CMS_MSSP_TRACKS],
  },
  {
    term: "Total cost of care",
    expansion: "TCOC",
    short: "Everything spent on a patient's health care, wherever it happens.",
    explanation:
      "It adds up hospital, physician, drug and other costs across all providers. In value-based contracts the group is held to the total cost of its attributed patients, including care it never sees, such as a hospital visit across town.",
    topics: ["vbc-fundamentals", "utilization-and-cost"],
    seeAlso: ["Attribution", "Benchmark"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "PMPM",
    expansion: "Per member per month",
    short: "A payment or cost expressed per patient, per month.",
    explanation:
      "It is the standard unit for capitation payments, and for comparing costs between groups of different sizes. PMPY (per member per year) is the annual version.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["Capitation", "Total cost of care"],
    sources: [],
  },
  {
    term: "Attribution",
    short: "How a payer decides which patients a group is accountable for.",
    explanation:
      "In Medicare ACO programs patients are assigned to an ACO mainly by where they received the most primary care. They are not enrolled and are free to see any provider. The group's cost and quality results are then measured on that list of patients.",
    topics: ["vbc-fundamentals", "insurance-models"],
    seeAlso: ["Total cost of care", "Medicare Advantage"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "Bundled payment",
    short: "One payment for all the care in an episode, such as a joint replacement.",
    explanation:
      "Instead of paying hospital, surgeon and rehab separately, the payer sets a price for the whole episode. Providers keep what is left if they deliver the care for less, and bear the overage if it costs more.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["Alternative payment model", "Capitation"],
    sources: [],
  },
  {
    term: "MSSP",
    expansion: "Medicare Shared Savings Program",
    short: "Medicare's main ACO program: groups share savings (and optionally losses) for Traditional Medicare patients.",
    explanation:
      "It is the largest ACO program, with 511 ACOs and 12.6 million Traditional Medicare patients in 2026. ACOs choose a BASIC track, which starts upside-only and adds risk over time, or an ENHANCED track, which carries two-sided risk from the start and a higher sharing rate.",
    topics: ["vbc-fundamentals", "care-organizations"],
    seeAlso: ["ACO", "Shared savings", "ACO REACH"],
    sources: [CMS_ACO_2026, CMS_MSSP_TRACKS],
  },
  {
    term: "ACO REACH",
    expansion: "ACO Realizing Equity, Access, and Community Health",
    short: "A CMS Innovation Center ACO model with higher risk options. It ends after 2026 and is replaced by LEAD.",
    explanation:
      "It offers Professional risk (50% of savings and losses) and Global risk (100%), with capitated payment options. It had 74 ACOs and 1.7 million patients in 2026. CMS announced that LEAD will start in January 2027 as its successor.",
    topics: ["vbc-fundamentals", "care-organizations"],
    seeAlso: ["LEAD model", "MSSP"],
    sources: [CMS_ACO_2026, CMS_ACO_COMPARE],
  },
  {
    term: "LEAD model",
    expansion: "Long-term Enhanced ACO Design",
    short: "The ten-year CMS ACO model that replaces ACO REACH from January 2027.",
    explanation:
      "It runs from 2027 through 2036 and keeps REACH's two risk options. It adds prospective payments, an extra payment for rural providers and lower patient-count requirements so smaller and newer ACOs can join. CMS had not published its risk adjustment method when it was announced, so check the current rules.",
    topics: ["vbc-fundamentals"],
    seeAlso: ["ACO REACH", "MSSP"],
    sources: [CMS_ACO_COMPARE],
  },

  // ── Care organizations ───────────────────────────────────────────────────
  {
    term: "ACO",
    expansion: "Accountable Care Organization",
    short: "A group of providers that agrees to be accountable for the cost and quality of care for a defined set of patients.",
    explanation:
      "In Medicare, an ACO is a legal entity that contracts with CMS on behalf of its member practices, so it is an entity by definition. Reserve the bare term for CMS programs (MSSP, REACH, LEAD). The industry also says 'commercial ACO' loosely for private-payer arrangements.",
    topics: ["care-organizations", "vbc-fundamentals"],
    seeAlso: ["MSSP", "IPA", "Entity"],
    sources: [NAVINA_VBC_VOCAB, CMS_ACO_2026],
  },
  {
    term: "IPA",
    expansion: "Independent Practice Association",
    short: "A group of independent practices that contract with payers together.",
    explanation:
      "Banding together lets small practices negotiate with plans and often take capitation as a group, while staying independent. It is entity-shaped because it can sign risk contracts.",
    topics: ["care-organizations"],
    seeAlso: ["CIN", "MSO", "Capitation"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "CIN",
    expansion: "Clinically Integrated Network",
    short: "A network of hospitals and physicians organized to contract jointly while meeting clinical integration rules.",
    explanation:
      "Clinical integration, meaning shared protocols and quality programs, is what allows independent providers to negotiate together without breaking antitrust rules. CINs are often anchored by a hospital or health system.",
    topics: ["care-organizations"],
    seeAlso: ["IPA", "ACO"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "MSO",
    expansion: "Management Services Organization",
    short: "A company that runs the back office of medical practices: billing, IT, coding and contracting support.",
    explanation:
      "It does not deliver care and, by definition, does not hold a risk contract, though it may support practices that do. In states that restrict who can own a medical practice, the MSO often contracts with a physician-owned professional corporation. It is unrelated to an MCO despite the acronym.",
    topics: ["care-organizations"],
    seeAlso: ["IPA", "MCO", "Entity"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "Entity",
    expansion: "Risk-bearing organization, APM entity",
    short: "The organization that signed the risk contract with a payer.",
    explanation:
      "It is where patients are attributed, where savings or losses are settled and where data feeds are granted. A practice can be inside an entity, or be the entity itself. The test is simple: can it sign a risk contract with a payer and receive a data feed? If so, it is an entity.",
    topics: ["care-organizations", "vbc-fundamentals"],
    seeAlso: ["ACO", "TIN", "Attribution"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "TIN",
    expansion: "Taxpayer Identification Number",
    short: "The tax ID that identifies a practice or medical group on claims.",
    explanation:
      "Medicare programs use TINs to define which practices belong to an ACO. One TIN can cover several clinic locations and many clinicians, each of whom has an individual NPI.",
    topics: ["care-organizations", "data-and-interoperability"],
    seeAlso: ["NPI", "Entity"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "NPI",
    expansion: "National Provider Identifier",
    short: "A unique ID number for an individual clinician or a health care organization.",
    explanation:
      "It appears on claims and is how a payer knows who delivered a service. Patient attribution typically runs at the NPI level and then rolls up through the practice's TIN to the entity.",
    topics: ["care-organizations", "data-and-interoperability"],
    seeAlso: ["TIN", "Attribution"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "Medical group",
    short: "A group of physicians practicing together under one organization.",
    explanation:
      "A medical group can be small or very large, and may be independent or owned by a health system or investor. It can hold risk contracts directly, join an ACO or IPA as a participant, or both at once for different payers.",
    topics: ["care-organizations"],
    seeAlso: ["ACO", "IPA", "Entity"],
    sources: [],
  },
  {
    term: "FQHC",
    expansion: "Federally Qualified Health Center",
    short: "A community health center that receives federal funding to serve underserved areas, regardless of a patient's ability to pay.",
    explanation:
      "FQHCs are paid under special Medicare and Medicaid payment systems rather than the standard fee schedule, and report their own quality measures. Many serve large Medicaid and uninsured populations.",
    topics: ["care-organizations"],
    seeAlso: ["Medicaid", "Medical group"],
    sources: [],
  },
  {
    term: "VBC enabler",
    short: "A company that helps independent practices take on value-based risk by providing technology, analytics, capital and scale.",
    explanation:
      "Aledade, agilon health and Privia are well-known examples. Their models differ, for example in who forms and holds the ACO or Medicare Advantage contract, so check each before assuming how contracts and data flow.",
    topics: ["care-organizations"],
    seeAlso: ["ACO", "MSO", "IPA"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "PCMH",
    expansion: "Patient-Centered Medical Home",
    short: "A primary care model built around a care team, access, coordination and quality improvement.",
    explanation:
      "Practices can earn recognition for it from bodies such as NCQA. Some payers pay extra to recognized practices, and the model overlaps with what value-based contracts expect of primary care.",
    topics: ["care-organizations", "quality-and-stars"],
    seeAlso: ["NCQA", "Medical group"],
    sources: [],
  },
  {
    term: "MCO",
    expansion: "Managed Care Organization",
    short: "An insurer that a state pays a fixed amount per member to manage Medicaid care.",
    explanation:
      "It is a type of payer, with its own networks, quality measures and contracts. MCO and MSO are unrelated, despite the similar acronyms.",
    topics: ["insurance-models", "care-organizations"],
    seeAlso: ["Medicaid", "MSO", "Capitation"],
    sources: [NAVINA_VBC_VOCAB],
  },

  // ── Insurance models ─────────────────────────────────────────────────────
  {
    term: "Payer",
    short: "The organization that pays for care: Medicare, a Medicare Advantage plan, a Medicaid plan or a commercial insurer.",
    explanation:
      "The payer decides coverage rules, payment rates and which quality measures apply. It is also the source of claims data, which is why the payer type changes what data a provider group can see.",
    topics: ["insurance-models"],
    seeAlso: ["Medicare", "Medicaid", "Commercial insurance"],
    sources: [NAVINA_VBC_VOCAB],
  },
  {
    term: "Medicare",
    short: "The federal health insurance program for people 65 and older and some younger people with disabilities.",
    explanation:
      "Original Medicare has Part A (hospital), Part B (outpatient and physician) and Part D (drugs, sold through private plans). People can instead choose a private Medicare Advantage plan (Part C). CMS runs the program.",
    topics: ["insurance-models"],
    seeAlso: ["Medicare Advantage", "Original Medicare", "Medicaid"],
    sources: [KFF_MA_2026],
  },
  {
    term: "Original Medicare",
    expansion: "Traditional Medicare",
    short: "Medicare run directly by the federal government, paying providers fee-for-service.",
    explanation:
      "It covers Parts A and B. Patients can see any provider that accepts Medicare, and there is no annual cap on out-of-pocket costs, so many buy a Medigap policy. Medicare ACO programs such as MSSP apply to Original Medicare patients.",
    topics: ["insurance-models"],
    seeAlso: ["Medicare", "Medicare Advantage", "Medigap"],
    sources: [KFF_MA_PAYMENT],
  },
  {
    term: "Medigap",
    expansion: "Medicare supplement insurance",
    short: "A private policy sold to people in Original Medicare that covers some of the cost sharing.",
    explanation:
      "It pays things such as coinsurance and deductibles. It is not Medicare Advantage, and it is not sold on top of one. People sometimes confuse the two.",
    topics: ["insurance-models"],
    seeAlso: ["Original Medicare", "Medicare Advantage"],
    sources: [],
  },
  {
    term: "Medicaid",
    short: "Health coverage for people with low incomes, funded by federal and state governments and run by the states.",
    explanation:
      "It covers many children, parents, pregnant women, people with disabilities and low-income older adults. Eligibility, benefits and payment rates vary by state, and most enrollees receive care through managed care organizations.",
    topics: ["insurance-models"],
    seeAlso: ["MCO", "Dual eligible", "CHIP"],
    sources: [],
  },
  {
    term: "CHIP",
    expansion: "Children's Health Insurance Program",
    short: "Coverage for children in families that earn too much for Medicaid but cannot afford private insurance.",
    explanation:
      "It is funded jointly by the federal government and states and run by the states, which choose whether to operate it as part of Medicaid, as a separate program, or both.",
    topics: ["insurance-models"],
    seeAlso: ["Medicaid"],
    sources: [],
  },
  {
    term: "Dual eligible",
    short: "A person covered by both Medicare and Medicaid.",
    explanation:
      "'Full duals' get comprehensive Medicaid benefits too, while 'partial duals' get help with Medicare premiums and cost sharing only. Dual eligibles tend to have complex needs, and special plans for them are growing quickly.",
    topics: ["insurance-models"],
    seeAlso: ["Special Needs Plan", "Medicaid", "Medicare"],
    sources: [KFF_MA_2026],
  },
  {
    term: "Special Needs Plan",
    expansion: "SNP",
    short: "A Medicare Advantage plan limited to a defined group: dual eligibles, people with chronic conditions or people in institutions.",
    explanation:
      "The three types are D-SNP (dual eligible), C-SNP (chronic condition) and I-SNP (institutional). In 2026 about 23% of Medicare Advantage enrollees (8.2 million) were in an SNP, and SNPs accounted for most of the year's enrollment growth.",
    topics: ["insurance-models"],
    seeAlso: ["Dual eligible", "Medicare Advantage"],
    sources: [KFF_MA_2026],
  },
  {
    term: "Commercial insurance",
    short: "Coverage from employers or bought individually, as opposed to government programs.",
    explanation:
      "It includes employer plans and ACA marketplace plans. Value-based terms are negotiated contract by contract, so they vary far more than in Medicare.",
    topics: ["insurance-models"],
    seeAlso: ["Self-funded plan", "Payer"],
    sources: [],
  },
  {
    term: "Self-funded plan",
    expansion: "ASO, administrative services only",
    short: "An employer plan where the employer pays the claims itself and an insurer only administers it.",
    explanation:
      "The insurer's name is on the card, but the employer carries the financial risk. It is common among large employers, and it means the insurer may have limited room to offer a provider group a risk contract for those members.",
    topics: ["insurance-models"],
    seeAlso: ["Commercial insurance", "Payer"],
    sources: [],
  },
  {
    term: "Cost sharing",
    expansion: "Premium, deductible, copay, coinsurance",
    short: "What the patient pays: premium, deductible, copay and coinsurance.",
    explanation:
      "A premium is the monthly price of coverage. A deductible is what the patient pays before the plan starts paying. A copay is a fixed fee, and coinsurance is a percentage of the cost. An out-of-pocket maximum caps the year's total, and Medicare Advantage plans have one while Original Medicare does not.",
    topics: ["insurance-models"],
    seeAlso: ["Original Medicare", "Medicare Advantage"],
    sources: [KFF_MA_2026],
  },
  {
    term: "Prior authorization",
    short: "Approval a health plan requires before it will cover a service.",
    explanation:
      "It is meant to control cost and appropriateness but is a major source of delay and administrative work for practices. Federal rules are pushing plans to make decisions faster and to expose the process through standard APIs.",
    topics: ["insurance-models", "cms-and-regulation"],
    seeAlso: ["Payer", "Medicare Advantage"],
    sources: [],
  },
  {
    term: "Beneficiary",
    expansion: "Member, enrollee",
    short: "A person covered by a health insurance plan or program.",
    explanation:
      "'Beneficiary' is the CMS word for people in Medicare. Plans say 'member' or 'enrollee'. In Medicare ACO programs a beneficiary is 'assigned' or 'attributed' to the ACO, which is different from enrolling in a plan.",
    topics: ["insurance-models"],
    seeAlso: ["Attribution", "Medicare"],
    sources: [],
  },
];
