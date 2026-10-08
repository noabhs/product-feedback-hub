import type { Topic } from "./types";

export const UTILIZATION_AND_COST: Topic = {
  slug: "utilization-and-cost",
  title: "Utilization and cost",
  tagline: "Admissions, ED visits, readmissions and total cost of care.",
  summary:
    "In value-based contracts, the cost of every service a patient receives counts against the group, wherever the care happens. Utilization is how much care patients use: hospital stays, emergency visits, specialist visits, drugs. A few patients and a few kinds of events drive most of the spending, so the work is finding those patients early and avoiding the events that were avoidable.",
  status: "ready",
  concepts: [
    {
      title: "Utilization",
      body: "The amount of care a population uses, usually counted per 1,000 patients so groups of different sizes can be compared. The headline measures are hospital admissions, emergency department (ED) visits and readmissions.",
    },
    {
      title: "Total cost of care",
      body: "Everything spent on a patient's care across all providers. A group in a value-based contract is judged on this total, including care it never sees, such as a hospital stay across town.",
    },
    {
      title: "A small group drives most of the cost",
      body: "In the US population, the top 5% of spenders account for about half of all health care spending (AHRQ's MEPS survey). Finding those patients, and the ones heading that way, is the core of cost management.",
    },
    {
      title: "Avoidable use",
      body: "Some admissions and ED visits could have been prevented with good outpatient care, such as a diabetes complication that a timely visit would have caught. They are the main target of utilization programs.",
    },
    {
      title: "Transitions of care",
      body: "The days after a hospital discharge are the riskiest. A prompt call, a medication check and a follow-up visit within days lower the chance of readmission, and Medicare pays for them with dedicated codes.",
    },
    {
      title: "Risk stratification",
      body: "Sorting patients by expected need or cost so the care team spends time where it helps most: the highest-risk patients, and those at 'rising risk' who are about to become high-cost.",
    },
  ],
  deepDive: [
    {
      heading: "The numbers people track",
      body: `- **Admissions per 1,000:** hospital inpatient stays per 1,000 patients per year. Often reported by month.
- **Bed days per 1,000:** total hospital days per 1,000 patients, which combines how often and how long.
- **Length of stay:** average days per admission.
- **ED visits per 1,000:** emergency visits, often split into those that led to admission and those that did not. A subset are considered avoidable.
- **30-day readmission rate:** the share of discharges followed by an unplanned readmission within 30 days.
- **Post-acute use:** skilled nursing facility (SNF), home health and rehab days after a hospital stay, which are a big and variable cost.
- **Cost per member per month (PMPM):** total allowed cost divided by member months, sliced by category (inpatient, outpatient, professional, pharmacy).

Compare each against a benchmark, and against the group's own trend, rather than reading a single number alone.`,
    },
    {
      heading: "Inpatient, observation and the ED",
      body: `A patient in a hospital bed is not always an inpatient. **Observation** is outpatient status used for short stays while the hospital decides whether to admit. The difference matters:

- It changes what the patient pays and how the stay counts in utilization measures.
- In Original Medicare, skilled nursing facility coverage after a hospital stay requires a qualifying **three-day inpatient stay**, and observation days do not count. Many Medicare Advantage plans waive this rule.
- Measures such as readmissions look at inpatient stays, so a stay's status shapes the data.

An ED visit can end in discharge, observation or admission. The same patient event can appear in claims as several lines, which is one reason raw counts need care.`,
    },
    {
      heading: "Readmissions",
      body: `A readmission is an unplanned return to the hospital within a window, usually 30 days. It is used as a quality signal because many are linked to gaps in discharge planning or follow-up.

- **For hospitals:** Medicare's Hospital Readmissions Reduction Program (HRRP) cuts payment to hospitals with higher-than-expected readmissions, by up to 3%. The measures have historically covered heart attack, heart failure, pneumonia, COPD and hip and knee replacement.
- **For plans:** Plan All-Cause Readmissions is a Star Ratings measure with an outcome weight of 3 in the 2027 Star Ratings.
- **For ACOs and groups:** readmissions are costly events that count against total cost of care.`,
    },
    {
      heading: "The days after discharge",
      body: `A strong transition has the same elements everywhere:

1. The practice learns of the admission and discharge quickly, usually through an **ADT feed** (admit, discharge, transfer notifications) or a hospital call.
2. Someone contacts the patient or caregiver, medications are reconciled, and the next steps are explained.
3. The patient has a follow-up visit soon after discharge.

Medicare pays for this with **Transitional Care Management (TCM)** codes. Both require contact with the patient within 2 business days of discharge. CPT 99495 needs at least moderate-complexity decision-making and a face-to-face visit within 14 days. CPT 99496 needs high-complexity decision-making and a visit within 7 days. Only one practitioner can bill TCM for a given discharge.

Missing the 2-day contact window is one of the most common reasons a transition falls apart.`,
    },
    {
      heading: "Care management programs",
      body: `Programs aim to keep patients out of the hospital and improve control of chronic conditions:

- **Chronic Care Management (CCM)** is a Medicare service for patients with two or more chronic conditions, delivered by the care team between visits, with monthly time requirements.
- **Principal Care Management** is similar but focused on one serious condition.
- **Complex case management** gives intensive support to a small set of very high-risk patients.
- **Outreach campaigns** target a defined group, for example patients who missed a follow-up after discharge, or who have uncontrolled diabetes.

Programs work best when the patients are chosen by data (risk stratification) and when outreach is realistic about how many patients one care manager can serve.`,
    },
    {
      heading: "Reading cost data",
      body: `- **Allowed amount** is what the payer decides a service is worth, and is the standard cost number. It is not the billed charge. A claim's billed amount is larger than the allowed amount, which is split between the payer and the patient's cost sharing.
- **Claims lag.** Claims arrive weeks to months after care, so recent months look artificially low until the claims run out. Estimates of unreported claims (IBNR) fill the gap.
- **Shadow spend.** Hospital, specialist and pharmacy spending for the group's patients that the group's own systems never see. It is a large share of total cost, and it exists only in the payer's data.
- **Attribution vs. site of service.** 'Cost per clinic' means the cost of patients attributed through that clinic's clinicians, not money spent at that clinic. Keep the two ideas apart in any analysis.
- **Network leakage.** Care delivered outside the preferred network, often more costly.

The main practical point: cost data comes from payers, so the payer mix decides how much of it a group can see. See Data and interoperability.`,
    },
  ],
  resources: [
    {
      title: "VBC Vocabulary and the Entity Hierarchy",
      url: "https://app.notion.com/p/39d31faa1fb780738decd35c7ea923b7",
      kind: "internal",
      source: "Notion · Cost & Utilization",
      note: "Sections 1 and 4 explain allowed amounts, attribution and shadow spend in Navina's terms.",
    },
    {
      title: "Concentration of Healthcare Expenditures, 2018–2022",
      url: "https://meps.ahrq.gov/data_files/publications/st560/stat560.shtml",
      kind: "external",
      source: "AHRQ",
      note: "The source for how concentrated health spending is.",
    },
    {
      title: "Hospital Readmissions Reduction Program",
      url: "https://www.cms.gov/medicare/payment/prospective-payment-systems/acute-inpatient-pps/hospital-readmissions-reduction-program-hrrp",
      kind: "external",
      source: "CMS",
      note: "How Medicare penalizes hospital readmissions.",
    },
    {
      title: "Transitional Care Management Services (MLN)",
      url: "https://www.cms.gov/files/document/mln908628-transitional-care-management-services.pdf",
      kind: "external",
      source: "CMS",
      note: "The official billing and documentation rules for TCM.",
    },
    {
      title: "Chronic Care Management Services (MLN)",
      url: "https://www.cms.gov/files/document/chroniccaremanagement.pdf",
      kind: "external",
      source: "CMS",
      note: "Requirements for billing Chronic Care Management.",
    },
  ],
  related: ["vbc-fundamentals", "quality-and-stars", "data-and-interoperability", "clinic-roles"],
};
