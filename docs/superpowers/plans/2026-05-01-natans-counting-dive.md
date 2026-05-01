# Natan's Counting Dive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tooth/sugar-bug game with a polished underwater sea-animal counting game that teaches English numbers 1 through 10.

**Architecture:** Preserve the current vanilla JS separation: `game.js` owns state, `rounds.js` owns pure round data, `scene.js` owns DOM rendering, `audio.js` owns playback, and `main.js` wires them together. Rename bug-specific contracts to animal/target contracts while keeping synchronous tap-to-audio playback intact for iOS.

**Tech Stack:** Vanilla HTML/CSS/JS with ESM, Vite, `node:test` unit tests, Playwright mobile-landscape WebKit E2E tests, Sharp for PWA icons.

---

## File Map

- Modify `docs/superpowers/specs/2026-05-01-natans-counting-dive-design.md` only if implementation uncovers a design contradiction.
- Modify `src/rounds.js`: replace bug data with sea-animal round data.
- Modify `src/game.js`: rename public tap/event vocabulary from bug-specific to animal/target-specific.
- Modify `src/scene.js`: render ocean animals, count ribbon, counted state, idle nudge, and underwater finale.
- Modify `src/styles.css`: replace bathroom/tooth layout with underwater scene layout.
- Modify `src/main.js`: wire renamed events and ocean SFX paths while preserving synchronous audio.
- Modify `src/voice-roster.js`: rename SFX keys from tooth semantics to ocean semantics.
- Modify `src/numerals.js`: keep API, adjust no logic unless tests require it.
- Modify `index.html`: replace bathroom DOM layers with ocean DOM layers.
- Modify `public/service-worker.js`: bump cache version and precache ocean assets.
- Modify `public/manifest.webmanifest`: adjust name/theme metadata if it still references the tooth game.
- Modify `scripts/make-icons.mjs`: generate icons from ocean art instead of `tooth.png`.
- Replace assets in `assets/images/`: add `ocean-bg.png`, ten animal sprites, remove code references to old tooth assets.
- Replace or keep assets in `assets/sounds/`: reuse filenames if possible to reduce wiring churn, but update semantics in `voice-roster.js`.
- Modify `tests/unit/rounds.test.js`: verify sea-animal data contract.
- Modify `tests/unit/game.test.js`: verify renamed state-machine events and tap method.
- Modify `tests/e2e/tap-flow.spec.mjs`: verify animals stay visible and counted.
- Modify `tests/e2e/round-progression.spec.mjs`: verify round 1 to round 2 with animal targets.
- Modify `tests/e2e/finale.spec.mjs`: verify underwater finale.

## Task 1: Replace Round Data Contract

**Files:**
- Modify: `tests/unit/rounds.test.js`
- Modify: `src/rounds.js`

- [ ] **Step 1: Write the failing round-data tests**

Replace `tests/unit/rounds.test.js` with:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/rounds.test.js
```

Expected: FAIL because `round.count`, `round.animal`, `round.sprite`, and `round.targets` are not defined yet.

- [ ] **Step 3: Replace `src/rounds.js` with sea-animal data**

Replace `src/rounds.js` with:

```js
// src/rounds.js
// Pure data. ROUNDS[i] is round number i+1.
// Target positions are normalized over the full stage/play area.

const ANIMAL_ROUNDS = [
  { animal: "turtle", label: "Turtle" },
  { animal: "dolphin", label: "Dolphin" },
  { animal: "fish", label: "Fish" },
  { animal: "crab", label: "Crab" },
  { animal: "octopus", label: "Octopus" },
  { animal: "seahorse", label: "Seahorse" },
  { animal: "whale", label: "Whale" },
  { animal: "starfish", label: "Starfish" },
  { animal: "jellyfish", label: "Jellyfish" },
  { animal: "shark", label: "Shark" }
];

const POSITIONS = [
  [{ x: 0.58, y: 0.52, scale: 1.22, flip: false, rotate: 0 }],
  [
    { x: 0.42, y: 0.46, scale: 1.08, flip: false, rotate: -6 },
    { x: 0.70, y: 0.58, scale: 1.00, flip: true, rotate: 6 }
  ],
  [
    { x: 0.34, y: 0.44, scale: 1.04, flip: false, rotate: -8 },
    { x: 0.56, y: 0.58, scale: 1.12, flip: true, rotate: 4 },
    { x: 0.78, y: 0.40, scale: 0.98, flip: false, rotate: 8 }
  ],
  [
    { x: 0.30, y: 0.66, scale: 1.00, flip: false, rotate: -6 },
    { x: 0.48, y: 0.48, scale: 0.96, flip: true, rotate: 5 },
    { x: 0.68, y: 0.67, scale: 1.04, flip: false, rotate: 8 },
    { x: 0.83, y: 0.49, scale: 0.92, flip: true, rotate: -5 }
  ],
  [
    { x: 0.28, y: 0.40, scale: 0.96, flip: false, rotate: -6 },
    { x: 0.46, y: 0.62, scale: 1.05, flip: true, rotate: 4 },
    { x: 0.64, y: 0.42, scale: 0.94, flip: false, rotate: 8 },
    { x: 0.80, y: 0.62, scale: 0.98, flip: true, rotate: -8 },
    { x: 0.56, y: 0.30, scale: 0.90, flip: false, rotate: 0 }
  ],
  [
    { x: 0.24, y: 0.36, scale: 0.90, flip: false, rotate: -8 },
    { x: 0.40, y: 0.56, scale: 0.96, flip: true, rotate: 6 },
    { x: 0.56, y: 0.38, scale: 0.88, flip: false, rotate: 8 },
    { x: 0.72, y: 0.58, scale: 0.95, flip: true, rotate: -6 },
    { x: 0.86, y: 0.38, scale: 0.86, flip: false, rotate: 5 },
    { x: 0.60, y: 0.74, scale: 0.92, flip: true, rotate: -3 }
  ],
  [
    { x: 0.20, y: 0.34, scale: 0.84, flip: false, rotate: -5 },
    { x: 0.36, y: 0.52, scale: 0.92, flip: true, rotate: 4 },
    { x: 0.52, y: 0.32, scale: 0.82, flip: false, rotate: 7 },
    { x: 0.68, y: 0.52, scale: 0.90, flip: true, rotate: -7 },
    { x: 0.84, y: 0.34, scale: 0.80, flip: false, rotate: 5 },
    { x: 0.46, y: 0.72, scale: 0.84, flip: true, rotate: -4 },
    { x: 0.76, y: 0.74, scale: 0.82, flip: false, rotate: 3 }
  ],
  [
    { x: 0.18, y: 0.32, scale: 0.80, flip: false, rotate: -8 },
    { x: 0.34, y: 0.46, scale: 0.86, flip: true, rotate: 5 },
    { x: 0.50, y: 0.30, scale: 0.78, flip: false, rotate: 8 },
    { x: 0.66, y: 0.46, scale: 0.84, flip: true, rotate: -6 },
    { x: 0.82, y: 0.32, scale: 0.78, flip: false, rotate: 6 },
    { x: 0.26, y: 0.70, scale: 0.82, flip: true, rotate: -4 },
    { x: 0.54, y: 0.70, scale: 0.86, flip: false, rotate: 4 },
    { x: 0.84, y: 0.68, scale: 0.78, flip: true, rotate: -8 }
  ],
  [
    { x: 0.16, y: 0.30, scale: 0.76, flip: false, rotate: -6 },
    { x: 0.31, y: 0.45, scale: 0.82, flip: true, rotate: 4 },
    { x: 0.46, y: 0.28, scale: 0.74, flip: false, rotate: 7 },
    { x: 0.61, y: 0.45, scale: 0.82, flip: true, rotate: -5 },
    { x: 0.76, y: 0.30, scale: 0.74, flip: false, rotate: 6 },
    { x: 0.90, y: 0.48, scale: 0.76, flip: true, rotate: -7 },
    { x: 0.24, y: 0.72, scale: 0.78, flip: false, rotate: 4 },
    { x: 0.50, y: 0.70, scale: 0.84, flip: true, rotate: -4 },
    { x: 0.78, y: 0.72, scale: 0.76, flip: false, rotate: 5 }
  ],
  [
    { x: 0.14, y: 0.30, scale: 0.74, flip: false, rotate: -7 },
    { x: 0.28, y: 0.44, scale: 0.80, flip: true, rotate: 5 },
    { x: 0.42, y: 0.28, scale: 0.72, flip: false, rotate: 8 },
    { x: 0.56, y: 0.44, scale: 0.80, flip: true, rotate: -6 },
    { x: 0.70, y: 0.28, scale: 0.72, flip: false, rotate: 7 },
    { x: 0.86, y: 0.42, scale: 0.78, flip: true, rotate: -8 },
    { x: 0.20, y: 0.70, scale: 0.76, flip: false, rotate: 5 },
    { x: 0.40, y: 0.72, scale: 0.80, flip: true, rotate: -5 },
    { x: 0.62, y: 0.70, scale: 0.76, flip: false, rotate: 4 },
    { x: 0.84, y: 0.72, scale: 0.74, flip: true, rotate: -6 }
  ]
];

export const ROUNDS = ANIMAL_ROUNDS.map((round, index) => {
  const n = index + 1;
  return {
    n,
    count: n,
    animal: round.animal,
    label: round.label,
    sprite: `assets/images/${round.animal}.png`,
    targets: POSITIONS[index].map((position, targetIndex) => ({
      id: `r${n}-${round.animal}-${targetIndex + 1}`,
      ...position
    }))
  };
});
```

- [ ] **Step 4: Run round tests**

Run:

```bash
npm test -- tests/unit/rounds.test.js
```

Expected: PASS for `tests/unit/rounds.test.js`.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/rounds.js tests/unit/rounds.test.js
git commit -m "Replace rounds with ocean animals"
```

Expected: commit succeeds with only these two files staged.

## Task 2: Rename Game State Machine To Animal Targets

**Files:**
- Modify: `tests/unit/game.test.js`
- Modify: `src/game.js`

- [ ] **Step 1: Write the failing game tests**

Replace `tests/unit/game.test.js` with:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/unit/game.test.js
```

Expected: FAIL because `tapTarget()` and `animal-counted` do not exist yet.

- [ ] **Step 3: Update `src/game.js`**

Replace `src/game.js` with:

```js
// src/game.js
// State machine for Natan's Counting Dive. No DOM, no audio.
// Communicates via EventTarget.

export function createGame(rounds) {
  const target = new EventTarget();
  let roundIndex = 0;
  let counted = new Set();
  let pendingComplete = false;

  function currentRound() {
    return rounds[roundIndex];
  }

  function emit(type, detail) {
    target.dispatchEvent(new CustomEvent(type, { detail }));
  }

  function start() {
    roundIndex = 0;
    counted = new Set();
    pendingComplete = false;
    const round = currentRound();
    emit("round-started", { n: round.n, round, targets: round.targets });
  }

  function restart() {
    start();
  }

  function tapTarget(id) {
    if (pendingComplete) return;
    const round = currentRound();
    const animalTarget = round.targets.find((item) => item.id === id);
    if (!animalTarget || counted.has(id)) return;

    counted.add(id);
    emit("animal-counted", {
      id,
      count: counted.size,
      total: round.targets.length,
      animal: round.animal,
      round
    });

    if (counted.size === round.targets.length) {
      pendingComplete = true;
      emit("round-complete", { n: round.n, animal: round.animal, round });
    }
  }

  function advanceRound() {
    if (!pendingComplete) return;
    pendingComplete = false;
    if (roundIndex + 1 >= rounds.length) {
      emit("game-complete", {});
      return;
    }
    roundIndex += 1;
    counted = new Set();
    const round = currentRound();
    emit("round-started", { n: round.n, round, targets: round.targets });
  }

  return Object.assign(target, { start, restart, tapTarget, advanceRound });
}
```

- [ ] **Step 4: Run game tests**

Run:

```bash
npm test -- tests/unit/game.test.js
```

Expected: PASS for `tests/unit/game.test.js`.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/game.js tests/unit/game.test.js
git commit -m "Rename game targets for ocean counting"
```

Expected: commit succeeds with only these two files staged.

## Task 3: Update HTML Shell And Audio Manifest

**Files:**
- Modify: `index.html`
- Modify: `src/voice-roster.js`
- Modify: `src/main.js`

- [ ] **Step 1: Update `index.html` stage markup**

Replace the stage portion of `index.html` with this body content:

```html
  <body>
    <div id="rotate-hint">
      <p>Rotate the device to landscape</p>
    </div>
    <div id="start-screen" aria-label="Tap to begin">
      <div class="start-cue">TAP!</div>
    </div>
    <main id="stage" aria-label="Natan's underwater counting scene" hidden>
      <div class="ocean-bg" aria-hidden="true"></div>
      <div class="sunbeams" aria-hidden="true"></div>
      <div class="count-ribbon" aria-label="Counted numbers"></div>
      <div class="animal-layer"></div>
      <div class="numeral-layer" aria-hidden="true"></div>
      <div class="celebration" hidden></div>
      <div class="finale" hidden></div>
    </main>
    <script type="module" src="/src/main.js"></script>
  </body>
```

Keep the existing `<head>` unchanged in this task.

- [ ] **Step 2: Update `src/voice-roster.js` SFX names**

Replace the `SFX_PATHS` export with:

```js
export const SFX_PATHS = {
  tap: "assets/sounds/bubble-pop.wav",
  round: "assets/sounds/drain-swoosh.wav",
  finale: "assets/sounds/confetti-cheer.wav"
};
```

Keep number and cheer voice exports unchanged.

- [ ] **Step 3: Update `src/main.js` for renamed tap API**

Replace the `audio.preload`, `createScene`, game listener, and `startGame()` sections with:

```js
audio.preload([
  ...NUMBER_VOICE_PATHS,
  CHEER_AMAZING_PATH,
  CHEER_WOOHOO_PATH,
  SFX_PATHS.tap,
  SFX_PATHS.round,
  SFX_PATHS.finale
]);

const game = createGame(ROUNDS);

createScene({
  root: stage,
  game,
  audio,
  voiceRoster: { NUMBER_VOICE_PATHS, CHEER_AMAZING_PATH, CHEER_WOOHOO_PATH },
  sfxPaths: SFX_PATHS,
  onTap: (id) => handleTap(id)
});

game.addEventListener("animal-counted", (event) => {
  const { count } = event.detail;
  audio.playSequence([NUMBER_VOICE_PATHS[count - 1], SFX_PATHS.tap]);
});

function handleTap(id) {
  game.tapTarget(id);
}

function startGame() {
  audio.playSequence([SFX_PATHS.tap]);
  startScreen.hidden = true;
  stage.hidden = false;
  game.start();
}
```

- [ ] **Step 4: Run unit tests and observe scene failures remain expected**

Run:

```bash
npm test
```

Expected: unit tests for `rounds`, `game`, `audio`, and `numerals` pass. Browser behavior is incomplete until `scene.js` and CSS are updated.

- [ ] **Step 5: Commit**

Run:

```bash
git add index.html src/main.js src/voice-roster.js
git commit -m "Wire ocean shell and audio paths"
```

Expected: commit succeeds with only these three files staged.

## Task 4: Render Ocean Scene, Counted State, Ribbon, And Finale

**Files:**
- Modify: `tests/e2e/tap-flow.spec.mjs`
- Modify: `tests/e2e/round-progression.spec.mjs`
- Modify: `tests/e2e/finale.spec.mjs`
- Modify: `src/scene.js`

- [ ] **Step 1: Write failing E2E tests for the new scene**

Replace `tests/e2e/tap-flow.spec.mjs` with:

```js
import { test, expect } from "@playwright/test";

test("round 1: tap the turtle, see numeral, turtle remains counted", async ({ page }) => {
  await page.goto("/");
  await page.locator("#start-screen").click();

  await expect(page.locator("#stage")).toBeVisible();
  await expect(page.locator("#stage")).toHaveAttribute("data-round", "1");
  await expect(page.locator("#stage")).toHaveAttribute("data-animal", "turtle");
  await expect(page.locator(".animal")).toHaveCount(1);
  await expect(page.locator(".count-bubble")).toHaveCount(1);

  await page.locator(".animal").click({ force: true });

  await expect(page.locator(".numeral.n-1")).toHaveCount(1);
  await expect(page.locator(".animal.counted")).toHaveCount(1);
  await expect(page.locator(".animal")).toHaveCount(1);
  await expect(page.locator(".count-bubble.filled")).toHaveCount(1);
});
```

Replace `tests/e2e/round-progression.spec.mjs` with:

```js
import { test, expect } from "@playwright/test";

test("finishing round 1 advances to round 2 with 2 dolphins", async ({ page }) => {
  await page.goto("/");
  await page.locator("#start-screen").click();
  await expect(page.locator(".animal")).toHaveCount(1);

  await page.locator(".animal:not(.counted)").first().click({ force: true });

  await expect(page.locator("#stage")).toHaveAttribute("data-round", "2", { timeout: 4000 });
  await expect(page.locator("#stage")).toHaveAttribute("data-animal", "dolphin");
  await expect(page.locator(".animal")).toHaveCount(2);
  await expect(page.locator(".count-bubble")).toHaveCount(2);
  await expect(page.locator(".count-bubble.filled")).toHaveCount(0);
});
```

Replace `tests/e2e/finale.spec.mjs` with:

```js
import { test, expect } from "@playwright/test";

async function clearRound(page) {
  let safety = 60;
  while ((await page.locator(".animal:not(.counted)").count()) > 0 && safety-- > 0) {
    await page.locator(".animal:not(.counted)").first().click({ force: true });
  }
}

test("playing through all 10 rounds reveals the underwater finale", async ({ page }) => {
  test.setTimeout(120000);

  await page.goto("/");
  await page.locator("#start-screen").click();

  for (let n = 1; n <= 10; n++) {
    await expect(page.locator("#stage")).toHaveAttribute("data-round", String(n), { timeout: 6000 });
    await expect(page.locator(".animal")).toHaveCount(n);
    await clearRound(page);
    if (n < 10) {
      await expect(page.locator("#stage")).toHaveAttribute("data-round", String(n + 1), { timeout: 6000 });
    }
  }

  await expect(page.locator(".finale")).toBeVisible();
  await expect(page.locator(".finale-title")).toHaveText("1 2 3 4 5 6 7 8 9 10");
  await expect(page.locator(".bubble-confetti i")).toHaveCount(36);
});
```

- [ ] **Step 2: Build and run E2E to verify scene tests fail**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: FAIL because `.animal`, `.count-bubble`, and ocean finale are not rendered yet.

- [ ] **Step 3: Replace `src/scene.js` with ocean rendering**

Replace `src/scene.js` with:

```js
// src/scene.js
// DOM rendering for Natan's Counting Dive.

import { floatNumeral } from "./numerals.js";

const IDLE_NUDGE_MS = 6000;

export function createScene({ root, game, audio, voiceRoster, sfxPaths, onTap }) {
  const stage = root;
  const animalLayer = stage.querySelector(".animal-layer");
  const numeralLayer = stage.querySelector(".numeral-layer");
  const countRibbon = stage.querySelector(".count-ribbon");
  const celebration = stage.querySelector(".celebration");
  const finale = stage.querySelector(".finale");
  let idleTimer = 0;

  function clearIdleTimer() {
    window.clearTimeout(idleTimer);
    idleTimer = 0;
  }

  function remainingAnimals() {
    return [...animalLayer.querySelectorAll(".animal:not(.counted)")];
  }

  function scheduleIdleNudge() {
    clearIdleTimer();
    idleTimer = window.setTimeout(() => {
      const animals = remainingAnimals();
      if (animals.length === 0) return;
      const animal = animals[Math.floor(Math.random() * animals.length)];
      animal.classList.remove("nudge");
      void animal.offsetWidth;
      animal.classList.add("nudge");
      scheduleIdleNudge();
    }, IDLE_NUDGE_MS);
  }

  function clearRoundDom() {
    animalLayer.innerHTML = "";
    countRibbon.innerHTML = "";
  }

  function renderCountRibbon(total) {
    countRibbon.innerHTML = "";
    for (let i = 1; i <= total; i++) {
      const bubble = document.createElement("span");
      bubble.className = "count-bubble";
      bubble.textContent = String(i);
      bubble.dataset.count = String(i);
      countRibbon.appendChild(bubble);
    }
  }

  function markRibbon(count) {
    const bubble = countRibbon.querySelector(`[data-count="${count}"]`);
    if (bubble) bubble.classList.add("filled");
  }

  function renderAnimals(round) {
    clearRoundDom();
    renderCountRibbon(round.targets.length);
    for (const target of round.targets) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `animal animal-${round.animal}`;
      button.dataset.targetId = target.id;
      button.dataset.animal = round.animal;
      button.setAttribute("aria-label", round.label);
      button.style.left = `${target.x * 100}%`;
      button.style.top = `${target.y * 100}%`;
      button.style.setProperty("--animal-scale", String(target.scale));
      button.style.setProperty("--animal-rotate", `${target.rotate}deg`);
      button.style.setProperty("--animal-flip", target.flip ? "-1" : "1");
      button.style.backgroundImage = `url("${round.sprite}")`;
      animalLayer.appendChild(button);
    }
  }

  animalLayer.addEventListener("pointerdown", (event) => {
    const target = event.target.closest(".animal");
    if (!target || target.classList.contains("counted")) return;
    clearIdleTimer();
    onTap(target.dataset.targetId, target);
    scheduleIdleNudge();
  });

  game.addEventListener("round-started", (event) => {
    const { round } = event.detail;
    stage.dataset.round = String(round.n);
    stage.dataset.animal = round.animal;
    renderAnimals(round);
    celebration.hidden = true;
    finale.hidden = true;
    animalLayer.style.pointerEvents = "auto";
    scheduleIdleNudge();
  });

  game.addEventListener("animal-counted", (event) => {
    const { id, count } = event.detail;
    const animal = animalLayer.querySelector(`[data-target-id="${id}"]`);
    if (!animal) return;
    const rect = animal.getBoundingClientRect();
    animal.classList.add("counted");
    animal.classList.remove("nudge");
    animal.style.pointerEvents = "none";
    markRibbon(count);
    floatNumeral(numeralLayer, count, rect);
  });

  game.addEventListener("round-complete", () => {
    clearIdleTimer();
    animalLayer.style.pointerEvents = "none";
    celebration.hidden = false;
    audio.playSequence([voiceRoster.CHEER_AMAZING_PATH, sfxPaths.round]);
    window.setTimeout(() => game.advanceRound(), 1500);
  });

  game.addEventListener("game-complete", () => {
    clearIdleTimer();
    animalLayer.style.pointerEvents = "none";
    finale.hidden = false;
    finale.innerHTML = "";

    const title = document.createElement("div");
    title.className = "finale-title";
    title.textContent = "1 2 3 4 5 6 7 8 9 10";
    finale.appendChild(title);

    const confetti = document.createElement("div");
    confetti.className = "bubble-confetti";
    for (let i = 0; i < 36; i++) {
      const bubble = document.createElement("i");
      bubble.style.setProperty("--x", `${8 + (i * 7) % 86}%`);
      bubble.style.setProperty("--delay", `${(i % 9) * 0.12}s`);
      bubble.style.setProperty("--size", `${10 + (i % 5) * 6}px`);
      confetti.appendChild(bubble);
    }
    finale.appendChild(confetti);

    audio.playSequence([voiceRoster.CHEER_WOOHOO_PATH, sfxPaths.finale]);

    for (let i = 1; i <= 10; i++) {
      window.setTimeout(() => {
        const layerRect = numeralLayer.getBoundingClientRect();
        const origin = {
          left: layerRect.left + layerRect.width / 2,
          top: layerRect.top + layerRect.height / 2,
          width: 0,
          height: 0
        };
        floatNumeral(numeralLayer, i, origin);
        audio.playSequence([voiceRoster.NUMBER_VOICE_PATHS[i - 1]]);
      }, 900 + i * 620);
    }

    window.setTimeout(() => game.restart(), 900 + 11 * 620 + 1800);
  });
}
```

- [ ] **Step 4: Run unit tests**

Run:

```bash
npm test
```

Expected: PASS for all unit tests.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/scene.js tests/e2e/tap-flow.spec.mjs tests/e2e/round-progression.spec.mjs tests/e2e/finale.spec.mjs
git commit -m "Render ocean counting scene"
```

Expected: commit succeeds with scene and E2E files staged.

## Task 5: Replace Styling With Ocean Layout

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Replace `src/styles.css` with ocean styles**

Replace `src/styles.css` with:

```css
:root {
  --bg: #74d7ef;
  --deep: #17658f;
  --reef-pink: #ff7aa8;
  --reef-coral: #ff9f68;
  --reef-green: #34b978;
  --sand: #f5d78a;
  --ink: #12384c;
  --white: #fffaf0;
  --n-1: #e74c3c;
  --n-2: #f39c12;
  --n-3: #f1c40f;
  --n-4: #2ecc71;
  --n-5: #1abc9c;
  --n-6: #3498db;
  --n-7: #5e60ce;
  --n-8: #9b59b6;
  --n-9: #e91e63;
  --n-10: #d4af37;
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }
html, body { height: 100%; margin: 0; }
body {
  font-family: -apple-system, "Helvetica Neue", sans-serif;
  background: var(--bg);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

#rotate-hint {
  display: none;
  position: fixed;
  inset: 0;
  background: linear-gradient(#8ee8ff, #2c9dc5);
  color: var(--ink);
  font-size: 1.4rem;
  text-align: center;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

@media (orientation: portrait) {
  #rotate-hint { display: flex; }
  #stage, #start-screen { display: none !important; }
}

#start-screen {
  position: fixed;
  inset: 0;
  background: url("/assets/images/ocean-bg.png") center/cover no-repeat, linear-gradient(#84e4fb, #2d9cca);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 50;
}

.start-cue {
  font-size: 17vmin;
  font-weight: 900;
  color: var(--white);
  letter-spacing: 0;
  text-shadow: 0 8px 0 rgba(18, 56, 76, 0.26), 0 0 28px rgba(255, 255, 255, 0.7);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

#stage {
  position: fixed;
  inset: 0;
  display: block;
  background: var(--bg);
}

.ocean-bg {
  position: absolute;
  inset: 0;
  background: url("/assets/images/ocean-bg.png") center/cover no-repeat, linear-gradient(#8ee8ff, #2187b3 68%, #f5d78a);
  z-index: 0;
}

.sunbeams {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(105deg, rgba(255,255,255,0.28) 0 8%, transparent 8% 22%, rgba(255,255,255,0.16) 22% 30%, transparent 30%),
    radial-gradient(circle at 20% 0%, rgba(255, 255, 220, 0.45), transparent 34%);
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 1;
}

.count-ribbon {
  position: absolute;
  left: 50%;
  top: max(10px, env(safe-area-inset-top));
  transform: translateX(-50%);
  display: flex;
  gap: clamp(5px, 1vw, 10px);
  align-items: center;
  justify-content: center;
  min-height: 11vmin;
  padding: 0 2vw;
  z-index: 8;
  pointer-events: none;
}

.count-bubble {
  width: clamp(30px, 7.6vmin, 56px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: rgba(18, 56, 76, 0.62);
  font-size: clamp(18px, 4.5vmin, 34px);
  font-weight: 900;
  background: rgba(255, 255, 255, 0.46);
  border: 2px solid rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 3px 8px rgba(255,255,255,0.55), 0 3px 10px rgba(0, 65, 100, 0.15);
}

.count-bubble.filled {
  color: var(--white);
  background: #ff7aa8;
  border-color: #fff3a8;
  transform: scale(1.08);
}

.animal-layer {
  position: absolute;
  inset: 12% 3% 4% 12%;
  z-index: 4;
}

.animal {
  position: absolute;
  width: clamp(78px, 16vmin, 150px);
  aspect-ratio: 1;
  border: 0;
  background: center/contain no-repeat;
  background-color: transparent;
  cursor: pointer;
  outline: none;
  padding: 16px;
  transform:
    translate(-50%, -50%)
    scaleX(var(--animal-flip, 1))
    rotate(var(--animal-rotate, 0deg))
    scale(var(--animal-scale, 1));
  filter: drop-shadow(0 8px 10px rgba(0, 47, 74, 0.24));
  animation: animal-bob 2.1s ease-in-out infinite;
  touch-action: manipulation;
}

.animal::after {
  content: "";
  position: absolute;
  inset: 10%;
  border-radius: 999px;
  opacity: 0;
  border: 4px solid rgba(255, 247, 160, 0.9);
  box-shadow: 0 0 22px rgba(255, 247, 160, 0.65);
  transform: scale(0.86);
  pointer-events: none;
}

.animal.counted {
  filter: drop-shadow(0 0 16px rgba(255, 241, 117, 0.95)) drop-shadow(0 8px 10px rgba(0, 47, 74, 0.2));
  animation: counted-pop 0.45s ease-out;
}

.animal.counted::after {
  opacity: 1;
  animation: bubble-ring 0.8s ease-out;
}

.animal.nudge {
  animation: animal-nudge 0.75s ease-in-out;
}

@keyframes animal-bob {
  0%, 100% {
    transform: translate(-50%, -50%) scaleX(var(--animal-flip, 1)) rotate(var(--animal-rotate, 0deg)) scale(var(--animal-scale, 1));
  }
  50% {
    transform: translate(-50%, calc(-50% - 8px)) scaleX(var(--animal-flip, 1)) rotate(var(--animal-rotate, 0deg)) scale(var(--animal-scale, 1));
  }
}

@keyframes animal-nudge {
  0%, 100% {
    transform: translate(-50%, -50%) scaleX(var(--animal-flip, 1)) rotate(var(--animal-rotate, 0deg)) scale(var(--animal-scale, 1));
  }
  35% {
    transform: translate(-50%, -50%) scaleX(var(--animal-flip, 1)) rotate(calc(var(--animal-rotate, 0deg) - 10deg)) scale(calc(var(--animal-scale, 1) * 1.08));
  }
  70% {
    transform: translate(-50%, -50%) scaleX(var(--animal-flip, 1)) rotate(calc(var(--animal-rotate, 0deg) + 10deg)) scale(calc(var(--animal-scale, 1) * 1.08));
  }
}

@keyframes counted-pop {
  0% { transform: translate(-50%, -50%) scaleX(var(--animal-flip, 1)) rotate(var(--animal-rotate, 0deg)) scale(var(--animal-scale, 1)); }
  45% { transform: translate(-50%, -50%) scaleX(var(--animal-flip, 1)) rotate(var(--animal-rotate, 0deg)) scale(calc(var(--animal-scale, 1) * 1.18)); }
  100% { transform: translate(-50%, -50%) scaleX(var(--animal-flip, 1)) rotate(var(--animal-rotate, 0deg)) scale(var(--animal-scale, 1)); }
}

@keyframes bubble-ring {
  0% { opacity: 0; transform: scale(0.72); }
  35% { opacity: 1; }
  100% { opacity: 0.75; transform: scale(1.08); }
}

.numeral-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 9;
}

.numeral {
  position: absolute;
  font-size: 18vmin;
  font-weight: 900;
  pointer-events: none;
  transform: translate(-50%, -50%);
  text-shadow: 0 6px 0 rgba(18, 56, 76, 0.24);
  animation: numeral-float 1s ease-out forwards;
  -webkit-text-stroke: 4px var(--white);
}

.numeral.n-1  { color: var(--n-1); }
.numeral.n-2  { color: var(--n-2); }
.numeral.n-3  { color: var(--n-3); }
.numeral.n-4  { color: var(--n-4); }
.numeral.n-5  { color: var(--n-5); }
.numeral.n-6  { color: var(--n-6); }
.numeral.n-7  { color: var(--n-7); }
.numeral.n-8  { color: var(--n-8); }
.numeral.n-9  { color: var(--n-9); }
.numeral.n-10 { color: var(--n-10); }

@keyframes numeral-float {
  0% { transform: translate(-50%, -50%) scale(0.45); opacity: 0; }
  18% { transform: translate(-50%, -68%) scale(1.25); opacity: 1; }
  65% { transform: translate(-50%, -135%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -190%) scale(0.92); opacity: 0; }
}

.celebration,
.finale {
  position: absolute;
  inset: 0;
  z-index: 12;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.celebration {
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.36), transparent 55%);
}

.finale {
  overflow: hidden;
  background: rgba(79, 209, 237, 0.28);
}

.finale-title {
  color: var(--white);
  font-size: clamp(42px, 13vmin, 108px);
  font-weight: 900;
  text-shadow: 0 8px 0 rgba(18, 56, 76, 0.24);
  z-index: 2;
}

.bubble-confetti {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.bubble-confetti i {
  position: absolute;
  left: var(--x);
  bottom: -10%;
  width: var(--size);
  aspect-ratio: 1;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.28);
  animation: bubble-rise 2.5s ease-in infinite;
  animation-delay: var(--delay);
}

@keyframes bubble-rise {
  from { transform: translateY(0) scale(0.7); opacity: 0; }
  20% { opacity: 1; }
  to { transform: translateY(-120vh) scale(1.2); opacity: 0; }
}
```

- [ ] **Step 2: Build**

Run:

```bash
npm run build
```

Expected: PASS, producing `dist/`.

- [ ] **Step 3: Run E2E**

Run:

```bash
npm run test:e2e
```

Expected: E2E may still fail if image assets are absent, but DOM assertions for `.animal`, `.count-bubble`, and `.finale-title` should now be satisfiable once assets exist.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/styles.css
git commit -m "Style underwater counting layout"
```

Expected: commit succeeds with only `src/styles.css` staged.

## Task 6: Produce Ocean Visual Assets

**Files:**
- Create or replace: `assets/images/ocean-bg.png`
- Create or replace: `assets/images/turtle.png`
- Create or replace: `assets/images/dolphin.png`
- Create or replace: `assets/images/fish.png`
- Create or replace: `assets/images/crab.png`
- Create or replace: `assets/images/octopus.png`
- Create or replace: `assets/images/seahorse.png`
- Create or replace: `assets/images/whale.png`
- Create or replace: `assets/images/starfish.png`
- Create or replace: `assets/images/jellyfish.png`
- Create or replace: `assets/images/shark.png`

- [ ] **Step 1: Generate the background image**

Use the `imagegen` skill or the available image generation tool with this prompt:

```text
Landscape 16:9 polished 3D cartoon underwater reef scene for a toddler counting game. A happy Brazilian toddler boy named Natan is visible in the lower-left wearing safe cute diving goggles, snorkel, and small fins, smiling and swimming. Leave the central and right open water area clear for large tappable sea animals. Bright turquoise water, golden sunbeams from above, coral pink reef, green seaweed, sandy sea floor, warm bedtime-friendly lighting, expressive rounded shapes, no text, no numbers, no scary elements.
```

Save the final image as `assets/images/ocean-bg.png`.

- [ ] **Step 2: Generate transparent animal sprites**

Use this shared style phrase for every sprite:

```text
Polished 3D cartoon toddler-friendly sea animal sprite, transparent background, rounded expressive face, soft warm lighting, high readability at small sizes, front three-quarter pose, no text, no numbers, no extra background objects.
```

Generate and save each file with these animal-specific prompts:

```text
Friendly turtle, polished 3D cartoon toddler-friendly sea animal sprite, transparent background, rounded expressive face, soft warm lighting, high readability at small sizes, front three-quarter pose, no text, no numbers, no extra background objects.
```

```text
Friendly dolphin, polished 3D cartoon toddler-friendly sea animal sprite, transparent background, rounded expressive face, soft warm lighting, high readability at small sizes, front three-quarter pose, no text, no numbers, no extra background objects.
```

```text
Friendly bright reef fish, polished 3D cartoon toddler-friendly sea animal sprite, transparent background, rounded expressive face, soft warm lighting, high readability at small sizes, front three-quarter pose, no text, no numbers, no extra background objects.
```

```text
Friendly crab, polished 3D cartoon toddler-friendly sea animal sprite, transparent background, rounded expressive face, soft warm lighting, high readability at small sizes, front three-quarter pose, no text, no numbers, no extra background objects.
```

```text
Friendly octopus, polished 3D cartoon toddler-friendly sea animal sprite, transparent background, rounded expressive face, soft warm lighting, high readability at small sizes, front three-quarter pose, no text, no numbers, no extra background objects.
```

```text
Friendly seahorse, polished 3D cartoon toddler-friendly sea animal sprite, transparent background, rounded expressive face, soft warm lighting, high readability at small sizes, front three-quarter pose, no text, no numbers, no extra background objects.
```

```text
Friendly baby whale, polished 3D cartoon toddler-friendly sea animal sprite, transparent background, rounded expressive face, soft warm lighting, high readability at small sizes, front three-quarter pose, no text, no numbers, no extra background objects.
```

```text
Friendly starfish with a cute face, polished 3D cartoon toddler-friendly sea animal sprite, transparent background, rounded expressive face, soft warm lighting, high readability at small sizes, front three-quarter pose, no text, no numbers, no extra background objects.
```

```text
Friendly jellyfish, polished 3D cartoon toddler-friendly sea animal sprite, transparent background, rounded expressive face, soft warm lighting, high readability at small sizes, front three-quarter pose, no text, no numbers, no extra background objects.
```

```text
Friendly smiling baby shark, cute not scary, polished 3D cartoon toddler-friendly sea animal sprite, transparent background, rounded expressive face, soft warm lighting, high readability at small sizes, front three-quarter pose, no text, no numbers, no extra background objects.
```

Save outputs to the exact filenames listed in this task.

- [ ] **Step 3: Verify image files exist**

Run:

```bash
test -f assets/images/ocean-bg.png
test -f assets/images/turtle.png
test -f assets/images/dolphin.png
test -f assets/images/fish.png
test -f assets/images/crab.png
test -f assets/images/octopus.png
test -f assets/images/seahorse.png
test -f assets/images/whale.png
test -f assets/images/starfish.png
test -f assets/images/jellyfish.png
test -f assets/images/shark.png
```

Expected: all commands exit 0.

- [ ] **Step 4: Build and run E2E**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: PASS for E2E if layout and asset paths are correct.

- [ ] **Step 5: Commit**

Run:

```bash
git add -f assets/images/ocean-bg.png assets/images/turtle.png assets/images/dolphin.png assets/images/fish.png assets/images/crab.png assets/images/octopus.png assets/images/seahorse.png assets/images/whale.png assets/images/starfish.png assets/images/jellyfish.png assets/images/shark.png
git commit -m "Add ocean counting artwork"
```

Expected: commit succeeds with only the ocean image assets staged.

## Task 7: Update PWA Icons, Manifest, And Service Worker

**Files:**
- Modify: `scripts/make-icons.mjs`
- Modify: `public/manifest.webmanifest`
- Modify: `public/service-worker.js`
- Modify: `public/icon-192.png`
- Modify: `public/icon-512.png`
- Modify: `public/splash-1170x2532.png`

- [ ] **Step 1: Update `scripts/make-icons.mjs` source art**

Change the source image and background color section to:

```js
const sourcePath = path.resolve("assets/images/turtle.png");
const outDir = path.resolve("public");
await fs.mkdir(outDir, { recursive: true });

const ICON_SIZES = [192, 512];
const SPLASH = { width: 1170, height: 2532 };
const BG_COLOR = { r: 116, g: 215, b: 239, alpha: 1 };
```

Then replace every `tooth` variable name in the file with `source`, and every `toothPath` reference with `sourcePath`. The resulting resize block should include:

```js
const source = await sharp(sourcePath).resize({ height: target, fit: "inside" }).toBuffer();
const meta = await sharp(source).metadata();
```

- [ ] **Step 2: Update manifest display metadata**

Open `public/manifest.webmanifest` and set:

```json
{
  "name": "Natan's Counting Dive",
  "short_name": "Counting Dive",
  "description": "A toddler ocean counting game for learning English numbers 1 to 10.",
  "theme_color": "#74d7ef",
  "background_color": "#74d7ef",
  "display": "standalone",
  "orientation": "landscape",
  "start_url": "./",
  "scope": "./",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Update service worker cache**

In `public/service-worker.js`, change:

```js
const CACHE_VERSION = "v2";
```

Replace the old image precache entries with:

```js
  // Ocean artwork
  "./assets/images/ocean-bg.png",
  "./assets/images/turtle.png",
  "./assets/images/dolphin.png",
  "./assets/images/fish.png",
  "./assets/images/crab.png",
  "./assets/images/octopus.png",
  "./assets/images/seahorse.png",
  "./assets/images/whale.png",
  "./assets/images/starfish.png",
  "./assets/images/jellyfish.png",
  "./assets/images/shark.png",
```

Replace sound comments with:

```js
  // Ocean sounds
  "./assets/sounds/bubble-pop.wav",
  "./assets/sounds/drain-swoosh.wav",
  "./assets/sounds/confetti-cheer.wav"
```

- [ ] **Step 4: Generate icons**

Run:

```bash
npm run icons:make
```

Expected: `public/icon-192.png`, `public/icon-512.png`, and `public/splash-1170x2532.png` are regenerated.

- [ ] **Step 5: Build**

Run:

```bash
npm run build
```

Expected: PASS and `dist/assets/images/ocean-bg.png` exists.

- [ ] **Step 6: Commit**

Run:

```bash
git add scripts/make-icons.mjs public/manifest.webmanifest public/service-worker.js public/icon-192.png public/icon-512.png public/splash-1170x2532.png
git commit -m "Update PWA assets for counting dive"
```

Expected: commit succeeds with PWA files staged.

## Task 8: Final Verification And Polish

**Files:**
- Modify: `src/styles.css` if visual QA finds spacing issues.
- Modify: `src/rounds.js` if any high-count round has cramped targets.
- Modify: `tests/e2e/*.spec.mjs` only if assertions need to match intentional UI text/classes.

- [ ] **Step 1: Run unit tests**

Run:

```bash
npm test
```

Expected: PASS for all unit tests.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run E2E tests**

Run:

```bash
npm run test:e2e
```

Expected: PASS for mobile-landscape WebKit.

- [ ] **Step 4: Start local preview for manual visual QA**

Run:

```bash
npm run preview -- --host 127.0.0.1
```

Expected: Vite serves the production build at `http://127.0.0.1:4173/`.

- [ ] **Step 5: Manually inspect the important rounds**

Open `http://127.0.0.1:4173/` and verify:

```text
Round 1: one turtle is large, centered in playable water, and easy to tap.
Round 5: five octopuses fit without crowding the count ribbon.
Round 8: eight starfish are all still toddler-sized.
Round 10: ten sharks are friendly, not scary, and every target can be tapped.
Finale: underwater bubbles and 1 2 3 4 5 6 7 8 9 10 appear clearly.
Portrait: rotate hint appears and the stage is hidden.
```

- [ ] **Step 6: Stop the preview server**

Press `Ctrl-C` in the preview terminal.

Expected: no long-running server remains.

- [ ] **Step 7: Commit polish changes if any were needed**

If files changed during visual QA, run:

```bash
git add src/styles.css src/rounds.js tests/e2e/tap-flow.spec.mjs tests/e2e/round-progression.spec.mjs tests/e2e/finale.spec.mjs
git commit -m "Polish counting dive layout"
```

Expected: commit succeeds if there were polish changes. If there were no changes, do not create an empty commit.

## Completion Criteria

- `npm test` passes.
- `npm run build` passes.
- `npm run test:e2e` passes.
- The production preview works at `http://127.0.0.1:4173/`.
- The service worker cache version is `v2`.
- The old tooth, brush, bathroom, bug, and Safari squad assets are not referenced by HTML, JS, CSS, manifest, scripts, or service worker.
- Natan appears in the underwater background.
- Each tap plays the English number first and shows the matching numeral.
- Counted animals remain visible.
- Round 10 remains tappable on iPhone 14 landscape.
