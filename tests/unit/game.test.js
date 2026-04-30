import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../../src/game.js";

const MINI_ROUNDS = [
  { n: 1, bugs: [{ id: "r1-b1", variant: "A", x: 0.5, y: 0.5 }] },
  {
    n: 2,
    bugs: [
      { id: "r2-b1", variant: "A", x: 0.3, y: 0.5 },
      { id: "r2-b2", variant: "B", x: 0.7, y: 0.5 }
    ]
  }
];

function listen(game) {
  const events = [];
  for (const type of ["round-started", "bug-popped", "round-complete", "game-complete"]) {
    game.addEventListener(type, (e) => events.push({ type, detail: e.detail }));
  }
  return events;
}

test("start() emits round-started with first round", () => {
  const game = createGame(MINI_ROUNDS);
  const events = listen(game);
  game.start();
  assert.deepEqual(events, [
    { type: "round-started", detail: { n: 1, bugs: MINI_ROUNDS[0].bugs } }
  ]);
});

test("tapBug() on a present bug emits bug-popped with running count", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  const events = listen(game);
  game.tapBug("r1-b1");
  assert.deepEqual(events.filter((e) => e.type === "bug-popped"), [
    { type: "bug-popped", detail: { id: "r1-b1", count: 1 } }
  ]);
});

test("tapBug() is idempotent on the same bug id", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  const events = listen(game);
  game.tapBug("r1-b1");
  game.tapBug("r1-b1");
  game.tapBug("r1-b1");
  assert.equal(events.filter((e) => e.type === "bug-popped").length, 1);
});

test("tapBug() on an unknown id is a no-op", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  const events = listen(game);
  game.tapBug("nonexistent");
  assert.deepEqual(events, []);
});

test("popping the last bug emits round-complete then advances to next round", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  const events = listen(game);
  game.tapBug("r1-b1");
  game.advanceRound();
  const types = events.map((e) => e.type);
  assert.ok(types.includes("round-complete"));
  assert.ok(types.includes("round-started"));
  // round-complete must come before the next round-started
  assert.ok(types.indexOf("round-complete") < types.indexOf("round-started"));
});

test("popping the last bug of the final round emits game-complete instead of advancing", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  game.tapBug("r1-b1");
  game.advanceRound();
  const events = listen(game);
  game.tapBug("r2-b1");
  game.tapBug("r2-b2");
  game.advanceRound();
  const types = events.map((e) => e.type);
  assert.ok(types.includes("game-complete"));
});

test("game-complete loops back: next start() begins from round 1", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  game.tapBug("r1-b1");
  game.advanceRound();
  game.tapBug("r2-b1");
  game.tapBug("r2-b2");
  game.advanceRound();
  // Loop
  const events = listen(game);
  game.restart();
  assert.deepEqual(events.filter((e) => e.type === "round-started"), [
    { type: "round-started", detail: { n: 1, bugs: MINI_ROUNDS[0].bugs } }
  ]);
});
