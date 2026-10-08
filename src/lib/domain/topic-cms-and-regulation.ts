import type { Topic } from "./types";

export const CMS_AND_REGULATION: Topic = {
  slug: "cms-and-regulation",
  title: "CMS and regulation",
  tagline: "The agencies, the annual rule cycle and the rules that change the economics.",
  summary:
    "CMS runs Medicare and sets most of the rules this industry follows. Each year it publishes payment rates, risk model changes, quality measures and program rules, and each of these can raise or cut revenue for plans and provider groups. Knowing the calendar and the main rules explains most of the 'why now' behind customer priorities.",
  status: "ready",
  concepts: [
    {
      title: "Who does what",
      body: "HHS is the federal department. CMS is the agency inside it that runs Medicare and works with states on Medicaid. CMS's Innovation Center (CMMI) designs experimental payment models. OIG investigates fraud and abuse, and OCR enforces HIPAA privacy.",
    },
    {
      title: "The annual Medicare Advantage cycle",
      body: "CMS publishes an Advance Notice of proposed payment changes in the winter and a final Rate Announcement by early April. Plans submit bids in June, and Star Ratings come out in the fall, before the annual enrollment period that starts October 15.",
    },
    {
      title: "Rules, not just rates",
      body: "Beyond payment rates, CMS issues yearly rules for Medicare Advantage and Part D, the Physician Fee Schedule (which also changes MSSP and MIPS) and hospital payments. Each is proposed in the spring or summer and finalized later in the year.",
    },
    {
      title: "Interoperability and prior authorization",
      body: "A 2024 rule (CMS-0057-F) requires many payers to make prior authorization decisions faster and to offer standard FHIR APIs. Decision timeframes started in 2026 and the APIs are due in 2027.",
    },
    {
      title: "Privacy and data rules",
      body: "HIPAA governs how patient information is used and shared. Vendors that handle it for a provider are 'business associates' and sign agreements. A separate law bans 'information blocking', which means unreasonably withholding patient data.",
    },
    {
      title: "Fraud and abuse laws",
      body: "The False Claims Act, the Anti-Kickback Statute and the Stark law shape what organizations may do with billing, referrals and incentives. They are why documentation quality and audit risk are taken seriously.",
    },
  ],
  deepDive: [
    {
      heading: "The Medicare Advantage calendar",
      body: `1. **January to February: Advance Notice.** CMS proposes next year's payment changes, including the risk model, and takes comments.
2. **By early April: Rate Announcement.** CMS publishes final rates and policies for the coming year.
3. **First Monday of June: bids.** Plans submit what they expect to charge to cover an average patient.
4. **Summer to fall: rules and measures.** The annual MA and Part D rule and the Physician Fee Schedule are finalized.
5. **Early October: Star Ratings.** CMS publishes ratings for the following plan year.
6. **October 15 to December 7: annual enrollment.** Patients can change plans, with Star Ratings and benefits in front of them.
7. **January 1: new plan year.**

For a customer, the Rate Announcement sets next year's revenue pressure and the fall Star Ratings set their bonus status. Both land far from the work that drives them, which is done in the prior calendar year.`,
    },
    {
      heading: "What the 2027 Rate Announcement did",
      body: `Published April 6, 2026, the final 2027 announcement:

- Projects a **2.48% payment increase** to Medicare Advantage plans (over $13 billion), or **4.98%** once the expected rise in risk scores is counted.
- **Keeps the 2024 risk model (V28)** for 2027. CMS had proposed moving to a newer model calibrated on more recent data, and chose not to, to give the market more time to adjust.
- **Excludes diagnoses from audio-only encounters and from 'unlinked' chart reviews** when calculating risk scores. Unlinked chart review records are diagnoses found in a review that were not tied to a visit. There is an exception for patients who switch plans.
- Moves PACE organizations toward the same risk model as Medicare Advantage.

The pattern to notice is that CMS has been steadily tightening which diagnoses count. Documentation tied to a real visit is worth more each year.`,
    },
    {
      heading: "Interoperability and prior authorization (CMS-0057-F)",
      body: `The rule covers Medicare Advantage plans, state Medicaid and CHIP programs, Medicaid and CHIP managed care plans, and plans sold on the federally run ACA marketplace. In summary:

- **From January 2026:** most of these payers (marketplace plans are treated differently) must decide prior authorization requests within **72 hours** for urgent requests and **7 calendar days** for standard ones, and give a specific reason for denials.
- **From January 2027:** payers must offer FHIR APIs: a **Patient Access API** (now including prior authorization information), a **Provider Access API** so providers can pull a patient's data, a **Payer-to-Payer API** so data follows patients across plans, and a **Prior Authorization API**.

For provider groups this will make plan data easier to receive, but the rule does not require all the financial detail a group might want. Dates and requirements can change, so check the CMS page.`,
    },
    {
      heading: "Privacy, data sharing and security",
      body: `- **HIPAA** applies to health plans, most providers and clearinghouses ('covered entities') and to the companies that handle patient data for them ('business associates').
- A **business associate agreement (BAA)** is the contract that says what a vendor may do with the data. Using the minimum data necessary is a core principle.
- **Information blocking** rules (from the 21st Century Cures Act) prohibit providers, health IT developers and exchanges from unreasonably blocking access to electronic health information.
- **TEFCA** is a national framework for sharing data between health information networks.

Plans also impose their own contractual requirements, such as security reviews and location rules, on vendors that touch member data.`,
    },
    {
      heading: "Fraud and abuse laws, in plain terms",
      body: `- **False Claims Act:** penalizes knowingly submitting false claims to the government. Overstated diagnoses can trigger it, which is why risk adjustment audits matter.
- **Anti-Kickback Statute:** prohibits paying or receiving anything of value to induce referrals for federal program business.
- **Stark law:** restricts physicians from referring Medicare patients for certain services to entities they have a financial relationship with.
- **Fraud, waste and abuse (FWA):** the umbrella term for training and detection programs that plans require of their contractors.

These laws are the reason compliance language shows up in so many contracts and security questionnaires.`,
    },
  ],
  resources: [
    {
      title: "2027 Medicare Advantage and Part D Rate Announcement",
      url: "https://www.cms.gov/newsroom/fact-sheets/2027-medicare-advantage-part-d-rate-announcement",
      kind: "external",
      source: "CMS",
      note: "Final 2027 payment rates and risk adjustment policies.",
    },
    {
      title: "CMS Finalizes 2027 Medicare Advantage and Part D Payment Policies",
      url: "https://www.cms.gov/newsroom/press-releases/cms-finalizes-2027-medicare-advantage-part-d-payment-policies-strengthen-accountability-long-term",
      kind: "external",
      source: "CMS",
      note: "The press release summary.",
    },
    {
      title: "Contract Year 2027 Medicare Advantage and Part D Final Rule",
      url: "https://www.cms.gov/newsroom/fact-sheets/contract-year-2027-medicare-advantage-part-d-final-rule",
      kind: "external",
      source: "CMS",
      note: "Star Ratings and plan operations changes.",
    },
    {
      title: "CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F)",
      url: "https://www.cms.gov/initiatives/burden-reduction/overview/interoperability/policies-regulations/cms-interoperability-prior-authorization-final-rule-cms-0057-f",
      kind: "external",
      source: "CMS",
      note: "Requirements and compliance dates.",
    },
    {
      title: "Medicare Advantage Rates & Statistics",
      url: "https://www.cms.gov/medicare/payment/medicare-advantage-rates-statistics",
      kind: "external",
      source: "CMS",
      note: "Every Advance Notice and Rate Announcement, by year.",
    },
  ],
  related: ["risk-adjustment", "insurance-models", "data-and-interoperability", "quality-and-stars"],
};
