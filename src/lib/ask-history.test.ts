import { test } from "node:test";
import assert from "node:assert/strict";
import {
  answerForHistory,
  historyForModel,
  mergeIntoPool,
  parsePool,
  stripWebSearchTrigger,
  titleFromQuestion,
  HISTORY_TURNS,
  type PoolSource,
} from "./ask-history";

const ins = (id: string): PoolSource => ({ id, kind: "insight", label: id, client: "Acme" });
const comp = (id: string): PoolSource => ({ id, kind: "competitor", label: id, client: null });

test("pool numbers are stable and append-only across turns", () => {
  const t1 = mergeIntoPool([], [ins("a"), ins("b"), comp("c")]);
  assert.deepEqual(t1.numbers, [1, 2, 3]);
  // Turn 2 re-finds b and c, adds d and e: old numbers must not move.
  const t2 = mergeIntoPool(t1.pool, [ins("d"), ins("b"), comp("c"), ins("e")]);
  assert.deepEqual(t2.numbers, [4, 2, 3, 5]);
  assert.deepEqual(t2.pool.map((s) => s.id), ["a", "b", "c", "d", "e"]);
});

test("same id under a different kind is a different source", () => {
  const t = mergeIntoPool([], [ins("x"), comp("x")]);
  assert.deepEqual(t.numbers, [1, 2]);
});

test("duplicates within one turn collapse to one number", () => {
  const t = mergeIntoPool([], [ins("a"), ins("a")]);
  assert.deepEqual(t.numbers, [1, 1]);
  assert.equal(t.pool.length, 1);
});

test("answerForHistory removes banner, tip and citations", () => {
  const stored =
    "🌐 **This answer includes a live web search.**\n\n- **Pain:** slow coding [3][12]\n- Other point [100].\n\n💡 **Tip:** add \"search web\" anywhere in your question to also pull in live web results.";
  assert.equal(answerForHistory(stored), "- **Pain:** slow coding\n- Other point.");
});

test("historyForModel keeps the last N turns, oldest first, trigger stripped", () => {
  const turns = Array.from({ length: HISTORY_TURNS + 3 }, (_, i) => ({ question: `q${i} search web`, answer: `a${i} [1]` }));
  const h = historyForModel(turns);
  assert.equal(h.length, HISTORY_TURNS);
  assert.equal(h[0].question, "q3");
  assert.equal(h.at(-1)!.answer, `a${HISTORY_TURNS + 2}`);
});

test("web trigger", () => {
  assert.deepEqual(stripWebSearchTrigger("what about Epic? Search web"), { question: "what about Epic?", wantsWebSearch: true });
  assert.equal(stripWebSearchTrigger("research web hosting").wantsWebSearch, false);
});

test("titles", () => {
  assert.equal(titleFromQuestion("  What are   clients saying?\n search web"), "What are clients saying?");
  assert.equal(titleFromQuestion("search web"), "New chat");
  const long = titleFromQuestion("x".repeat(200));
  assert.equal(long.length, 80);
  assert.ok(long.endsWith("…"));
});

test("parsePool tolerates garbage", () => {
  assert.deepEqual(parsePool("not json"), []);
  assert.deepEqual(parsePool("{}"), []);
  assert.deepEqual(parsePool("[]"), []);
});
