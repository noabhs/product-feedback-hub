import type { Topic } from "./types";

export const DATA_AND_INTEROPERABILITY: Topic = {
  slug: "data-and-interoperability",
  title: "Data and interoperability",
  tagline: "EHRs, claims, identifiers and the standards that move data between them.",
  summary:
    "Healthcare data is spread across many systems that were not built to talk to each other: the practice's EHR, the payers' claims, hospitals, labs and pharmacies. Each source answers a different question and has its own gaps. This topic covers the main sources, the identifiers that link them, and the standards that move data between them.",
  status: "ready",
  concepts: [
    {
      title: "EHR data: clinical detail",
      body: "The electronic health record holds notes, diagnoses, medications, labs and vitals for patients seen at the practice. It is rich in clinical detail, and it only covers care delivered or recorded there. It has little cost information.",
    },
    {
      title: "Claims data: cost and utilization",
      body: "Claims are the bills sent to payers. They show everything a patient used, from any provider, with the price. They arrive weeks to months late and carry diagnosis codes, not clinical detail such as lab values.",
    },
    {
      title: "ADT feeds: real-time events",
      body: "Admit, Discharge, Transfer messages tell a practice almost immediately when a patient enters or leaves a hospital or ED. They are the fastest signal for follow-up, and carry no clinical detail.",
    },
    {
      title: "Identifiers link the data",
      body: "A patient is matched across systems by IDs such as the Medicare number (MBI) or the practice's record number (MRN). Clinicians and practices are matched by NPI and TIN. Poor matching is one of the biggest practical problems.",
    },
    {
      title: "Standards make exchange possible",
      body: "HL7 v2 and C-CDA are older message and document formats. FHIR is the modern web-API standard. Terminologies such as ICD-10, SNOMED and LOINC make sure 'diabetes' or 'HbA1c' means the same thing everywhere.",
    },
    {
      title: "Payer type decides what you get",
      body: "Original Medicare data reaches ACOs through standard files and APIs. Medicare Advantage and commercial data arrives in each payer's own formats. This is why the same practice can see one group of its patients completely and another barely.",
    },
  ],
  deepDive: [
    {
      heading: "Which source answers which question",
      body: `- **What is this patient's blood pressure, labs and medications?** The EHR.
- **What did the patient's care cost, and where did they go?** Claims.
- **Was my patient admitted to a hospital last night?** An ADT feed.
- **What happened at a hospital or specialist outside my system?** A health information exchange (HIE), or claims later.
- **What drugs did the patient actually fill?** Pharmacy claims or a fill-history network.
- **Which patients am I responsible for?** The payer's attribution or roster file.

No single source covers everything, which is the root of most data projects in this industry. Joining them is hard because they identify patients differently and arrive on different schedules.`,
    },
    {
      heading: "The identifiers you will meet",
      body: `- **MBI (Medicare Beneficiary Identifier):** the ID on a patient's Medicare card, and the main key for matching a Medicare claim to an EHR patient. It replaced the Social Security-based number.
- **MRN (medical record number):** the patient ID inside one practice or hospital's EHR.
- **NPI (National Provider Identifier):** identifies an individual clinician or an organization. It is the provider identifier claims reliably carry.
- **TIN (Taxpayer Identification Number):** identifies a practice or group for billing and for ACO membership.
- **Payer member ID:** the ID a health plan assigns, different for each plan.

A patient seen in three systems can have three IDs, so records are linked with a master patient index or matching on name, date of birth and other fields. Mismatches create duplicates or missed records.`,
    },
    {
      heading: "Medicare claims for ACOs: CCLF and BCDA",
      body: `Medicare shares claims with ACOs for their attributed patients, in two ways that carry similar content:

- **CCLF (Claim and Claim Line Feed):** monthly files of adjudicated claims in a fixed-width flat-file layout, pushed to the ACO. You decode them with CMS's record layout. They are typically available to Medicare Shared Savings Program ACOs.
- **BCDA (Beneficiary Claims Data API):** the same kind of data through an API in FHIR format. Adjudicated claims update weekly and partially adjudicated claims daily. It covers Medicare Parts A, B and D.

Access is tied to the ACO entity's credentials, and the data covers **Traditional Medicare only**. Medicare Advantage claims are not in these feeds, and neither are most commercial claims. A practice that sits inside an ACO may or may not receive the data from it, which has to be negotiated.`,
    },
    {
      heading: "Medicare Advantage and commercial data",
      body: `Plans send claims, rosters and gap lists in their own formats, usually by secure file transfer, a portal or email, and the layout differs from plan to plan. This is where the scale problem lives: each new payer is a new integration.

Federal rules are starting to change this. From 2027 many plans must offer standard FHIR APIs (see CMS and regulation). The mandated content is narrower than a full claims feed, so file-based exchange is likely to continue for some time.`,
    },
    {
      heading: "ADT and health information exchange",
      body: `- **ADT messages** use the HL7 v2 format. Common types: **A01** admit, **A03** discharge, **A04** register (often an ED visit), **A08** update patient information. Hospitals send them to subscribers, which can include a practice or a data network.
- **HIE (health information exchange)** moves clinical records between organizations. The largest networks are Carequality, CommonWell and eHealth Exchange. They can surface records from outside facilities when a patient is seen elsewhere.
- **TEFCA** is a national framework meant to connect these networks so one connection reaches many.

Quality of ADT and HIE feeds varies a lot: delays, missing messages and unmatched patients are common, so check how reliable a feed is before building a workflow on it.`,
    },
    {
      heading: "Standards and code sets",
      body: `**Exchange formats**

- **HL7 v2:** older pipe-delimited messages, still the workhorse for ADT and labs.
- **C-CDA:** XML clinical documents such as visit summaries.
- **FHIR:** a modern standard where data are 'resources' (Patient, Observation, Claim) in JSON, served by APIs. A claim in FHIR is called an ExplanationOfBenefit.
- **SMART on FHIR:** a way for apps to launch inside an EHR and use its data securely. Epic uses it for embedded apps.

**Code sets**

- **ICD-10-CM:** diagnoses. **CPT** and **HCPCS:** procedures and services. **CPT II:** quality result codes.
- **SNOMED CT:** a detailed clinical vocabulary for conditions. **LOINC:** labs and observations.
- **RxNorm, NDC and ATC:** drugs. RxNorm normalizes names, NDC identifies each product package, ATC groups drugs by what they treat.
- **CVX:** vaccines.

Mapping between these (for example SNOMED to ICD-10) is a major task, since they were designed for different purposes.`,
    },
    {
      heading: "EHR vendors",
      body: `Practices run on a handful of EHR vendors, and which one a customer uses shapes how data can be read and how a tool can be embedded. Common ones are Epic, athenahealth, eClinicalWorks, Oracle Health (Cerner) and NextGen. Integration styles differ: some offer modern APIs, others require more indirect methods, which affects speed and reliability.`,
    },
  ],
  resources: [
    {
      title: "VBC Vocabulary and the Entity Hierarchy",
      url: "https://app.notion.com/p/39d31faa1fb780738decd35c7ea923b7",
      kind: "internal",
      source: "Notion · Cost & Utilization",
      note: "Section 5 maps payer type against what data a group can get.",
    },
    {
      title: "Risk Glossary: Terms & Acronyms",
      url: "https://app.notion.com/p/3c031faa1fb781c39d4fe98cf229dcd6",
      kind: "internal",
      source: "Notion · Product / Risk",
      note: "EHR integration terms (HIE, SMART on FHIR) as Navina uses them.",
    },
    {
      title: "Beneficiary Claims Data API (BCDA)",
      url: "https://bcda.cms.gov/",
      kind: "external",
      source: "CMS",
      note: "Official documentation for the Medicare claims API.",
    },
    {
      title: "Comparison of BCDA and CCLF Files",
      url: "https://bcda.cms.gov/bcda-data/comparison-bcda-cclf-files.html",
      kind: "external",
      source: "CMS",
      note: "How the two Medicare claims feeds differ.",
    },
    {
      title: "CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F)",
      url: "https://www.cms.gov/initiatives/burden-reduction/overview/interoperability/policies-regulations/cms-interoperability-prior-authorization-final-rule-cms-0057-f",
      kind: "external",
      source: "CMS",
      note: "The payer API requirements starting 2027.",
    },
  ],
  related: ["utilization-and-cost", "cms-and-regulation", "insurance-models"],
};
