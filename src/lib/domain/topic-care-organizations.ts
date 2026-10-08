import type { Topic } from "./types";

export const CARE_ORGANIZATIONS: Topic = {
  slug: "care-organizations",
  title: "Care organizations",
  tagline: "ACO, IPA, CIN, MSO: who they are and who signs the risk contract.",
  summary:
    "Primary care is delivered through many kinds of organizations, and the acronyms overlap. What matters most is a simple question: who signed the risk contract with the payer, and who only provides services? This topic explains the main organization types and the levels from payer down to patient.",
  status: "ready",
  concepts: [
    {
      title: "Entity vs. service provider",
      body: "The entity is the organization that signed the risk contract with a payer and receives its data. A practice or group can be inside an entity, or can be the entity itself. Many organizations are one or the other, and some are both.",
    },
    {
      title: "ACO",
      body: "An Accountable Care Organization is a group of providers that agrees to be accountable for the cost and quality of care for a defined group of patients. In Medicare, ACOs contract with CMS (for example through MSSP). The term is also used loosely for private-payer arrangements.",
    },
    {
      title: "IPA and CIN",
      body: "An Independent Practice Association lets independent practices negotiate payer contracts together, often taking capitation as a group. A Clinically Integrated Network, often anchored by a hospital, does the same while meeting the clinical integration rules that keep joint contracting legal.",
    },
    {
      title: "MSO",
      body: "A Management Services Organization provides the back office for practices: billing, IT, coding, contracting and vendor management. It does not deliver care itself and, by definition, does not hold a risk contract, although it may support practices that do.",
    },
    {
      title: "Medical groups and health systems",
      body: "A medical group is physicians practicing together under one organization. A health system owns hospitals and often employs physicians. Both can hold risk contracts directly or join an ACO or IPA.",
    },
    {
      title: "VBC enablers",
      body: "Companies such as Aledade, agilon health and Privia help independent practices take on risk by providing technology, analytics, capital and contracting scale. Their models differ, so check how each holds contracts before assuming.",
    },
  ],
  deepDive: [
    {
      heading: "The hierarchy, from payer to patient",
      body: `Reading a value-based arrangement from the top down:

1. **Payer.** Who pays for care: CMS for Traditional Medicare, a Medicare Advantage plan (such as Humana or UnitedHealthcare), a Medicaid plan, or a commercial plan.
2. **Program.** The payment arrangement between the payer and an entity. CMS publishes its programs (MSSP, ACO REACH and its successor LEAD). Private payers negotiate contracts that fill the same slot.
3. **Entity.** The organization that signed the risk contract. This is where patients are attributed, where savings or losses are settled, and where data feeds are granted.
4. **Participant practice (TIN).** A practice or medical group inside the entity, identified by its Tax Identification Number.
5. **Clinic (care site).** A physical location of a practice.
6. **Provider (NPI).** An individual clinician, identified by a National Provider Identifier.
7. **Patient.** The attributed person.

Two relationships are worth naming. The link between the payer and the entity is the **program**. The link between the entity and a practice is **membership**.`,
    },
    {
      heading: "When one organization fills two slots",
      body: `Take a medical group that has two books of business:

- **Traditional Medicare:** the group joins an ACO run by another organization. The ACO is the entity, and the group is a participant. CMS data about the group's patients goes to the ACO.
- **Medicare Advantage:** the group holds a full-risk contract directly with a plan. The group is the entity, and the data goes straight to it.

Same group, two different positions. This is why the first useful question about any organization is not "what type are you?" but "who do you contract with, and who receives the data feeds?"

IPAs, CINs and VBC enablers can hold a Medicare Advantage contract on behalf of practices, so an intermediary can exist on the private side too. Do not assume.`,
    },
    {
      heading: "Organization types in one place",
      body: `**Provider side**

- **ACO:** a legal entity that contracts for accountability on behalf of its member practices. It is an entity by definition.
- **IPA:** independent practices contracting together with payers, often with capitation. Usually an entity.
- **CIN:** a hospital-anchored network that lets independent providers contract jointly. Usually an entity.
- **MSO:** the administrative layer for practices. Not an entity by definition.
- **Medical group:** physicians practicing together, which may be an entity, a participant, or both.
- **Health system:** hospitals plus employed and affiliated physicians.
- **FQHC (Federally Qualified Health Center):** community health centers that receive federal funding to serve underserved areas regardless of a patient's ability to pay. They are paid under special Medicare and Medicaid rates.

**Payer side**

- **Managed Care Organization (MCO):** an insurer that a state pays to manage Medicaid care. It is a payer, and it has nothing to do with an MSO, despite the similar acronym.
- **Medicare Advantage plan:** a private insurer running Medicare Part C. CMS pays the plan, and the plan pays providers.

**Regulator**

- **CMS** runs Medicare. Its Innovation Center (CMMI) designs the experimental payment programs.`,
    },
    {
      heading: "Why ownership structure varies by state",
      body: `Some states restrict who may employ physicians (the "corporate practice of medicine" rule). In those states a management company often cannot own a medical practice directly. The usual structure is a physician-owned professional corporation that delivers care, with an MSO providing management services under contract. This is one reason an MSO and the practices it serves can look like a single organization from outside but are legally separate.`,
    },
    {
      heading: "What a practice's size means in practice",
      body: `- **Small independent practices** typically need an ACO, IPA or enabler to get the scale value-based contracts require. MSSP, for example, generally needs 5,000 attributed patients.
- **Large groups and health systems** may hold contracts directly and have analytics, coding and quality teams.
- **Enterprise organizations** may operate several entities, in several states and programs, at once. Cost and quality results then need to be read per entity and program, not as one number.`,
    },
  ],
  resources: [
    {
      title: "VBC Vocabulary and the Entity Hierarchy",
      url: "https://app.notion.com/p/39d31faa1fb780738decd35c7ea923b7",
      kind: "internal",
      source: "Notion · Cost & Utilization",
      note: "Navina's research view of the hierarchy, with a worked example. More technical.",
    },
    {
      title: "2026 Medicare Accountable Care Organization Initiatives Participation Highlights",
      url: "https://www.cms.gov/newsroom/fact-sheets/2026-medicare-accountable-care-organization-initiatives-participation-highlights",
      kind: "external",
      source: "CMS",
      note: "How many ACOs participate in each Medicare program.",
    },
    {
      title: "ACO REACH vs. MSSP explained",
      url: "https://aledade.com/value-based-care-resources/guides/compare-aco-reach-mssp/",
      kind: "external",
      source: "Aledade",
      note: "A practice-side view of the choice between programs. Written by an ACO operator.",
    },
  ],
  related: ["vbc-fundamentals", "insurance-models", "data-and-interoperability"],
};
