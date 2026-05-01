import { test } from "node:test";
import assert from "node:assert/strict";
import { ROUNDS } from "../../src/rounds.js";

const EXPECTED_ANIMALS = [
  "turtle",
  "dolphin",
  "fish",
  "crab",
  "octopus",
  "seahorse",
  "whale",
  "starfish",
  "jellyfish",
  "shark"
];

test("ROUNDS has 10 sequential entries from 1 through 10", () => {
  assert.equal(ROUNDS.length, 10);
  ROUNDS.forEach((round, index) => {
    assert.equal(round.n, index + 1);
    assert.equal(round.count, index + 1);
  });
});

test("each round uses the approved sea animal in order", () => {
  ROUNDS.forEach((round, index) => {
    assert.equal(round.animal, EXPECTED_ANIMALS[index]);
    assert.equal(round.sprite, `assets/images/${EXPECTED_ANIMALS[index]}.png`);
    assert.equal(typeof round.label, "string");
    assert.ok(round.label.length > 0);
  });
});

test("each round has exactly N targets", () => {
  for (const round of ROUNDS) {
    assert.equal(round.targets.length, round.n, `round ${round.n} should have ${round.n} targets`);
  }
});

test("target ids are unique across the whole game", () => {
  const ids = ROUNDS.flatMap((round) => round.targets.map((target) => target.id));
  assert.equal(new Set(ids).size, ids.length);
});

test("targets use normalized stage coordinates and safe transforms", () => {
  for (const round of ROUNDS) {
    for (const target of round.targets) {
      assert.ok(target.id.startsWith(`r${round.n}-${round.animal}-`), target.id);
      assert.ok(target.x >= 0.08 && target.x <= 0.94, `${target.id} x out of safe range`);
      assert.ok(target.y >= 0.22 && target.y <= 0.82, `${target.id} y out of safe range`);
      assert.ok(target.scale >= 0.72 && target.scale <= 1.25, `${target.id} scale out of range`);
      assert.equal(typeof target.flip, "boolean", `${target.id} flip must be boolean`);
      assert.ok(Number.isInteger(target.rotate), `${target.id} rotate must be an integer`);
      assert.ok(target.rotate >= -12 && target.rotate <= 12, `${target.id} rotate out of range`);
    }
  }
});

test("targets within a round keep toddler-friendly spacing", () => {
  for (const round of ROUNDS) {
    for (let i = 0; i < round.targets.length; i++) {
      for (let j = i + 1; j < round.targets.length; j++) {
        const a = round.targets[i];
        const b = round.targets[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        assert.ok(
          distance >= 0.12,
          `${a.id} and ${b.id} too close in round ${round.n}: ${distance.toFixed(3)}`
        );
      }
    }
  }
});
