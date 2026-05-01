import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../../src/game.js";

const MINI_ROUNDS = [
  {
    n: 1,
    count: 1,
    animal: "turtle",
    label: "Turtle",
    sprite: "assets/images/turtle.png",
    targets: [{ id: "r1-turtle-1", x: 0.5, y: 0.5, scale: 1, flip: false, rotate: 0 }]
  },
  {
    n: 2,
    count: 2,
    animal: "dolphin",
    label: "Dolphin",
    sprite: "assets/images/dolphin.png",
    targets: [
      { id: "r2-dolphin-1", x: 0.35, y: 0.5, scale: 1, flip: false, rotate: -4 },
      { id: "r2-dolphin-2", x: 0.65, y: 0.5, scale: 1, flip: true, rotate: 4 }
    ]
  }
];

function listen(game) {
  const events = [];
  for (const type of ["round-started", "animal-counted", "round-complete", "game-complete"]) {
    game.addEventListener(type, (event) => events.push({ type, detail: event.detail }));
  }
  return events;
}

test("start() emits round-started with first round", () => {
  const game = createGame(MINI_ROUNDS);
  const events = listen(game);
  game.start();
  assert.deepEqual(events, [
    { type: "round-started", detail: { n: 1, round: MINI_ROUNDS[0], targets: MINI_ROUNDS[0].targets } }
  ]);
});

test("tapTarget() emits animal-counted with running count and total", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  const events = listen(game);
  game.tapTarget("r1-turtle-1");
  assert.deepEqual(events.filter((event) => event.type === "animal-counted"), [
    {
      type: "animal-counted",
      detail: {
        id: "r1-turtle-1",
        count: 1,
        total: 1,
        animal: "turtle",
        round: MINI_ROUNDS[0]
      }
    }
  ]);
});

test("tapTarget() is idempotent on the same target id", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  const events = listen(game);
  game.tapTarget("r1-turtle-1");
  game.tapTarget("r1-turtle-1");
  game.tapTarget("r1-turtle-1");
  assert.equal(events.filter((event) => event.type === "animal-counted").length, 1);
});

test("tapTarget() on an unknown id is a no-op", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  const events = listen(game);
  game.tapTarget("missing");
  assert.deepEqual(events, []);
});

test("tapping the last target emits round-complete then advances to next round", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  const events = listen(game);
  game.tapTarget("r1-turtle-1");
  game.advanceRound();
  const types = events.map((event) => event.type);
  assert.ok(types.includes("round-complete"));
  assert.ok(types.includes("round-started"));
  assert.ok(types.indexOf("round-complete") < types.indexOf("round-started"));
  assert.equal(events.findLast((event) => event.type === "round-started").detail.n, 2);
});

test("tapping during a completed round does nothing until advanceRound()", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  const events = listen(game);
  game.tapTarget("r1-turtle-1");
  game.tapTarget("r1-turtle-1");
  assert.equal(events.filter((event) => event.type === "animal-counted").length, 1);
});

test("tapping the last target of the final round emits game-complete", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  game.tapTarget("r1-turtle-1");
  game.advanceRound();
  const events = listen(game);
  game.tapTarget("r2-dolphin-1");
  game.tapTarget("r2-dolphin-2");
  game.advanceRound();
  assert.ok(events.map((event) => event.type).includes("game-complete"));
});

test("restart() begins from round 1 after completion", () => {
  const game = createGame(MINI_ROUNDS);
  game.start();
  game.tapTarget("r1-turtle-1");
  game.advanceRound();
  game.tapTarget("r2-dolphin-1");
  game.tapTarget("r2-dolphin-2");
  game.advanceRound();
  const events = listen(game);
  game.restart();
  assert.deepEqual(events.filter((event) => event.type === "round-started"), [
    { type: "round-started", detail: { n: 1, round: MINI_ROUNDS[0], targets: MINI_ROUNDS[0].targets } }
  ]);
});
