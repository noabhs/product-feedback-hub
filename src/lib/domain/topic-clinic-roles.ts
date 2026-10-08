import type { Topic } from "./types";

export const CLINIC_ROLES: Topic = {
  slug: "clinic-roles",
  title: "Clinic roles and workflows",
  tagline: "Who does what in a primary care practice, and how a visit flows.",
  summary:
    "A primary care practice is a team. The clinician sees the patient, but the visit is prepared by one person, documented by another, coded by a third, and followed up by a fourth. Each role touches quality and risk adjustment in a different way, and understanding who does what explains why a workflow succeeds or stalls.",
  status: "ready",
  concepts: [
    {
      title: "The clinician",
      body: "The primary care provider (PCP) examines the patient, makes the diagnoses and documents them. PCPs are physicians (MD or DO), nurse practitioners (NP) or physician assistants (PA). Only the clinician can diagnose, so every risk and quality workflow ends with one.",
    },
    {
      title: "The clinical support team",
      body: "Medical assistants (MAs) room patients, take vitals such as blood pressure, and often run screenings and vaccines. Nurses handle triage, medication questions and procedures. These steps produce much of the evidence quality measures need.",
    },
    {
      title: "Care management",
      body: "Care managers and coordinators work between visits: following up after hospital discharge, helping patients with chronic conditions, arranging referrals, and calling people with open care gaps.",
    },
    {
      title: "Coding and documentation",
      body: "Medical coders turn the clinical note into diagnosis and procedure codes for claims. In value-based practices they also review charts ahead of visits to find conditions that need to be evaluated and documented again.",
    },
    {
      title: "Quality and population health",
      body: "Quality staff track measures, work gap lists from payers and make sure results are recorded where payers can find them. Population health leaders set priorities and report performance.",
    },
    {
      title: "Practice leadership",
      body: "Practice managers run operations and schedules, medical directors set clinical standards, and VBC or ACO leaders watch contract performance and decide where to invest effort.",
    },
  ],
  deepDive: [
    {
      heading: "Roles and what they touch",
      body: `**Clinical**

- **Physician (MD, DO):** leads care, diagnoses, prescribes, documents. In a value-based group often also medical director or champion for a program.
- **Nurse practitioner (NP) and physician assistant (PA):** see patients and diagnose, with the supervision rules of their state. Often a large share of primary care visits.
- **Registered nurse (RN) and licensed practical nurse (LPN):** triage, patient education, injections, care coordination.
- **Medical assistant (MA):** rooming, vitals, screenings, vaccines, chart preparation. Not related to Medicare Advantage, which shares the abbreviation.

**Care team**

- **Care manager:** usually an RN or social worker who supports patients with complex needs between visits.
- **Care coordinator:** handles scheduling, referrals and follow-up calls.
- **Community health worker and social worker:** help with housing, food, transportation and other social needs.
- **Behavioral health clinician:** screens for and treats depression and anxiety, often within the practice.
- **Clinical pharmacist:** reviews medications and helps with adherence.

**Risk and quality**

- **Medical coder / risk adjustment coder:** assigns codes and reviews charts. Many hold the certified risk adjustment coder (CRC) credential.
- **Clinical documentation improvement (CDI) specialist:** works with clinicians so notes are specific and complete.
- **Quality coordinator or nurse:** tracks care gaps and measures, and abstracts records for HEDIS review.

**Operations and leadership**

- **Front desk and scheduler:** book visits, including wellness visits and post-discharge follow-ups.
- **Biller and revenue cycle staff:** submit claims, handle denials and track payments.
- **Referral coordinator:** arranges specialist care and tracks that the patient went.
- **Scribe:** documents during the visit so the clinician can focus on the patient.
- **Practice or clinic manager, medical director, CMO and CMIO:** operations, clinical standards, and technology and information systems.
- **VBC, ACO or population health director:** owns contract performance across practices.`,
    },
    {
      heading: "How a visit flows",
      body: `1. **Before the visit.** The schedule is set. A coder or nurse may review the chart (**pre-visit planning**) to list open care gaps, conditions to re-evaluate and overdue tests.
2. **Rooming.** The MA takes vitals (the blood pressure recorded here feeds a quality measure), screens for depression or falls, and updates medications.
3. **The visit.** The clinician examines the patient, discusses chronic conditions, orders tests and writes the note, often in **SOAP** format (Subjective, Objective, Assessment, Plan). The **assessment** is where diagnoses are stated.
4. **Coding.** Diagnoses and services become codes. Quality results may be added through specific codes.
5. **Billing.** A claim goes through a clearinghouse to the payer. For a Medicare Advantage patient the diagnoses also feed the risk score.
6. **After the visit.** Orders are completed, referrals are tracked, and the care team follows up with patients who need it.
7. **Later.** The payer returns gap lists, remittances and audit requests, which come back to quality and billing staff.

Each step is a chance to lose evidence: a blood pressure recorded as free text, a result not entered, a diagnosis listed on the problem list but never evaluated at the visit.`,
    },
    {
      heading: "The visit types that matter in value-based care",
      body: `- **Annual Wellness Visit (AWV):** a yearly Medicare preventive visit. It closes several quality measures and is a good moment to review and document chronic conditions. It is not a full physical.
- **Transitional care visit:** a follow-up soon after hospital discharge, with required contact within 2 business days (see Utilization and cost).
- **Chronic condition visit:** the regular follow-up for diabetes, hypertension and similar conditions. The best place to document conditions for risk adjustment.
- **Sick visit:** acute problems. Often a missed chance to address care gaps because time is short.
- **Telehealth visit:** audio-video visits can support risk adjustment diagnoses, but diagnoses from audio-only visits are excluded from risk scores starting with 2027 payment.

Because patients may only visit once or twice a year, groups try to make each visit do double duty: close gaps and document chronic conditions together.`,
    },
    {
      heading: "A day in the life: three roles",
      body: `**Medical assistant.** Rooms eight to twelve patients a morning. Checks the care gap list on the schedule, takes blood pressure twice if the first is high, hands over a depression screening form, and flags that a patient is due for a vaccine. Their challenge is time, and recording values in the right place.

**Coder doing pre-visit review.** Opens tomorrow's schedule and the charts. For each patient, lists chronic conditions coded last year that have not been documented yet this year, and suspected conditions supported by medications or labs. Sends a short note to the clinician before the visit. Their challenge is volume and signal: too many prompts get ignored.

**Care manager.** Starts the day with a list of discharges since yesterday. Calls each patient within two business days, checks medications, books a follow-up. Then works the list of patients with uncontrolled diabetes. Their challenge is knowing who to call first, and reaching them.

In each case a tool helps most by putting the right information in front of the person at the moment they need it.`,
    },
  ],
  resources: [
    {
      title: "Risk Glossary: Terms & Acronyms",
      url: "https://app.notion.com/p/3c031faa1fb781c39d4fe98cf229dcd6",
      kind: "internal",
      source: "Notion · Product / Risk",
      note: "Shows how these roles use Navina's Risk product.",
    },
    {
      title: "Intro to Quality (new-hire training)",
      url: "https://app.notion.com/p/3e231faa1fb78158a15be9a4ef602930",
      kind: "internal",
      source: "Notion · Delivery / Training",
      note: "Quality from the practice's point of view.",
    },
    {
      title: "Transitional Care Management Services (MLN)",
      url: "https://www.cms.gov/files/document/mln908628-transitional-care-management-services.pdf",
      kind: "external",
      source: "CMS",
      note: "What a practice must do to bill for post-discharge care.",
    },
    {
      title: "Chronic Care Management Services (MLN)",
      url: "https://www.cms.gov/files/document/chroniccaremanagement.pdf",
      kind: "external",
      source: "CMS",
      note: "How practices are paid for between-visit care.",
    },
  ],
  related: ["risk-adjustment", "quality-and-stars", "utilization-and-cost"],
};
