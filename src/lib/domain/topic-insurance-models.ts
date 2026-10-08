import type { Topic } from "./types";

export const INSURANCE_MODELS: Topic = {
  slug: "insurance-models",
  title: "Insurance models and payers",
  tagline: "Medicare, Medicare Advantage, Medicaid and commercial: who pays whom.",
  summary:
    "Every patient has a payer, and the payer type decides the rules, the data a provider can see and how the money flows. The four big groups are Traditional Medicare, Medicare Advantage, Medicaid and commercial insurance. Patients of the same clinic can be in all four.",
  status: "ready",
  concepts: [
    {
      title: "Original (Traditional) Medicare",
      body: "Run directly by the federal government for people 65 and older and some younger people with disabilities. Part A covers hospital stays, Part B covers doctors and outpatient care, and Part D covers drugs through private plans. Providers are paid fee-for-service.",
    },
    {
      title: "Medicare Advantage (Part C)",
      body: "A private plan replaces Original Medicare. CMS pays the plan a monthly risk-adjusted amount per member, and the plan pays providers. In 2026 about 55% of eligible Medicare beneficiaries (35.2 million of 64.2 million) were enrolled.",
    },
    {
      title: "Medicaid",
      body: "Health coverage for people with low incomes, funded jointly by the federal government and states and run by the states. Eligibility and benefits vary by state, and most enrollees receive care through managed care organizations (MCOs).",
    },
    {
      title: "Commercial insurance",
      body: "Coverage from employers or bought individually, including ACA marketplace plans. Large employers often self-fund, which means the employer pays claims and an insurer only administers the plan.",
    },
    {
      title: "Dual eligibles",
      body: "People covered by both Medicare and Medicaid. Special Needs Plans for dual eligibles (D-SNPs) coordinate both, and enrollment in special needs plans is growing faster than the rest of Medicare Advantage.",
    },
    {
      title: "Attribution vs. enrollment",
      body: "In a Medicare Advantage plan a patient chooses to enroll. In an ACO program, patients are attributed to the ACO by where they get their primary care, without being asked, and keep full freedom to see any provider.",
    },
  ],
  deepDive: [
    {
      heading: "Medicare, part by part",
      body: `- **Part A** covers inpatient hospital stays, skilled nursing facility care after a hospital stay, hospice and some home health. Most people pay no premium.
- **Part B** covers physician services, outpatient care, preventive services and some equipment. It carries a premium and a deductible, and the patient typically pays 20% coinsurance with no annual cap on out-of-pocket spending in Original Medicare.
- **Part C (Medicare Advantage)** bundles A and B (and usually D) into a private plan, with an annual out-of-pocket maximum and often extra benefits such as dental or vision.
- **Part D** covers prescription drugs, sold as a standalone drug plan or inside a Medicare Advantage plan.
- **Medigap** is a private supplemental policy sold to people in Original Medicare that covers some cost sharing. It is not Medicare Advantage, and it cannot be combined with it.

The terms "Medicare" and "Medicare Advantage" are often used as if they were two separate things. Medicare Advantage is a way of getting Medicare.`,
    },
    {
      heading: "How Medicare Advantage plans are paid",
      body: `1. Each year every plan submits a **bid**: its estimate of the cost to cover an average Medicare patient in its area.
2. CMS compares the bid to a county **benchmark**. If the bid is below the benchmark, the difference is partly returned to the plan as a **rebate** that must be spent on extra benefits or lower premiums.
3. Each member's payment is adjusted by their **risk score**, so sicker members bring in more.
4. Benchmarks are raised for plans rated four stars or more (the **quality bonus**), and a better rating also raises the rebate share.
5. The plan pays providers, by fee-for-service or by contracts that share risk, such as capitation.

The result is that a plan's income depends on its members' risk scores and its Star Rating, both of which depend on what providers document and do. That is why plans send gap lists, chart requests and documentation guidance to the practices they contract with.

The market is concentrated: in 2026 UnitedHealth Group had about 26% of Medicare Advantage enrollment and Humana about 20%, together nearly half.`,
    },
    {
      heading: "Medicaid and managed care",
      body: `States run Medicaid within federal rules, so benefits, eligibility and payment rates differ across the country. Most states pay private **managed care organizations (MCOs)** a fixed amount per member to manage care, which makes Medicaid MCOs payers with their own quality measures and contracts. Children's coverage often comes through Medicaid or CHIP (Children's Health Insurance Program).

People covered by both Medicare and Medicaid ("dual eligibles") are among the most complex and costly patients, and plans built for them are among the fastest-growing in Medicare Advantage.`,
    },
    {
      heading: "Commercial insurance",
      body: `- **Fully insured:** the employer buys a plan, and the insurer carries the risk.
- **Self-funded (ASO):** the employer carries the risk and pays claims, and an insurer or third-party administrator runs the plan for a fee. Common among large employers.
- **ACA marketplace plans:** individual coverage with its own risk adjustment model (HHS-HCC).

Commercial value-based contracts are negotiated one at a time, so terms and data vary far more than in Medicare. Many patients in a typical primary care practice are in fee-for-service commercial plans with no risk-based component.`,
    },
    {
      heading: "Why payer type matters to a provider group",
      body: `Payer type decides what a group can do and what it can see:

- **Original Medicare + an ACO program:** the ACO receives standardized claims files for its attributed patients, but the practices inside the ACO may not.
- **Medicare Advantage:** data comes from each plan in its own formats today. Federal rules require plans to offer standardized provider APIs, starting in 2027, but the financial data in them is limited.
- **Medicaid and commercial:** terms are set by the state or the contract, so data varies the most.

So the same clinic often has complete data for one slice of its patients and almost none for another. A useful first question with any customer is which payers and programs they are in, and for each, who receives the data.`,
    },
    {
      heading: "Cost-sharing words you will hear",
      body: `- **Premium:** the monthly price of coverage.
- **Deductible:** what the patient pays before the plan starts to pay.
- **Copay:** a fixed fee for a service. **Coinsurance:** a percentage of the cost.
- **Out-of-pocket maximum:** the yearly cap on what the patient pays (Medicare Advantage plans have one, Original Medicare does not).
- **Network:** the providers a plan covers. In-network care costs the patient less.
- **Prior authorization:** approval a plan requires before covering a service.
- **Formulary:** the list of drugs a plan covers.`,
    },
  ],
  resources: [
    {
      title: "Medicare Advantage in 2026: Enrollment Update and Key Trends",
      url: "https://www.kff.org/medicare/medicare-advantage-in-2026-enrollment-update-and-key-trends/",
      kind: "external",
      source: "KFF",
      note: "Enrollment, market share and special needs plan growth.",
    },
    {
      title: "How Medicare Pays Medicare Advantage Plans: Issues and Policy Options",
      url: "https://www.kff.org/medicare/how-medicare-pays-medicare-advantage-plans-issues-and-policy-options/",
      kind: "external",
      source: "KFF",
      note: "A clear walk through benchmarks, bids, rebates and risk adjustment.",
    },
    {
      title: "Medicare Advantage in 2026: Premiums, Out-of-Pocket Limits, Supplemental Benefits, and Prior Authorization",
      url: "https://www.kff.org/medicare/medicare-advantage-in-2026-premiums-out-of-pocket-limits-supplemental-benefits-and-prior-authorization/",
      kind: "external",
      source: "KFF",
      note: "What the plans offer patients and what they require of providers.",
    },
    {
      title: "VBC Vocabulary and the Entity Hierarchy",
      url: "https://app.notion.com/p/39d31faa1fb780738decd35c7ea923b7",
      kind: "internal",
      source: "Notion · Cost & Utilization",
      note: "See the data-access section for how payer type changes what data is available.",
    },
  ],
  related: ["vbc-fundamentals", "care-organizations", "risk-adjustment", "cms-and-regulation"],
};
