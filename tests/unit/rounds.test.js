import { test } from "node:test";
import assert from "node:assert/strict";
import { ROUNDS } from "../../src/rounds.js";

test("ROUNDS has 10 entries, one per N from 1..10", () => {
  assert.equal(ROUNDS.length, 10);
  ROUNDS.forEach((round, idx) => {
    assert.equal(round.n, idx + 1, `round at index ${idx} should have n=${idx + 1}`);
  });
});

test("each round has exactly N bugs", () => {
  for (const round of ROUNDS) {
    assert.equal(round.bugs.length, round.n, `round ${round.n} should have ${round.n} bugs`);
  }
});

test("every bug has a unique id within its round", () => {
  for (const round of ROUNDS) {
    const ids = round.bugs.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length, `round ${round.n} has duplicate bug ids`);
  }
});

test("every bug has normalized coordinates in 0..1", () => {
  for (const round of ROUNDS) {
    for (const bug of round.bugs) {
      assert.ok(bug.x >= 0 && bug.x <= 1, `bug ${bug.id} x out of range`);
      assert.ok(bug.y >= 0 && bug.y <= 1, `bug ${bug.id} y out of range`);
    }
  }
});

test("bugs within a round don't overlap (min separation 0.18 in normalized space)", () => {
  for (const round of ROUNDS) {
    for (let i = 0; i < round.bugs.length; i++) {
      for (let j = i + 1; j < round.bugs.length; j++) {
        const a = round.bugs[i];
        const b = round.bugs[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        assert.ok(d >= 0.18, `bugs ${a.id} and ${b.id} too close in round ${round.n} (d=${d.toFixed(3)})`);
      }
    }
  }
});

test("each bug uses one of 3 known variants", () => {
  const allowed = new Set(["A", "B", "C"]);
  for (const round of ROUNDS) {
    for (const bug of round.bugs) {
      assert.ok(allowed.has(bug.variant), `bug ${bug.id} variant ${bug.variant} not in {A,B,C}`);
    }
  }
});
