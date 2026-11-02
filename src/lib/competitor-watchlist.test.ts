import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "@/lib/csv";
import { normalizeName, parseTier, watchlistRowsFromCsv } from "@/lib/competitor-watchlist";

const CSV = `﻿Company,Tier,Status,Category,Ref,Last verified,Latest,Website
Keebler Health,A — head to head,Active competitor,HCC / risk adjustment,8,"September 7, 2026","Raised $16M,
repositioned",https://keebler.health
Pelica Health,B — active watch,Proposed,,45,,,
,,,,,,,
`;

test("reads rows by header name, including quoted multi-line cells and a BOM", () => {
  const rows = watchlistRowsFromCsv(parseCsv(CSV));
  assert.equal(rows.length, 2);
  assert.equal(rows[0].company, "Keebler Health");
  assert.equal(rows[0].tier, "A");
  assert.equal(rows[0].ref, 8);
  assert.equal(rows[0].verified?.toISOString().slice(0, 10), "2026-09-07");
  assert.equal(rows[1].website, null);
  assert.equal(rows[1].verified, null);
});

test("throws when the file isn't the watchlist", () => {
  assert.throws(() => watchlistRowsFromCsv([["Name"], ["x"]]), /Company/);
});

test("name and tier helpers", () => {
  assert.equal(normalizeName("Nuance  DAX "), "nuance dax");
  assert.equal(parseTier("C — long tail"), "C");
  assert.equal(parseTier("nonsense"), null);
});
