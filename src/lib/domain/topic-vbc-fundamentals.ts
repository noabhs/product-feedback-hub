import type { Topic } from "./types";

export const VBC_FUNDAMENTALS: Topic = {
  slug: "vbc-fundamentals",
  title: "VBC fundamentals",
  tagline: "How payment moves from volume to value, and who carries the risk.",
  summary:
    "Fee-for-service pays for each visit and test, so more services mean more revenue. Value-based care (VBC) ties payment to the cost and quality of care for a defined group of patients. The more financial risk a group takes on, the more it can earn by keeping people healthy and out of the hospital, and the more it can lose if costs run over.",
  status: "ready",
  concepts: [
    {
      title: "A spectrum, not a switch",
      body: "Payment models run from pure fee-for-service, through bonuses for quality, to sharing savings, to sharing losses, to a fixed payment per patient (capitation). Most organizations sit at several points at once, with different payers.",
    },
    {
      title: "The benchmark",
      body: "In shared savings programs, CMS or a payer sets a spending target for the group's patients. Spending below the target creates savings, and spending above it creates losses (if the group carries downside risk).",
    },
    {
      title: "Attribution",
      body: "Patients are assigned to a group, usually by where they get most of their primary care. The group is then accountable for their total cost, wherever the care happens, even though patients keep full freedom to see any provider.",
    },
    {
      title: "Upside vs. downside risk",
      body: "Upside-only (one-sided) risk lets a group share in savings but never pay back overspending. Two-sided (downside) risk adds shared losses. Higher risk comes with a higher share of the savings.",
    },
    {
      title: "Quality is a gate",
      body: "Most programs require a minimum quality score before any savings are shared, and quality performance often sets how much of the savings the group keeps. Cost and quality are paid for together.",
    },
    {
      title: "Capitation",
      body: "Under capitation the payer pays a fixed amount per patient per month, and the group is responsible for the care. It is the far end of the spectrum and is common in Medicare Advantage contracts with medical groups.",
    },
  ],
  deepDive: [
    {
      heading: "The payment spectrum (the LAN framework)",
      body: `The Health Care Payment Learning & Action Network (LAN) groups payment models into four categories, which is the common way to talk about the spectrum:

1. **Category 1: fee-for-service with no link to quality or value.**
2. **Category 2: fee-for-service with a link to quality or value.** Examples are pay-for-reporting and pay-for-performance bonuses.
3. **Category 3: alternative payment models built on fee-for-service.** Providers are still paid per service, but there is a shared savings or shared risk arrangement on top, or a bundled payment for an episode of care.
4. **Category 4: population-based payment.** A fixed amount for a population or condition, such as capitation.

When people say "moving to value-based care", they usually mean moving from categories 1 and 2 toward 3 and 4.`,
    },
    {
      heading: "How shared savings work, with an example",
      body: `Take a group with 10,000 attributed patients. The numbers below are made up to show the mechanics.

- **Benchmark:** the payer sets the expected spending at $12,000 per patient per year, adjusted for how sick the patients are (see risk adjustment). That is $120M for the group.
- **Actual spending:** the patients' care cost $114M, wherever it happened.
- **Savings:** $6M, or 5% below benchmark.
- **Minimum savings rate:** savings only count if they clear a threshold, for example 2%, so that small random swings are not rewarded.
- **Sharing rate:** the group keeps a share of the savings, for example 50%, scaled by its quality score. Here that would be up to $3M.
- **Losses:** with two-sided risk, spending of $126M would create a $6M loss, and the group would owe its share of it.

Three things make this harder than it looks: the group does not control where patients go for care, claims arrive months late, and a benchmark that looks fair at the start can become tight if costs rise faster than expected.`,
    },
    {
      heading: "Medicare programs for accountable care (as of 2026)",
      body: `**Medicare Shared Savings Program (MSSP)** is the largest. It had 511 ACOs and 12.6 million Traditional Medicare patients in 2026. ACOs choose a track:

- **BASIC track** is a glide path of five levels (A to E). Levels A and B are upside-only, with a maximum sharing rate of 40%. Levels C to E add downside risk, with up to 50% sharing.
- **ENHANCED track** is two-sided from the start, with a sharing rate up to 75%.
- MSSP generally requires at least 5,000 assigned patients.

**ACO REACH** had 74 ACOs and 1.7 million patients in 2026. It offers two risk options: *Professional* (50% of savings and losses) and *Global* (100%), with options for capitated payments. **ACO REACH ends at the end of 2026.**

**LEAD (Long-term Enhanced ACO Design)** replaces it from January 1, 2027, as a ten-year model running through 2036, with the same two risk options, prospective payments, an added payment for rural providers, and lower patient-count requirements for new and smaller ACOs. CMS had not published LEAD's risk adjustment method at announcement, so check for updates.

**Other models:** Kidney Care Choices (74 entities in 2026) and ACO Primary Care Flex (23 ACOs) are smaller programs for specific populations and payment designs.

Program names and rules change often. Check CMS's Innovation Center page before relying on a specific rule.`,
    },
    {
      heading: "Medicare Advantage and capitation",
      body: `Most value-based risk in Medicare Advantage (MA) works differently from ACO programs. CMS pays the MA plan a risk-adjusted monthly amount per member. The plan can then pass part of that to a medical group as a **capitation** payment, and the group takes responsibility for the members' care.

- **Partial capitation** covers some services (for example primary care only).
- **Full or global capitation** covers nearly all medical costs, and the group pays for specialists and hospital care out of its fixed payment.
- Contracts often include quality bonuses tied to Star Ratings, and risk adjustment is central, since the payment depends on the members' scores.

There is usually no intermediary like an ACO between the plan and the group, but independent practice associations (IPAs) and VBC enablers sometimes hold the contract on behalf of practices. See Care organizations.`,
    },
    {
      heading: "Why value-based care is hard to run",
      body: `- **Attribution is imperfect.** A group is accountable for patients it does not fully control.
- **Data arrives late.** Claims are often months behind, so a group can miss a cost problem until it is large.
- **Shadow spend.** Care the group's patients receive elsewhere (the hospital across town, a specialist outside the network) counts against the group, even though the group's own systems never see it.
- **Benchmarks reset.** Savings in year one can lower next year's target.
- **Several contracts at once.** A group often has a different program, different measures and different data for each payer.

These gaps are where tools that bring claims, EHR and quality data together matter.`,
    },
  ],
  resources: [
    {
      title: "VBC Vocabulary and the Entity Hierarchy",
      url: "https://app.notion.com/p/39d31faa1fb780738decd35c7ea923b7",
      kind: "internal",
      source: "Notion · Cost & Utilization",
      note: "Navina's research view of the terms and how the money and data flow. More technical.",
    },
    {
      title: "2026 Medicare Accountable Care Organization Initiatives Participation Highlights",
      url: "https://www.cms.gov/newsroom/fact-sheets/2026-medicare-accountable-care-organization-initiatives-participation-highlights",
      kind: "external",
      source: "CMS",
      note: "Numbers of ACOs and patients in each program.",
    },
    {
      title: "ACO Comparison: LEAD, ACO REACH, and Medicare Shared Savings Program",
      url: "https://www.cms.gov/priorities/innovation/files/aco-model-comparison.pdf",
      kind: "external",
      source: "CMS Innovation Center",
      note: "Side-by-side comparison of the three programs.",
    },
    {
      title: "Comparison of BASIC track and ENHANCED track",
      url: "https://www.cms.gov/Medicare/Medicare-Fee-for-Service-Payment/sharedsavingsprogram/Downloads/ssp-aco-participation-options.pdf",
      kind: "external",
      source: "CMS",
      note: "How the MSSP tracks differ on risk and sharing rates.",
    },
    {
      title: "Medicare unveils successor to ACO REACH",
      url: "https://www.healthcaredive.com/news/aco-lead-medicare-accountable-cms-reach-replacement/808356/",
      kind: "external",
      source: "Healthcare Dive",
      note: "A readable summary of what LEAD changes.",
    },
  ],
  related: ["care-organizations", "insurance-models", "risk-adjustment", "quality-and-stars"],
};
