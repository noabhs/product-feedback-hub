import test from "node:test";
import assert from "node:assert/strict";
import { selectCompetitors, selectFeatureRequests } from "./ask-select";
import { phrasesOf } from "./tokenize";

const comps = [
  { name: "Innovaccer", category: "Pop health", overview: "population health analytics platform" },
  { name: "Abridge", category: "Ambient", overview: "ambient clinical documentation" },
];
const reqs = [
  { title: "Portrait without appointment", description: "show portrait for patients with no scheduled visit", painToSolve: "" },
  { title: "Export to CSV", description: "download tables", painToSolve: "" },
];

test("a named competitor is always selected", () => {
  assert.deepEqual(selectCompetitors("what is Abridge doing?", comps).items.map((c) => c.name), ["Abridge"]);
});
test("a competitor question keeps the whole set", () => {
  const r = selectCompetitors("which competitors do we track?", comps);
  assert.equal(r.items.length, 2);
  assert.equal(r.all, true);
});
test("an unrelated question selects no competitors", () => {
  assert.equal(selectCompetitors("what is the latest on pop health?", [comps[1]]).items.length, 0);
});
test("topic overlap selects competitors that cover it", () => {
  assert.deepEqual(selectCompetitors("population health analytics", comps).items.map((c) => c.name), ["Innovaccer"]);
});
test("feature requests need two shared terms", () => {
  assert.equal(selectFeatureRequests("portrait for health", reqs).items.length, 0);
  assert.equal(selectFeatureRequests("portrait without scheduled appointment", reqs).items.length, 1);
});
test("a status question keeps every feature request", () => {
  assert.equal(selectFeatureRequests("what is the status of exports", reqs).items.length, 2);
});
test("phrasesOf pairs adjacent kept words only", () => {
  assert.deepEqual(phrasesOf("what's the latest on pop health?"), ["pop health"]);
  assert.deepEqual(phrasesOf("risk adjustment gaps"), ["risk adjustment", "adjustment gaps"]);
});

import { tokenize, hasTerm } from "./tokenize";
import { expandQuestion } from "./synonyms";

test("plurals search as singular too; generic verbs are not searched", () => {
  assert.deepEqual(tokenize("do you know what LOBs are? where do we get them from?"), ["lobs", "lob"]);
});
test("short terms match whole words only", () => {
  assert.equal(hasTerm("budget targets", "get"), false);
  assert.equal(hasTerm("split by lob", "lob"), true);
  assert.equal(hasTerm("each lobs total", "lob"), true);
  assert.equal(hasTerm("global rollout", "lob"), false);
  assert.equal(hasTerm("risk adjustment", "diagnos"), false);
  assert.equal(hasTerm("diagnosis gaps", "diagnos"), true);
});
test("LOB resolves to line of business", () => {
  const e = expandQuestion("what are LOBs?");
  assert.equal(e.matched[0]?.label, "Line of business");
  assert.ok(e.terms.includes("line of business"));
});
