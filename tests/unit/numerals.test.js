import { test } from "node:test";
import assert from "node:assert/strict";
import { numeralClassFor } from "../../src/numerals.js";

test("numeralClassFor returns the per-digit color class", () => {
  assert.equal(numeralClassFor(1), "n-1");
  assert.equal(numeralClassFor(5), "n-5");
  assert.equal(numeralClassFor(10), "n-10");
});

test("numeralClassFor throws on out-of-range", () => {
  assert.throws(() => numeralClassFor(0), /numeral out of range/);
  assert.throws(() => numeralClassFor(11), /numeral out of range/);
});
