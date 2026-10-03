/**
 * One-off: run extractClaims() over hand-fetched EHR competitor documents
 * (fetched via Drive/Notion connectors, not the automated ingest pipeline)
 * and write the results to a CSV for review. No DB writes.
 */
import fs from "fs";
import path from "path";
import { extractClaims } from "@/lib/ingest/extract";

const DOCS_DIR = "/private/tmp/claude-502/-Users-noa-bhs-Documents-navina-insights-hub/6fe370b7-fbd7-435f-af6b-471b25f0a1e8/scratchpad/docs";
const OUT_CSV = "/private/tmp/claude-502/-Users-noa-bhs-Documents-navina-insights-hub/6fe370b7-fbd7-435f-af6b-471b25f0a1e8/scratchpad/ehr-competitor-claims.csv";

const MANIFEST: { competitor: string; title: string; file: string }[] = [
  { competitor: "Epic Systems", title: "Epic Systems — Internal Overview Deck", file: "epic_overview.txt" },
  { competitor: "Epic Systems", title: "Navina vs EHRs — Comparison (Epic)", file: "epic_battlecard_comparison.txt" },
  { competitor: "Epic Systems", title: "Discovery Questions for EHRs (Epic)", file: "epic_discovery_questions.txt" },
  { competitor: "Epic Systems", title: "Epic & Stanson — New OPA and CDI Functionality", file: "epic_stanson_opa_cdi.txt" },
  { competitor: "Epic Systems", title: "Epic — Notion Page", file: "epic_notion.txt" },
  { competitor: "Epic Systems", title: "Questions to ask EMR Vendor about Risk Adjustment.pdf", file: "epic_pdf_risk_adjustment_questions.txt" },
  { competitor: "Epic Systems", title: "Epic — Battle Card (draft)", file: "epic_battlecard_draft.txt" },
  { competitor: "Epic Systems", title: "Epic Competitive Notes", file: "epic_competitive_notes.txt" },
  { competitor: "Athenahealth", title: "Athenahealth — Internal Knowledge Base", file: "athena_overview.txt" },
  { competitor: "Athenahealth", title: "Athenahealth — Notion Page", file: "athena_notion.txt" },
  { competitor: "Athenahealth", title: "Athena Future Releases — Dec 2025", file: "athena_future_releases.txt" },
  { competitor: "eClinicalWorks", title: "eClinicalWorks — Notion Page", file: "ecw_notion.txt" },
  { competitor: "eClinicalWorks", title: "eClinicalWorks — Deep Dive / Company Overview Deck", file: "ecw_overview_deck.txt" },
  { competitor: "eClinicalWorks", title: "Where We Win — eClinicalWorks (Comparison Battlecard)", file: "ecw_comparison_battlecard.txt" },
  { competitor: "EHRs (general)", title: "Navina vs. Conventional EMRs — Quality", file: "ehr_quality_general.txt" },
  { competitor: "Veradigm", title: "Veradigm (Allscripts Pro) — December 2023", file: "veradigm_dec2023.txt" },
  { competitor: "Veradigm", title: "Navina vs. Veradigm Payer Analytics/Insights", file: "veradigm_payer_analytics_comparison.txt" },
  { competitor: "Veradigm", title: "Veradigm/Allscripts/Pulse8 — Solutions Overview", file: "veradigm_pulse8_solutions.txt" },
];

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

async function main() {
  const rows: string[] = [];
  rows.push(
    ["competitor", "documentTitle", "oneLiner", "content", "topics", "productAreas", "confidence", "sensitivity", "sensitivityReason"]
      .map(csvCell)
      .join(","),
  );

  let totalClaims = 0;
  for (const doc of MANIFEST) {
    const text = fs.readFileSync(path.join(DOCS_DIR, doc.file), "utf8");
    process.stdout.write(`Extracting: ${doc.competitor} — ${doc.title} ... `);
    const { claims, empty } = await extractClaims({ competitor: doc.competitor, title: doc.title, text });
    console.log(empty ? "empty" : `${claims.length} claim(s)`);
    totalClaims += claims.length;
    for (const c of claims) {
      rows.push(
        [
          doc.competitor,
          doc.title,
          c.oneLiner,
          c.content,
          c.topics.join("; "),
          c.productAreas.join("; "),
          c.confidence,
          c.sensitivity,
          c.sensitivityReason,
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }

  fs.writeFileSync(OUT_CSV, rows.join("\n"));
  console.log(`\nWrote ${totalClaims} claims total to ${OUT_CSV}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
