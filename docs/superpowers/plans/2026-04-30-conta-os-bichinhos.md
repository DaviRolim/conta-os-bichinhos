# Conta os Bichinhos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Conta os Bichinhos", a brush-the-bugs counting game for Natan (2y4m) that teaches English numbers 1–10. Each tap removes a sugar bug from a smiling tooth, plays the matching English word ("ONE!" through "TEN!"), and floats up the matching numeral.

**Architecture:** Vanilla HTML/CSS/JS + ESM, modeled after `safari-de-sons`. State lives in a small event-emitting `game.js` module; `scene.js` is DOM-only and listens for events; `audio.js` is copied verbatim from Safari; assets are generated via the `flow-asset-generation` skill (sprites), ElevenLabs (voice), and Pixabay (SFX).

**Tech Stack:** Node 20, Vite 5, Vanilla JS (ESM), Playwright (mobile-landscape WebKit), node:test, GitHub Actions → GitHub Pages, ElevenLabs TTS, Google Labs Flow / Nano Banana 2 + rembg.

**Repo:** new `conta-os-bichinhos` under the `davirolim94` GitHub account (personal credentials).

**Working directory for all paths in this plan:** `/Users/davirolim/playground/creatives/conta-os-bichinhos/` (project root). Sibling references like `../safari-de-sons/...` resolve to `/Users/davirolim/playground/creatives/safari-de-sons/`.

---

## File Structure

Files this plan creates (each has one clear responsibility):

```
conta-os-bichinhos/
├── index.html                            # entry, PWA tags, rotate hint, mount node
├── vite.config.js                        # base "./", publicDir "public"
├── playwright.config.mjs                 # iPhone 14 landscape WebKit
├── package.json                          # scripts + dev deps
├── .npmrc                                # public npm registry pin
├── .gitignore                            # standard + .env + voice-samples
├── .env.example                          # ELEVENLABS_API_KEY
├── CLAUDE.md                             # project orientation
│
├── src/
│   ├── audio.js                          # copy from ../safari-de-sons/src/audio.js verbatim
│   ├── rounds.js                         # ROUNDS data (10 rounds, hand-tuned bug positions)
│   ├── voice-roster.js                   # 12 clips: 10 numbers + AMAZING + WOOHOO
│   ├── game.js                           # state machine (EventTarget) — no DOM, no audio
│   ├── numerals.js                       # float-up animation helper (DOM/CSS)
│   ├── scene.js                          # DOM rendering, listens to game events
│   ├── main.js                           # bootstrap: audio unlock, game.start(), SW register
│   └── styles.css                        # all theme + animations + layouts
│
├── assets/
│   ├── images/                           # generated: bug-a/b/c.png, tooth.png, brush.png, bg.png; copied: lion.png, zebra.png, hippo.png, giraffe.png, lemur.png
│   ├── voice/                            # 12 ElevenLabs MP3s
│   └── sounds/                           # bubble-pop.mp3, drain-swoosh.mp3, confetti-cheer.mp3 + LICENSES.md
│
├── public/
│   ├── manifest.webmanifest
│   ├── service-worker.js                 # cache-first; CACHE_VERSION constant
│   ├── icon-192.png / icon-512.png
│   └── splash-1170x2532.png
│
├── scripts/
│   ├── voice-config.mjs                  # voice ID + model settings (copy from Safari)
│   ├── generate-voiceover.mjs            # TTS for the 12-clip roster
│   └── make-icons.mjs                    # PWA icons + splash from tooth.png
│
├── tests/
│   ├── unit/
│   │   ├── audio.test.js                 # cooldown / interrupt / sequence
│   │   ├── rounds.test.js                # shape + non-overlap sanity
│   │   └── game.test.js                  # state machine
│   └── e2e/
│       ├── tap-flow.spec.mjs             # round 1: tap bug → numeral → bug gone
│       ├── round-progression.spec.mjs    # finish round → next round loads
│       └── finale.spec.mjs               # round 10 → finale screen
│
└── .github/
    └── workflows/
        └── deploy.yml                    # test → build → deploy on push to main
```

The plan defers asset generation until after the game is playable with CSS placeholders — that way the whole loop can be tested before we spend time on Flow / ElevenLabs work.

---

## Task 1: Project scaffold

**Files:**
- Create: `conta-os-bichinhos/package.json`
- Create: `conta-os-bichinhos/vite.config.js`
- Create: `conta-os-bichinhos/playwright.config.mjs`
- Create: `conta-os-bichinhos/.npmrc`
- Create: `conta-os-bichinhos/.gitignore`
- Create: `conta-os-bichinhos/.env.example`
- Create: `conta-os-bichinhos/index.html`

- [ ] **Step 1: Verify project root exists**

Run: `ls /Users/davirolim/playground/creatives/conta-os-bichinhos/`
Expected: a `docs/` directory containing the spec + plan.

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "conta-os-bichinhos",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && cp -R assets dist/",
    "preview": "vite preview --host",
    "voiceover:generate": "node scripts/generate-voiceover.mjs",
    "icons:make": "node scripts/make-icons.mjs",
    "test": "node --test $(find tests/unit -name '*.test.js' | sort)",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "dotenv": "^16.4.5",
    "sharp": "^0.33.5",
    "vite": "^5.4.10"
  }
}
```

- [ ] **Step 3: Write `vite.config.js`**

```js
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: "index.html"
      }
    }
  },
  publicDir: "public",
  server: {
    port: 4173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
});
```

- [ ] **Step 4: Write `playwright.config.mjs`**

```js
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/*.spec.mjs"],
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 60000
  },
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 14 landscape"] }
    }
  ]
});
```

- [ ] **Step 5: Write `.npmrc`**

```
registry=https://registry.npmjs.org/
```

(Pins to the public registry, overriding any machine-wide JFrog config. Don't delete — CI installs will fail without it. Same gotcha as Safari.)

- [ ] **Step 6: Write `.gitignore`**

```
node_modules/
dist/
.env
voice-samples/
test-results/
playwright-report/
.DS_Store
```

- [ ] **Step 7: Write `.env.example`**

```
ELEVENLABS_API_KEY=
```

- [ ] **Step 8: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Conta os Bichinhos</title>

    <link rel="manifest" href="manifest.webmanifest" />
    <meta name="theme-color" content="#7ab8ff" />

    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Conta" />
    <link rel="apple-touch-icon" href="icon-192.png" />

    <link rel="apple-touch-startup-image" href="splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />

    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <div id="rotate-hint">
      <p>Rotate the device to landscape 🪥</p>
    </div>
    <div id="start-screen" aria-label="Tap to begin">
      <div class="start-cue">TAP!</div>
    </div>
    <main id="stage" aria-label="Counting scene" hidden>
      <div class="bathroom-bg"></div>
      <div class="tooth" aria-hidden="true"></div>
      <div class="drain" aria-hidden="true"></div>
      <div class="brush" aria-hidden="true"></div>
      <div class="bug-layer"></div>
      <div class="numeral-layer" aria-hidden="true"></div>
      <div class="celebration" hidden></div>
      <div class="finale" hidden></div>
    </main>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 9: Install dependencies**

Run: `npm install`
Expected: `node_modules/` populated; lockfile written. No `vite` errors.

- [ ] **Step 10: Commit**

(Skip until Task 2 finishes — `git init` happens there.)

---

## Task 2: Git init with personal identity

**Files:**
- Create: `conta-os-bichinhos/.git/` (via `git init`)

- [ ] **Step 1: Initialize repo**

Run from project root:
```
git init -b main
```
Expected: "Initialized empty Git repository in .../conta-os-bichinhos/.git/"

- [ ] **Step 2: Set per-repo personal git identity**

```
git config user.email "davirolim94@gmail.com"
git config user.name "Davi Rolim"
```

- [ ] **Step 3: Verify identity is repo-local, not global**

Run: `git config --local user.email && git config --local user.name`
Expected:
```
davirolim94@gmail.com
Davi Rolim
```

- [ ] **Step 4: Stage scaffold + initial commit**

```
git add package.json package-lock.json vite.config.js playwright.config.mjs .npmrc .gitignore .env.example index.html
git commit -m "chore: scaffold Vite + Playwright + PWA shell"
```

- [ ] **Step 5: Force-add the spec + plan**

(Davi's global `~/.gitignore` excludes `docs/`. This is intentional — same pattern as Safari.)

```
git add -f docs/superpowers/specs/2026-04-30-conta-os-bichinhos-design.md
git add -f docs/superpowers/plans/2026-04-30-conta-os-bichinhos.md
git commit -m "docs: design + implementation plan"
```

---

## Task 3: CLAUDE.md project orientation

**Files:**
- Create: `conta-os-bichinhos/CLAUDE.md`

- [ ] **Step 1: Write `CLAUDE.md`**

```markdown
# Conta os Bichinhos

A counting game for Davi's son **Natan** (2y4m, Portuguese-native, pre-reader). Tap sugar bugs sitting on a smiling tooth to "brush" them down a drain — each tap plays the next English number ("ONE!" through "TEN!") and floats up the matching numeral. Numbers 1–10 across 10 sequential rounds; finale at round 10 with confetti and the Safari animal squad.

**Live:** https://davirolim94.github.io/conta-os-bichinhos/ (after Task 19)
**Repo:** https://github.com/davirolim94/conta-os-bichinhos (after Task 19)
**Game #4** in the planned 9-game series. Spec: `docs/superpowers/specs/2026-04-30-conta-os-bichinhos-design.md`.

## Audience

Natan is 2y4m. The game has no fail state, no instructions, no reading. Tap order does not matter — bugs may be tapped in any sequence and the count just increments.

## Tech stack

Vanilla HTML/CSS/JS + ESM. No runtime framework. Vite for dev/build, Playwright for E2E, node:test for units. Service worker for offline. GitHub Pages via Actions.

- **Runtime deps:** none.
- **Dev deps:** `vite`, `@playwright/test`, `dotenv`, `sharp`.
- **External services:** ElevenLabs (TTS), Pixabay (SFX), Google Labs Flow / Nano Banana 2 (sprites). All called at build time, never runtime.
- **Tooling:** Node ≥ 20, `pipx`+`rembg` for sprite alpha extraction, `gh` CLI for repo/Pages.

## Run / build / test

```bash
npm run dev               # http://localhost:4173 (HMR)
npm run build             # vite build && cp -R assets dist/
npm run preview           # preview prod bundle
npm test                  # node --test, unit tests
npm run test:e2e          # Playwright (mobile-landscape WebKit)
npm run voiceover:generate
npm run icons:make
```

## Module map

- `src/rounds.js` — pure data, 10 rounds × bug positions (normalized 0..1).
- `src/voice-roster.js` — pure data, 12 voice clip paths.
- `src/game.js` — state machine (EventTarget). No DOM, no audio.
- `src/scene.js` — DOM rendering, listens for `game` events.
- `src/numerals.js` — float-up numeral animation.
- `src/audio.js` — verbatim copy of `../safari-de-sons/src/audio.js`.
- `src/main.js` — wires everything together, audio unlock, SW register.

## Conventions

- **Commits:** no co-author lines. Max 2 sentences. Imperative subject.
- **Tests:** TDD where applicable (rounds, audio, game). E2E for layout + integration. Run `npm test` and `npm run test:e2e` before pushing.
- **Branching:** straight to `main`. Single-developer hobby project.
- **Asset edits:** replace files in `assets/<kind>/` with same filename. Don't introduce new filenames without updating the manifest in `src/`.

## Gotchas

- `node --test` glob doesn't expand on Ubuntu CI — `test` script uses `find` instead. Don't change it.
- `.npmrc` pins to public npm — don't delete (overrides machine-wide JFrog config).
- Vite doesn't copy `assets/` automatically — `build` is `vite build && cp -R assets dist/`.
- Service worker `CACHE_VERSION` must be bumped manually on every deploy that touches HTML or precached assets.
- `Audio.play()` must be synchronous from the gesture event. `scene.js` calls `audio.playSequence(...)` synchronously inside the tap handler — keep it that way.
- Landscape-locked. Portrait shows the rotate hint.
- Playwright device profile is `iPhone 14 landscape` (not `iPhone 14`).
- `docs/`, `CLAUDE.md`, `AGENTS.md` are excluded by Davi's global `~/.gitignore` — `git add -f` to track them in this repo.

## Roadmap

This is game #4 of 9. Roadmap lives in `../safari-de-sons/docs/roadmap.md`. Don't start the next game until Natan has played this one for 2+ weeks (rule waived for this build).
```

- [ ] **Step 2: Commit**

```
git add -f CLAUDE.md
git commit -m "docs: add CLAUDE.md project orientation"
```

---

## Task 4: Audio module (copy from Safari, verbatim) + tests

**Files:**
- Create: `conta-os-bichinhos/src/audio.js` (copied verbatim)
- Create: `conta-os-bichinhos/tests/unit/audio.test.js`

- [ ] **Step 1: Copy audio.js verbatim**

Run from project root:
```
cp ../safari-de-sons/src/audio.js src/audio.js
```

- [ ] **Step 2: Verify file matches Safari's**

Run: `diff src/audio.js ../safari-de-sons/src/audio.js`
Expected: no output (identical).

- [ ] **Step 3: Copy the unit tests verbatim**

```
cp ../safari-de-sons/tests/unit/audio.test.js tests/unit/audio.test.js
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npm test`
Expected: all audio tests pass. (Other test files don't exist yet, so the `find` glob may pass cleanly with just audio.test.js.)

- [ ] **Step 5: Commit**

```
git add src/audio.js tests/unit/audio.test.js
git commit -m "feat(audio): copy audio system from safari-de-sons"
```

---

## Task 5: Rounds data + non-overlap test (TDD)

**Files:**
- Create: `conta-os-bichinhos/tests/unit/rounds.test.js`
- Create: `conta-os-bichinhos/src/rounds.js`

- [ ] **Step 1: Write the failing test**

`tests/unit/rounds.test.js`:
```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module .../src/rounds.js" or similar.

- [ ] **Step 3: Implement `src/rounds.js`**

Bug positions are hand-tuned for visual balance over a tooth shape. The tooth is rendered as ~80% of the stage width (centered) and ~70% of the stage height. Coordinates are normalized within the tooth's bounding box (0..1), where (0.5, 0.5) is the center.

```js
// src/rounds.js
// Pure data. ROUNDS[i] is round number i+1 (so ROUNDS[0].n === 1).
// Bug positions are normalized (0..1) within the tooth's render box.
// Hand-tuned to avoid overlap (≥ 0.18 separation) and feel non-grid-like.

export const ROUNDS = [
  {
    n: 1,
    bugs: [
      { id: "r1-b1", variant: "A", x: 0.50, y: 0.50 }
    ]
  },
  {
    n: 2,
    bugs: [
      { id: "r2-b1", variant: "A", x: 0.35, y: 0.45 },
      { id: "r2-b2", variant: "B", x: 0.65, y: 0.55 }
    ]
  },
  {
    n: 3,
    bugs: [
      { id: "r3-b1", variant: "A", x: 0.30, y: 0.40 },
      { id: "r3-b2", variant: "B", x: 0.55, y: 0.60 },
      { id: "r3-b3", variant: "C", x: 0.75, y: 0.40 }
    ]
  },
  {
    n: 4,
    bugs: [
      { id: "r4-b1", variant: "A", x: 0.28, y: 0.38 },
      { id: "r4-b2", variant: "B", x: 0.55, y: 0.32 },
      { id: "r4-b3", variant: "C", x: 0.72, y: 0.55 },
      { id: "r4-b4", variant: "A", x: 0.40, y: 0.65 }
    ]
  },
  {
    n: 5,
    bugs: [
      { id: "r5-b1", variant: "A", x: 0.25, y: 0.35 },
      { id: "r5-b2", variant: "B", x: 0.50, y: 0.28 },
      { id: "r5-b3", variant: "C", x: 0.75, y: 0.38 },
      { id: "r5-b4", variant: "A", x: 0.35, y: 0.60 },
      { id: "r5-b5", variant: "B", x: 0.65, y: 0.65 }
    ]
  },
  {
    n: 6,
    bugs: [
      { id: "r6-b1", variant: "A", x: 0.22, y: 0.30 },
      { id: "r6-b2", variant: "B", x: 0.48, y: 0.25 },
      { id: "r6-b3", variant: "C", x: 0.74, y: 0.30 },
      { id: "r6-b4", variant: "A", x: 0.30, y: 0.55 },
      { id: "r6-b5", variant: "B", x: 0.55, y: 0.60 },
      { id: "r6-b6", variant: "C", x: 0.78, y: 0.55 }
    ]
  },
  {
    n: 7,
    bugs: [
      { id: "r7-b1", variant: "A", x: 0.20, y: 0.28 },
      { id: "r7-b2", variant: "B", x: 0.42, y: 0.22 },
      { id: "r7-b3", variant: "C", x: 0.65, y: 0.25 },
      { id: "r7-b4", variant: "A", x: 0.85, y: 0.40 },
      { id: "r7-b5", variant: "B", x: 0.30, y: 0.55 },
      { id: "r7-b6", variant: "C", x: 0.55, y: 0.60 },
      { id: "r7-b7", variant: "A", x: 0.78, y: 0.65 }
    ]
  },
  {
    n: 8,
    bugs: [
      { id: "r8-b1", variant: "A", x: 0.18, y: 0.25 },
      { id: "r8-b2", variant: "B", x: 0.40, y: 0.20 },
      { id: "r8-b3", variant: "C", x: 0.62, y: 0.22 },
      { id: "r8-b4", variant: "A", x: 0.84, y: 0.30 },
      { id: "r8-b5", variant: "B", x: 0.22, y: 0.50 },
      { id: "r8-b6", variant: "C", x: 0.45, y: 0.55 },
      { id: "r8-b7", variant: "A", x: 0.68, y: 0.50 },
      { id: "r8-b8", variant: "B", x: 0.85, y: 0.65 }
    ]
  },
  {
    n: 9,
    bugs: [
      { id: "r9-b1", variant: "A", x: 0.18, y: 0.22 },
      { id: "r9-b2", variant: "B", x: 0.38, y: 0.20 },
      { id: "r9-b3", variant: "C", x: 0.58, y: 0.20 },
      { id: "r9-b4", variant: "A", x: 0.78, y: 0.25 },
      { id: "r9-b5", variant: "B", x: 0.20, y: 0.45 },
      { id: "r9-b6", variant: "C", x: 0.42, y: 0.48 },
      { id: "r9-b7", variant: "A", x: 0.65, y: 0.45 },
      { id: "r9-b8", variant: "B", x: 0.86, y: 0.48 },
      { id: "r9-b9", variant: "C", x: 0.50, y: 0.72 }
    ]
  },
  {
    n: 10,
    bugs: [
      { id: "r10-b1",  variant: "A", x: 0.16, y: 0.20 },
      { id: "r10-b2",  variant: "B", x: 0.36, y: 0.18 },
      { id: "r10-b3",  variant: "C", x: 0.55, y: 0.18 },
      { id: "r10-b4",  variant: "A", x: 0.74, y: 0.20 },
      { id: "r10-b5",  variant: "B", x: 0.90, y: 0.30 },
      { id: "r10-b6",  variant: "C", x: 0.20, y: 0.45 },
      { id: "r10-b7",  variant: "A", x: 0.40, y: 0.48 },
      { id: "r10-b8",  variant: "B", x: 0.62, y: 0.48 },
      { id: "r10-b9",  variant: "C", x: 0.84, y: 0.50 },
      { id: "r10-b10", variant: "A", x: 0.50, y: 0.74 }
    ]
  }
];
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm test`
Expected: all rounds.test.js tests pass.

- [ ] **Step 5: Commit**

```
git add src/rounds.js tests/unit/rounds.test.js
git commit -m "feat(rounds): hand-tuned bug positions for rounds 1-10"
```

---

## Task 6: Game state machine (TDD)

**Files:**
- Create: `conta-os-bichinhos/tests/unit/game.test.js`
- Create: `conta-os-bichinhos/src/game.js`

- [ ] **Step 1: Write the failing test**

`tests/unit/game.test.js`:
```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module .../src/game.js".

- [ ] **Step 3: Implement `src/game.js`**

```js
// src/game.js
// State machine for Conta os Bichinhos. No DOM, no audio.
// Communicates via EventTarget. Caller (scene.js) listens for events.
//
// Events:
//   round-started   { n, bugs }
//   bug-popped      { id, count }       count = bugs popped so far in this round
//   round-complete  { n }                emitted when last bug of round is popped
//   game-complete   {}                   emitted when last bug of last round is popped
//
// Round transition is advanceRound() — caller decides when to advance (after celebration).

export function createGame(rounds) {
  const target = new EventTarget();
  let roundIndex = 0;
  let popped = new Set();
  let pendingComplete = false; // true when last bug of round was popped, awaiting advanceRound()

  function currentRound() {
    return rounds[roundIndex];
  }

  function emit(type, detail) {
    target.dispatchEvent(new CustomEvent(type, { detail }));
  }

  function start() {
    roundIndex = 0;
    popped = new Set();
    pendingComplete = false;
    emit("round-started", { n: currentRound().n, bugs: currentRound().bugs });
  }

  function restart() {
    start();
  }

  function tapBug(id) {
    if (pendingComplete) return; // input frozen between round-complete and advanceRound
    const round = currentRound();
    const bug = round.bugs.find((b) => b.id === id);
    if (!bug) return;
    if (popped.has(id)) return;
    popped.add(id);
    emit("bug-popped", { id, count: popped.size });
    if (popped.size === round.bugs.length) {
      pendingComplete = true;
      emit("round-complete", { n: round.n });
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
    popped = new Set();
    emit("round-started", { n: currentRound().n, bugs: currentRound().bugs });
  }

  return Object.assign(target, { start, restart, tapBug, advanceRound });
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: all game.test.js + audio.test.js + rounds.test.js tests pass.

- [ ] **Step 5: Commit**

```
git add src/game.js tests/unit/game.test.js
git commit -m "feat(game): event-emitting state machine for round flow"
```

---

## Task 7: Numerals module + minimal test

**Files:**
- Create: `conta-os-bichinhos/src/numerals.js`
- Create: `conta-os-bichinhos/tests/unit/numerals.test.js`

- [ ] **Step 1: Write the failing test**

The numeral module is mostly DOM, but the digit-to-class mapping is testable.

`tests/unit/numerals.test.js`:
```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module .../src/numerals.js".

- [ ] **Step 3: Implement `src/numerals.js`**

```js
// src/numerals.js
// Float-up numeral animation. Pure DOM/CSS; styles live in styles.css.

export function numeralClassFor(digit) {
  if (!Number.isInteger(digit) || digit < 1 || digit > 10) {
    throw new Error(`numeral out of range: ${digit}`);
  }
  return `n-${digit}`;
}

// Float a numeral upward from a screen-space rect.
//
//   parent: container that owns absolute-positioned numerals (e.g. .numeral-layer)
//   digit:  1..10
//   originRect: { left, top, width, height } in viewport coordinates
//
// The CSS class .numeral handles the keyframe animation; we just inject the
// element with the right position and remove it on animationend.
export function floatNumeral(parent, digit, originRect) {
  const el = document.createElement("span");
  el.className = `numeral ${numeralClassFor(digit)}`;
  el.textContent = String(digit);

  const parentRect = parent.getBoundingClientRect();
  const cx = originRect.left + originRect.width / 2 - parentRect.left;
  const cy = originRect.top + originRect.height / 2 - parentRect.top;
  el.style.left = `${cx}px`;
  el.style.top = `${cy}px`;

  parent.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once: true });
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all unit tests pass.

- [ ] **Step 5: Commit**

```
git add src/numerals.js tests/unit/numerals.test.js
git commit -m "feat(numerals): float-up animation helper + per-digit color class"
```

---

## Task 8: Voice roster (pure data, no test)

**Files:**
- Create: `conta-os-bichinhos/src/voice-roster.js`

- [ ] **Step 1: Write `src/voice-roster.js`**

```js
// src/voice-roster.js
// 12 voice clips: 10 numbers + 2 cheers.
// Used by both the runtime audio system and the voiceover generation script.

export const NUMBER_WORDS = [
  "ONE", "TWO", "THREE", "FOUR", "FIVE",
  "SIX", "SEVEN", "EIGHT", "NINE", "TEN"
];

// Path returned at index i is the voice clip for digit i+1.
// e.g. NUMBER_VOICE_PATHS[0] is "ONE".
export const NUMBER_VOICE_PATHS = NUMBER_WORDS.map(
  (word) => `assets/voice/${word.toLowerCase()}.mp3`
);

export const CHEER_AMAZING_PATH = "assets/voice/amazing.mp3";
export const CHEER_WOOHOO_PATH = "assets/voice/woohoo.mp3";

// Used by scripts/generate-voiceover.mjs to drive ElevenLabs.
export const VOICEOVER_ROSTER = [
  ...NUMBER_WORDS.map((word) => ({
    id: word.toLowerCase(),
    text: `${word}!`,
    voicePath: `assets/voice/${word.toLowerCase()}.mp3`
  })),
  { id: "amazing", text: "Amazing!", voicePath: CHEER_AMAZING_PATH },
  { id: "woohoo",  text: "Woohoo!",  voicePath: CHEER_WOOHOO_PATH }
];

export const SFX_PATHS = {
  pop:      "assets/sounds/bubble-pop.mp3",
  drain:    "assets/sounds/drain-swoosh.mp3",
  confetti: "assets/sounds/confetti-cheer.mp3"
};
```

- [ ] **Step 2: Commit**

```
git add src/voice-roster.js
git commit -m "feat(voice): roster of 12 voice clips + sfx paths"
```

---

## Task 9: Scene (DOM rendering)

**Files:**
- Create: `conta-os-bichinhos/src/scene.js`

The scene is hard to unit-test (heavy DOM); it's covered by E2E tests in Task 14.

- [ ] **Step 1: Write `src/scene.js`**

```js
// src/scene.js
// DOM rendering. Listens to game events; renders bugs, numerals, transitions.

import { floatNumeral } from "./numerals.js";

export function createScene({ root, game, audio, voiceRoster, sfxPaths, onTap }) {
  const stage = root;
  const bugLayer = stage.querySelector(".bug-layer");
  const numeralLayer = stage.querySelector(".numeral-layer");
  const celebration = stage.querySelector(".celebration");
  const finale = stage.querySelector(".finale");
  const brush = stage.querySelector(".brush");

  function clearBugs() {
    bugLayer.innerHTML = "";
  }

  function renderBugs(bugs) {
    clearBugs();
    for (const bug of bugs) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `bug bug-${bug.variant.toLowerCase()}`;
      el.dataset.bugId = bug.id;
      el.style.left = `${bug.x * 100}%`;
      el.style.top = `${bug.y * 100}%`;
      el.setAttribute("aria-label", "sugar bug");
      bugLayer.appendChild(el);
    }
  }

  // Single delegated handler. iOS Safari requires audio.play() on the gesture
  // — we call it synchronously inside this handler.
  bugLayer.addEventListener("pointerdown", (event) => {
    const target = event.target.closest(".bug");
    if (!target) return;
    const id = target.dataset.bugId;
    onTap(id, target);
  });

  game.addEventListener("round-started", (e) => {
    const { bugs } = e.detail;
    stage.dataset.round = String(e.detail.n);
    renderBugs(bugs);
    celebration.hidden = true;
    finale.hidden = true;
    bugLayer.style.pointerEvents = "auto";
  });

  game.addEventListener("bug-popped", (e) => {
    const { id, count } = e.detail;
    const bugEl = bugLayer.querySelector(`[data-bug-id="${id}"]`);
    if (!bugEl) return;
    const rect = bugEl.getBoundingClientRect();
    bugEl.classList.add("popped");
    bugEl.style.pointerEvents = "none";

    floatNumeral(numeralLayer, count, rect);

    brush.classList.remove("wiggle");
    void brush.offsetWidth; // restart animation
    brush.classList.add("wiggle");

    // Remove DOM element after slide-to-drain animation ends.
    bugEl.addEventListener("animationend", () => bugEl.remove(), { once: true });
  });

  game.addEventListener("round-complete", () => {
    bugLayer.style.pointerEvents = "none";
    celebration.hidden = false;
    audio.playSequence([voiceRoster.CHEER_AMAZING_PATH, sfxPaths.drain]);
    setTimeout(() => game.advanceRound(), 1500);
  });

  game.addEventListener("game-complete", () => {
    bugLayer.style.pointerEvents = "none";
    finale.hidden = false;
    finale.innerHTML = "";

    // Animal squad
    const squad = document.createElement("div");
    squad.className = "squad";
    for (const name of ["lion", "zebra", "hippo", "giraffe", "lemur"]) {
      const img = document.createElement("img");
      img.src = `assets/images/${name}.png`;
      img.alt = name;
      img.className = `squad-member squad-${name}`;
      squad.appendChild(img);
    }
    finale.appendChild(squad);

    // WOOHOO! + confetti SFX immediately.
    audio.playSequence([voiceRoster.CHEER_WOOHOO_PATH, sfxPaths.confetti]);

    // Numerals 1..10 flash one by one with their voice clips replayed.
    const layer = document.createElement("div");
    layer.className = "finale-numerals";
    finale.appendChild(layer);
    for (let i = 1; i <= 10; i++) {
      setTimeout(() => {
        const layerRect = layer.getBoundingClientRect();
        const fakeOrigin = {
          left: layerRect.left + layerRect.width / 2,
          top: layerRect.top + layerRect.height / 2,
          width: 0,
          height: 0
        };
        floatNumeral(layer, i, fakeOrigin);
        audio.playSequence([voiceRoster.NUMBER_VOICE_PATHS[i - 1]]);
      }, 1200 + i * 700);
    }

    // Auto-loop after the finale runs to completion.
    setTimeout(() => game.restart(), 1200 + 11 * 700 + 2000);
  });
}
```

- [ ] **Step 2: Commit**

```
git add src/scene.js
git commit -m "feat(scene): DOM rendering driven by game events"
```

---

## Task 10: Main bootstrap (start screen + audio unlock)

**Files:**
- Create: `conta-os-bichinhos/src/main.js`

- [ ] **Step 1: Write `src/main.js`**

```js
// src/main.js
// Boot sequence: start-screen tap → audio unlock → game.start() → scene listens.

import { createAudioSystem, createBrowserBackend, createBrowserClock } from "./audio.js";
import { createGame } from "./game.js";
import { createScene } from "./scene.js";
import { ROUNDS } from "./rounds.js";
import {
  NUMBER_VOICE_PATHS,
  CHEER_AMAZING_PATH,
  CHEER_WOOHOO_PATH,
  SFX_PATHS
} from "./voice-roster.js";

const startScreen = document.getElementById("start-screen");
const stage = document.getElementById("stage");

const audio = createAudioSystem({
  backend: createBrowserBackend(),
  clock: createBrowserClock(),
  cooldownMs: 800,    // shorter than Safari — kids tap fast in this game
  sequenceGapMs: 100  // pop sfx should follow the number quickly
});

audio.preload([
  ...NUMBER_VOICE_PATHS,
  CHEER_AMAZING_PATH,
  CHEER_WOOHOO_PATH,
  SFX_PATHS.pop,
  SFX_PATHS.drain,
  SFX_PATHS.confetti
]);

const game = createGame(ROUNDS);

createScene({
  root: stage,
  game,
  audio,
  voiceRoster: { NUMBER_VOICE_PATHS, CHEER_AMAZING_PATH, CHEER_WOOHOO_PATH },
  sfxPaths: SFX_PATHS,
  onTap: (id) => {
    // Synchronous from the gesture event — required for iOS audio unlock.
    // The number played is the current count + 1 (next bug).
    // We don't know the count here without a peek; let scene compute it via the
    // bug-popped event. Instead: dispatch the tap, then read the count from the
    // event and play sound there.
    // Simpler: tap → game.tapBug → game emits bug-popped → scene plays audio.
    // But the gesture chain dies if audio.play is called from inside an event
    // handler triggered by an event handler. Solution below.
    handleTap(id);
  }
});

// The synchronous-audio chain: we call audio.playSequence INSIDE the listener
// for bug-popped, BUT bug-popped is dispatched synchronously by game.tapBug,
// which is itself called synchronously from the pointerdown event in scene.js.
// EventTarget.dispatchEvent is fully synchronous, so the gesture chain holds.
let pendingTapAudioCount = null;
game.addEventListener("bug-popped", (e) => {
  const { count } = e.detail;
  audio.playSequence([NUMBER_VOICE_PATHS[count - 1], SFX_PATHS.pop]);
});

function handleTap(id) {
  // game.tapBug synchronously emits bug-popped, which the listener above handles.
  game.tapBug(id);
}

// Start screen — single tap unlocks audio + starts the game.
function startGame() {
  // Trigger an audio play to unlock iOS — silent if not yet loaded.
  audio.playSequence([SFX_PATHS.pop]);
  startScreen.hidden = true;
  stage.hidden = false;
  game.start();
}

startScreen.addEventListener("pointerdown", startGame, { once: true });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // SW failures are silent in dev.
    });
  });
}
```

- [ ] **Step 2: Smoke-test in dev**

Run: `npm run dev`
Open http://localhost:4173 in a browser, click the TAP! cue. Expected: stage shows, one CSS bug placeholder appears (Task 11 will style it). Click the bug — console error or empty visual is OK at this stage; the CSS comes next.

Stop the dev server (Ctrl-C).

- [ ] **Step 3: Commit**

```
git add src/main.js
git commit -m "feat(main): bootstrap with start-screen audio unlock"
```

---

## Task 11: Styles + animations (CSS placeholder assets)

**Files:**
- Create: `conta-os-bichinhos/src/styles.css`

Built-in placeholder visuals so the game is fully playable before we generate real sprites: tooth = white rounded square, bugs = colored circles with eyes, brush = green capsule.

- [ ] **Step 1: Write `src/styles.css`**

```css
:root {
  --bg: #cfe7ff;
  --tile: #e8f3ff;
  --tooth: #fffafa;
  --tooth-shadow: #d6dee8;
  --drain: #6f7d92;
  --brush: #6dbf63;
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
  position: fixed; inset: 0;
  background: var(--bg);
  color: #2c3e50;
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
  position: fixed; inset: 0;
  background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  z-index: 50;
}
.start-cue {
  font-size: 18vmin;
  font-weight: 900;
  color: #2c3e50;
  letter-spacing: 0.05em;
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

#stage {
  position: fixed; inset: 0;
  display: block;
}

.bathroom-bg {
  position: absolute; inset: 0;
  background:
    repeating-linear-gradient(0deg, var(--tile) 0 24px, #d8e9fb 24px 26px),
    repeating-linear-gradient(90deg, var(--tile) 0 24px, #d8e9fb 24px 26px);
  background-blend-mode: multiply;
  z-index: 0;
}

.tooth {
  position: absolute;
  left: 10%; top: 8%;
  width: 80%; height: 70%;
  background: var(--tooth);
  border-radius: 32% 32% 28% 28% / 30% 30% 35% 35%;
  box-shadow: inset 0 -16px 32px var(--tooth-shadow), 0 12px 24px rgba(0,0,0,0.12);
  z-index: 1;
}
.tooth::before, .tooth::after { /* eyes */
  content: "";
  position: absolute;
  width: 6%; height: 4%;
  background: #2c3e50;
  border-radius: 50%;
  top: 35%;
}
.tooth::before { left: 30%; }
.tooth::after  { left: 64%; }

.drain {
  position: absolute;
  left: 45%; bottom: 5%;
  width: 10%; height: 6%;
  background: radial-gradient(circle, #2c3e50 30%, var(--drain) 70%);
  border-radius: 50%;
  z-index: 2;
}

.brush {
  position: absolute;
  right: 4%; top: 30%;
  width: 6%; height: 38%;
  background: linear-gradient(180deg, #fff 0 22%, var(--brush) 22% 100%);
  border-radius: 14px;
  transform-origin: 50% 100%;
  z-index: 3;
}
.brush.wiggle {
  animation: wiggle 0.4s ease-in-out;
}
@keyframes wiggle {
  0%   { transform: rotate(0deg); }
  25%  { transform: rotate(-12deg); }
  75%  { transform: rotate(12deg); }
  100% { transform: rotate(0deg); }
}

.bug-layer {
  position: absolute;
  /* matches .tooth bounds so bug.x/y normalized coords map cleanly */
  left: 10%; top: 8%; width: 80%; height: 70%;
  z-index: 4;
}
.bug {
  position: absolute;
  width: 11%; height: 13%;
  border: none;
  background: radial-gradient(circle at 35% 30%, #ff8a8a, #c0392b);
  border-radius: 50%;
  cursor: pointer;
  transform: translate(-50%, -50%);
  animation: bug-bob 1.6s ease-in-out infinite;
  outline: none;
  padding: 0;
}
.bug.bug-b { background: radial-gradient(circle at 35% 30%, #a3eaa3, #2ecc71); }
.bug.bug-c { background: radial-gradient(circle at 35% 30%, #ffe082, #f39c12); }
.bug::before, .bug::after { /* eyes */
  content: "";
  position: absolute;
  width: 22%; height: 22%;
  background: #fff;
  border-radius: 50%;
  top: 28%;
}
.bug::before { left: 22%; }
.bug::after  { left: 56%; }
.bug.popped {
  animation: bug-slide 0.6s cubic-bezier(0.4, 0, 0.6, 1) forwards;
  pointer-events: none;
}
@keyframes bug-bob {
  0%, 100% { transform: translate(-50%, -50%); }
  50%      { transform: translate(-50%, calc(-50% - 6px)); }
}
@keyframes bug-slide {
  0%   { opacity: 1; }
  60%  { transform: translate(-50%, 60vh) scale(0.6); opacity: 0.6; }
  100% { transform: translate(-50%, 90vh) scale(0.2); opacity: 0; }
}

.numeral-layer {
  position: absolute; inset: 0;
  pointer-events: none;
  z-index: 6;
}
.numeral {
  position: absolute;
  font-size: 14vmin;
  font-weight: 900;
  pointer-events: none;
  transform: translate(-50%, -50%);
  text-shadow: 0 4px 0 rgba(0,0,0,0.18);
  animation: numeral-float 0.9s ease-out forwards;
  -webkit-text-stroke: 4px #fff;
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
  0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  20%  { transform: translate(-50%, -70%) scale(1.4); opacity: 1; }
  60%  { transform: translate(-50%, -130%) scale(1.0); opacity: 1; }
  100% { transform: translate(-50%, -180%) scale(0.9); opacity: 0; }
}

.celebration, .finale {
  position: absolute; inset: 0;
  z-index: 9;
  pointer-events: none;
  display: flex; align-items: center; justify-content: center;
}
.celebration {
  background: radial-gradient(circle at center, rgba(255,255,255,0.4), transparent 60%);
}
.finale {
  background: rgba(255,255,255,0.5);
}
.finale .squad {
  display: flex; gap: 2vw;
  position: absolute; bottom: 8%; left: 0; right: 0;
  justify-content: center;
  align-items: flex-end;
}
.squad-member {
  width: 16%;
  max-height: 30vh;
  object-fit: contain;
  animation: squad-bob 1s ease-in-out infinite;
}
.squad-member:nth-child(2) { animation-delay: 0.1s; }
.squad-member:nth-child(3) { animation-delay: 0.2s; }
.squad-member:nth-child(4) { animation-delay: 0.3s; }
.squad-member:nth-child(5) { animation-delay: 0.4s; }
@keyframes squad-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-12px); }
}
.finale-numerals {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
```

- [ ] **Step 2: Smoke-test in dev**

Run: `npm run dev`
- Click TAP. Expect: stage with tooth, brush, and 1 red bug for round 1.
- Tap the bug. Expect: bug slides down, big red "1" floats up, brush wiggles. After ~1.5s round 2 loads (2 bugs). Continue all the way through round 10.
- After round 10: finale overlay shows; numerals 1..10 flash; the squad images will 404 (real images come in Task 12). Console errors are expected here.

Stop dev server.

- [ ] **Step 3: Commit**

```
git add src/styles.css
git commit -m "feat(styles): full layout + animations with CSS placeholders"
```

---

## Task 12: Animal squad copy (from Safari)

**Files:**
- Create: `conta-os-bichinhos/assets/images/lion.png`
- Create: `conta-os-bichinhos/assets/images/zebra.png`
- Create: `conta-os-bichinhos/assets/images/hippo.png`
- Create: `conta-os-bichinhos/assets/images/giraffe.png`
- Create: `conta-os-bichinhos/assets/images/lemur.png`

- [ ] **Step 1: Create directory + copy 5 sprites verbatim**

```
mkdir -p assets/images
cp ../safari-de-sons/assets/images/lion.png assets/images/lion.png
cp ../safari-de-sons/assets/images/zebra.png assets/images/zebra.png
cp ../safari-de-sons/assets/images/hippo.png assets/images/hippo.png
cp ../safari-de-sons/assets/images/giraffe.png assets/images/giraffe.png
cp ../safari-de-sons/assets/images/lemur.png assets/images/lemur.png
```

- [ ] **Step 2: Smoke-test in dev**

Run: `npm run dev`
Play through to round 10 finale. Expect: squad images now render (no 404s).

- [ ] **Step 3: Commit**

```
git add assets/images/
git commit -m "feat(assets): copy Safari animal squad for finale"
```

---

## Task 13: Flow asset generation (sugar bugs, tooth, brush, backdrop)

**Files:**
- Create: `conta-os-bichinhos/assets/images/bug-a.png`
- Create: `conta-os-bichinhos/assets/images/bug-b.png`
- Create: `conta-os-bichinhos/assets/images/bug-c.png`
- Create: `conta-os-bichinhos/assets/images/tooth.png`
- Create: `conta-os-bichinhos/assets/images/brush.png`
- Create: `conta-os-bichinhos/assets/images/bathroom-bg.png`

- [ ] **Step 1: Invoke the `flow-asset-generation` skill**

Use the Skill tool with `flow-asset-generation`. The skill drives Google Labs Flow via the Claude-in-Chrome MCP. Follow its checklist (browser pairing, Flow project URL, switch to Image mode, parallel-queue trick).

- [ ] **Step 2: Generate the six assets in parallel**

Use the prompts below. Aspect 1:1 for sprites, 16:9 for backdrop, 3:4 for the brush.

**Sugar bug — variant A (1:1):**
```
Polished 3D cartoon illustration of a single original tiny round sugar bug character, full body visible, idle pose with goofy harmless smile and big sparkly eyes. Bright cherry-red and pink body, tiny soft antennae, small rounded feet. Style is rounded, expressive, with bedtime warmth — similar to a polished children's storybook 3D animation. Plain solid white background, isolated single character, no other animals, no scenery, no text. Three-quarter front view.
```

**Sugar bug — variant B (1:1):**
```
Polished 3D cartoon illustration of a single original tiny round sugar bug character, full body visible, idle pose with goofy harmless surprised face and big sparkly eyes. Bright lime-green and mint body, tiny soft antennae, small rounded feet. Style is rounded, expressive, with bedtime warmth — similar to a polished children's storybook 3D animation. Plain solid white background, isolated single character, no other animals, no scenery, no text. Three-quarter front view.
```

**Sugar bug — variant C (1:1):**
```
Polished 3D cartoon illustration of a single original tiny round sugar bug character, full body visible, idle pose with goofy harmless tongue-out face and big sparkly eyes. Bright sunshine-yellow and orange body, tiny soft antennae, small rounded feet. Style is rounded, expressive, with bedtime warmth — similar to a polished children's storybook 3D animation. Plain solid white background, isolated single character, no other animals, no scenery, no text. Three-quarter front view.
```

**Smiling tooth + drain composite (1:1):**
```
Polished 3D cartoon illustration of a single original friendly smiling tooth character, full body visible, front view, with cute round eyes and a big happy smile. The tooth has a small drain hole at its base where bubbles slip down. Soft white enamel with gentle blue-pink shading, rounded shapes. Style is rounded, expressive, with bedtime warmth — similar to a polished children's storybook 3D animation. Plain solid white background, isolated single object, no other animals, no scenery, no text.
```

**Green toothbrush (3:4):**
```
Polished 3D cartoon illustration of a single original child's toothbrush, full length visible, vertical orientation. Bright leaf-green handle with friendly rounded grip, soft white bristles at the top. Style is rounded, expressive, with bedtime warmth — similar to a polished children's storybook 3D animation. Plain solid white background, isolated single object, no other items, no scenery, no text. Three-quarter front view.
```

**Bathroom-tile backdrop (16:9):**
```
Polished 3D cartoon illustration of a cozy children's bathroom interior backdrop. Soft pastel sky-blue and cream wall tiles in a clean grid, gentle warm overhead light, no characters, no toothbrush, no sink — just empty cozy bathroom wall. Style is rounded, expressive, with bedtime warmth. No text.
```

- [ ] **Step 3: Download each generation as JPEG and save into the project**

For each generated image, download via Flow's UI, save into `conta-os-bichinhos/assets/images/` with the filenames above (`bug-a.jpg`, `tooth.jpg`, etc.). The flow-asset-generation skill describes the JPEG-download convention.

- [ ] **Step 4: Run rembg on the sprite JPEGs to extract alpha**

The bathroom backdrop stays as JPEG (no alpha needed). All other images need transparent backgrounds.

```
cd assets/images
for f in bug-a bug-b bug-c tooth brush; do
  rembg i ${f}.jpg ${f}.png
done
rm bug-a.jpg bug-b.jpg bug-c.jpg tooth.jpg brush.jpg
mv bathroom-bg.jpg bathroom-bg.png  # or keep as .jpg and update CSS
cd ../..
```

- [ ] **Step 5: Update `styles.css` to use the real images**

Replace placeholder visuals with `background-image` references. Edit `src/styles.css`:

- `.bathroom-bg` → set `background: url("/assets/images/bathroom-bg.png") center/cover no-repeat;` and remove the gradient stripe pattern.
- `.tooth` → set `background: url("/assets/images/tooth.png") center/contain no-repeat; background-color: transparent; box-shadow: none; border-radius: 0;` and remove the `::before/::after` eye pseudo-elements (the image has eyes baked in).
- `.brush` → set `background: url("/assets/images/brush.png") center/contain no-repeat; background-color: transparent; border-radius: 0;`.
- `.bug` → set `background: url("/assets/images/bug-a.png") center/contain no-repeat;` and remove the `::before/::after` eye pseudo-elements. Add `.bug.bug-b { background-image: url("/assets/images/bug-b.png"); }` and same for bug-c.

(Engineer: make these edits inline with `Edit` tool calls, preserving non-image styles.)

- [ ] **Step 6: Smoke-test in dev**

Run: `npm run dev`
Click through TAP and play. Expect: real tooth + bug + brush + backdrop sprites render.

- [ ] **Step 7: Commit**

```
git add assets/images/
git add src/styles.css
git commit -m "feat(assets): real sprites via Flow + rembg"
```

---

## Task 14: Voiceover script + generation

**Files:**
- Create: `conta-os-bichinhos/scripts/voice-config.mjs`
- Create: `conta-os-bichinhos/scripts/generate-voiceover.mjs`
- Create: `conta-os-bichinhos/assets/voice/{one..ten}.mp3` + `amazing.mp3` + `woohoo.mp3`

- [ ] **Step 1: Copy `voice-config.mjs` from Safari**

Run: `cp ../safari-de-sons/scripts/voice-config.mjs scripts/voice-config.mjs`

(This pins the British Alice voice ID and ElevenLabs settings.)

- [ ] **Step 2: Write `scripts/generate-voiceover.mjs`**

```js
// scripts/generate-voiceover.mjs
import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { VOICEOVER_ROSTER } from "../src/voice-roster.js";
import { voiceIdFor, MODEL_ID, VOICE_SETTINGS } from "./voice-config.mjs";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY in .env");
  process.exit(1);
}

const force = process.argv.includes("--force");
const voiceId = voiceIdFor("british");

for (const entry of VOICEOVER_ROSTER) {
  const outFile = path.resolve(entry.voicePath);
  await fs.mkdir(path.dirname(outFile), { recursive: true });

  const exists = await fs.stat(outFile).then(() => true).catch(() => false);
  if (exists && !force) {
    console.log(`  skip  ${entry.id}`);
    continue;
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({ text: entry.text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS })
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`  FAIL  ${entry.id}: ${res.status} ${errText}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outFile, buf);
  console.log(`  ok    ${entry.id}  →  ${path.relative(process.cwd(), outFile)}`);
}

console.log("Done.");
```

- [ ] **Step 3: Confirm `.env` has the key**

Ask the user to copy their `safari-de-sons/.env` value (or set it manually):
```
cp ../safari-de-sons/.env .env
```
Or, if not present, instruct the user to fill `.env` from `.env.example` (do NOT commit `.env`).

- [ ] **Step 4: Run the generator**

Run: `npm run voiceover:generate`
Expected: 12 mp3s appear under `assets/voice/`. Each line prints `ok <id>`.

- [ ] **Step 5: Commit**

```
git add scripts/voice-config.mjs scripts/generate-voiceover.mjs assets/voice/
git commit -m "feat(voice): generate 12 ElevenLabs Alice clips (1-10 + cheers)"
```

---

## Task 15: SFX sourcing + LICENSES

**Files:**
- Create: `conta-os-bichinhos/assets/sounds/bubble-pop.mp3`
- Create: `conta-os-bichinhos/assets/sounds/drain-swoosh.mp3`
- Create: `conta-os-bichinhos/assets/sounds/confetti-cheer.mp3`
- Create: `conta-os-bichinhos/assets/sounds/LICENSES.md`

This step is manual and requires the user. Pixabay sounds are CC0 / Pixabay-license — safe to bundle.

- [ ] **Step 1: Source three SFX from Pixabay**

Suggest these search terms on https://pixabay.com/sound-effects/:
- bubble-pop: "bubble pop short" — a single sub-1-second pop.
- drain-swoosh: "water drain whoosh" — 1-2 seconds, gentle.
- confetti-cheer: "kids cheer celebration" — 2-4 seconds.

Download each MP3 and place into `assets/sounds/` with the exact filenames above.

- [ ] **Step 2: Write `assets/sounds/LICENSES.md`**

```markdown
# Sound Effects Licenses

All clips sourced from Pixabay under the Pixabay Content License (free for commercial use, no attribution required, but credited below).

| File                | Source URL                          | Author          |
| ------------------- | ----------------------------------- | --------------- |
| bubble-pop.mp3      | https://pixabay.com/sound-effects/… | <author>        |
| drain-swoosh.mp3    | https://pixabay.com/sound-effects/… | <author>        |
| confetti-cheer.mp3  | https://pixabay.com/sound-effects/… | <author>        |
```

(Engineer: replace the URL/author placeholders with the real ones from Pixabay before committing.)

- [ ] **Step 3: Smoke-test in dev**

Run: `npm run dev`. Tap a bug — expect bubble-pop sound. Round-end — expect drain swoosh. Game-end — expect confetti cheer.

- [ ] **Step 4: Commit**

```
git add assets/sounds/
git commit -m "feat(sfx): bubble-pop, drain-swoosh, confetti-cheer from Pixabay"
```

---

## Task 16: PWA manifest + service worker + icons

**Files:**
- Create: `conta-os-bichinhos/public/manifest.webmanifest`
- Create: `conta-os-bichinhos/public/service-worker.js`
- Create: `conta-os-bichinhos/scripts/make-icons.mjs`
- Create: `conta-os-bichinhos/public/icon-192.png`, `icon-512.png`, `splash-1170x2532.png` (generated)

- [ ] **Step 1: Write `public/manifest.webmanifest`**

```json
{
  "name": "Conta os Bichinhos",
  "short_name": "Conta",
  "description": "Brush sugar bugs, count to ten",
  "start_url": "./",
  "scope": "./",
  "display": "fullscreen",
  "orientation": "landscape",
  "background_color": "#cfe7ff",
  "theme_color": "#7ab8ff",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 2: Write `public/service-worker.js`**

```js
// IMPORTANT: bump CACHE_VERSION on every deploy that changes any precached or
// dynamically-fetched asset.
const CACHE_VERSION = "v1";
const CACHE_NAME = `conta-os-bichinhos-${CACHE_VERSION}`;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./splash-1170x2532.png",
  // Sprites
  "./assets/images/tooth.png",
  "./assets/images/brush.png",
  "./assets/images/bathroom-bg.png",
  "./assets/images/bug-a.png",
  "./assets/images/bug-b.png",
  "./assets/images/bug-c.png",
  // Squad
  "./assets/images/lion.png",
  "./assets/images/zebra.png",
  "./assets/images/hippo.png",
  "./assets/images/giraffe.png",
  "./assets/images/lemur.png",
  // Voice
  "./assets/voice/one.mp3",
  "./assets/voice/two.mp3",
  "./assets/voice/three.mp3",
  "./assets/voice/four.mp3",
  "./assets/voice/five.mp3",
  "./assets/voice/six.mp3",
  "./assets/voice/seven.mp3",
  "./assets/voice/eight.mp3",
  "./assets/voice/nine.mp3",
  "./assets/voice/ten.mp3",
  "./assets/voice/amazing.mp3",
  "./assets/voice/woohoo.mp3",
  // Sounds
  "./assets/sounds/bubble-pop.mp3",
  "./assets/sounds/drain-swoosh.mp3",
  "./assets/sounds/confetti-cheer.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("conta-os-bichinhos-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
```

- [ ] **Step 3: Write `scripts/make-icons.mjs`**

```js
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const toothPath = path.resolve("assets/images/tooth.png");
const outDir = path.resolve("public");
await fs.mkdir(outDir, { recursive: true });

const ICON_SIZES = [192, 512];
const SPLASH = { width: 1170, height: 2532 };
const BG_COLOR = { r: 207, g: 231, b: 255, alpha: 1 };

for (const size of ICON_SIZES) {
  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: BG_COLOR }
  }).png().toBuffer();

  const target = Math.round(size * 0.78);
  const tooth = await sharp(toothPath).resize({ height: target, fit: "inside" }).toBuffer();
  const meta = await sharp(tooth).metadata();
  const left = Math.round((size - meta.width) / 2);
  const top = Math.round((size - meta.height) / 2);

  const out = path.join(outDir, `icon-${size}.png`);
  await sharp(bg).composite([{ input: tooth, top, left }]).png().toFile(out);
  console.log(`  → ${path.relative(process.cwd(), out)}`);
}

{
  const bg = await sharp({
    create: { width: SPLASH.width, height: SPLASH.height, channels: 4, background: BG_COLOR }
  }).png().toBuffer();

  const target = Math.round(SPLASH.width * 0.55);
  const tooth = await sharp(toothPath).resize({ width: target, fit: "inside" }).toBuffer();
  const meta = await sharp(tooth).metadata();
  const left = Math.round((SPLASH.width - meta.width) / 2);
  const top = Math.round((SPLASH.height - meta.height) / 2);

  const out = path.join(outDir, `splash-1170x2532.png`);
  await sharp(bg).composite([{ input: tooth, top, left }]).png().toFile(out);
  console.log(`  → ${path.relative(process.cwd(), out)}`);
}
```

- [ ] **Step 4: Run the icon generator**

Run: `npm run icons:make`
Expected: `public/icon-192.png`, `public/icon-512.png`, `public/splash-1170x2532.png` written.

- [ ] **Step 5: Smoke-test in dev**

Run: `npm run dev`. Open Chrome DevTools → Application → Manifest. Confirm icons resolve and orientation is landscape.

- [ ] **Step 6: Commit**

```
git add public/manifest.webmanifest public/service-worker.js scripts/make-icons.mjs public/icon-192.png public/icon-512.png public/splash-1170x2532.png
git commit -m "feat(pwa): manifest, service worker, icons"
```

---

## Task 17: E2E tests (Playwright)

**Files:**
- Create: `conta-os-bichinhos/tests/e2e/tap-flow.spec.mjs`
- Create: `conta-os-bichinhos/tests/e2e/round-progression.spec.mjs`
- Create: `conta-os-bichinhos/tests/e2e/finale.spec.mjs`

- [ ] **Step 1: Install Playwright browsers**

Run: `npx playwright install --with-deps webkit`

- [ ] **Step 2: Write `tests/e2e/tap-flow.spec.mjs`**

```js
import { test, expect } from "@playwright/test";

test("round 1: tap the only bug, see numeral, bug disappears", async ({ page }) => {
  await page.goto("/");
  await page.locator("#start-screen").click();
  await expect(page.locator("#stage")).toBeVisible();
  await expect(page.locator(".bug")).toHaveCount(1);

  // Tap the bug.
  await page.locator(".bug").click();

  // Numeral 1 floats up.
  await expect(page.locator(".numeral.n-1")).toHaveCount(1);

  // Bug eventually disappears.
  await expect(page.locator(".bug")).toHaveCount(0, { timeout: 2000 });
});
```

- [ ] **Step 3: Write `tests/e2e/round-progression.spec.mjs`**

```js
import { test, expect } from "@playwright/test";

test("finishing round 1 advances to round 2 with 2 bugs", async ({ page }) => {
  await page.goto("/");
  await page.locator("#start-screen").click();
  await expect(page.locator(".bug")).toHaveCount(1);

  await page.locator(".bug").click();

  // After ~1.5s celebration, round 2 loads.
  await expect(page.locator(".bug")).toHaveCount(2, { timeout: 4000 });
  await expect(page.locator("#stage")).toHaveAttribute("data-round", "2");
});
```

- [ ] **Step 4: Write `tests/e2e/finale.spec.mjs`**

```js
import { test, expect } from "@playwright/test";

// Helper: advance from current round to next by tapping all bugs in DOM order.
async function clearRound(page) {
  // Refetch each loop because the bug list changes after each tap.
  let safety = 50;
  while ((await page.locator(".bug:not(.popped)").count()) > 0 && safety-- > 0) {
    const next = page.locator(".bug:not(.popped)").first();
    await next.click({ force: true });
  }
}

test("playing through all 10 rounds reveals the finale overlay", async ({ page }) => {
  test.setTimeout(120000); // 10 rounds × ~2s each + animations

  await page.goto("/");
  await page.locator("#start-screen").click();

  for (let n = 1; n <= 10; n++) {
    await expect(page.locator("#stage")).toHaveAttribute("data-round", String(n), { timeout: 6000 });
    await expect(page.locator(".bug")).toHaveCount(n);
    await clearRound(page);
    if (n < 10) {
      // Wait for the next round's bugs to render.
      await expect(page.locator(".bug")).toHaveCount(n + 1, { timeout: 6000 });
    }
  }

  await expect(page.locator(".finale")).toBeVisible();
  await expect(page.locator(".finale .squad img")).toHaveCount(5);
});
```

- [ ] **Step 5: Run E2E tests**

Run: `npm run build && npm run test:e2e`
Expected: 3 specs pass.

- [ ] **Step 6: Commit**

```
git add tests/e2e/
git commit -m "test(e2e): tap-flow, round-progression, finale"
```

---

## Task 18: GitHub Actions deploy workflow

**Files:**
- Create: `conta-os-bichinhos/.github/workflows/deploy.yml`

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npx playwright install --with-deps webkit
      - run: npm run build
      - run: npm run test:e2e

  build:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Actions deploy workflow"
```

---

## Task 19: Create GitHub repo, push, enable Pages

**Files:** none new — uses `gh`.

This task is destructive (creates a public repo). Pause and confirm with the user before running.

- [ ] **Step 1: Confirm with the user**

Ask: "Ready to create the public GitHub repo `davirolim94/conta-os-bichinhos` and push? This will make the code public."

Wait for explicit yes.

- [ ] **Step 2: Confirm `gh` is authenticated as davirolim94**

Run: `gh auth status`
Expected: shows `davirolim94` as the authenticated account. If a different account is shown, run `gh auth switch` first.

- [ ] **Step 3: Create the repo**

```
gh repo create davirolim94/conta-os-bichinhos --public --source=. --remote=origin --description "Counting game for Natan: tap sugar bugs, learn English numbers 1-10"
```

- [ ] **Step 4: Push**

```
git push -u origin main
```

- [ ] **Step 5: Enable Pages with GitHub Actions source**

```
gh api -X POST /repos/davirolim94/conta-os-bichinhos/pages -f build_type=workflow
```

(If that fails because Pages already exists, use `PUT` and `gh api -X PUT /repos/davirolim94/conta-os-bichinhos/pages -f build_type=workflow`.)

- [ ] **Step 6: Verify the workflow ran**

Run: `gh run watch`
Expected: the deploy workflow turns green within 5-10 minutes.

- [ ] **Step 7: Verify the live site**

Open: https://davirolim94.github.io/conta-os-bichinhos/
Expected: TAP screen → game playable.

- [ ] **Step 8: Commit (none needed; just confirm)**

No code change — repo is now live.

---

## Task 20: Manual playtest validation

**Files:** none.

Final acceptance check using `playwright-cli` or the `Claude_in_Chrome` MCP. Tests we cannot fully automate: real audio playback, animation feel, end-to-end loop.

- [ ] **Step 1: Boot the local preview**

Run: `npm run build && npm run preview` (in the background)

- [ ] **Step 2: Use `playwright-cli` skill to walk the loop**

Open http://localhost:4173 with the playwright-cli skill or browser MCP. Verify:

- TAP screen appears.
- After clicking, stage shows tooth, brush, 1 red bug.
- Tap bug → red "1" floats up, brush wiggles, bug slides toward drain, "ONE!" voice + bubble pop play.
- Round 2 auto-loads with 2 bugs.
- Continue through round 10.
- Round 10 finale shows confetti, animal squad, "WOOHOO!" voice.
- Game loops back to round 1.
- Rotate to portrait → rotate hint shows.
- Refresh while offline (after first load) → game still works (service worker).

- [ ] **Step 3: Report findings to the user**

Write a short summary of what works and any issues found. If issues found, do NOT mark the plan complete; queue follow-up fixes as new tasks.

- [ ] **Step 4: If all good, declare ship**

Update `CLAUDE.md` with the live URL (replace `(after Task 19)` placeholder) and commit:

```
git add CLAUDE.md
git commit -m "docs: link to live deployment"
git push
```

---

## Self-Review Notes (filled in after writing the plan)

**Spec coverage:**
- Gameplay loop (tooth + drain + brush, bugs, numerals, voice, sequential rounds 1–10, finale) → Tasks 5, 9, 11.
- Numeral float-up animation per-digit color → Task 7 (numerals.js) + Task 11 (CSS `.n-1` … `.n-10`).
- Audio engine reuse + iOS unlock → Tasks 4 + 10.
- 3 bug variants + composite tooth + brush + backdrop → Task 13 (Flow prompts).
- Animal squad reuse → Task 12 (cp from Safari).
- Voice (12 clips: 10 numbers + 2 cheers) → Tasks 8 (roster) + 14 (generator).
- SFX (3 clips) → Task 15.
- PWA → Task 16.
- E2E coverage of tap-flow / round-progression / finale → Task 17.
- GitHub Pages deployment with personal credentials → Tasks 2, 18, 19.
- Edge cases (idempotent tap, transition-frozen input, image fail safe, portrait hint) → addressed in scene.js (Task 9), styles.css (Task 11).
- Out-of-scope items (no localStorage, no 11+, no random rounds, no PT-BR mix-in) → not implemented, by design.

**Type / name consistency:**
- `createGame`, `tapBug`, `advanceRound`, `restart`, `start` consistent across game.js + game.test.js + main.js.
- `floatNumeral`, `numeralClassFor` consistent across numerals.js + numerals.test.js + scene.js.
- `NUMBER_VOICE_PATHS`, `CHEER_AMAZING_PATH`, `CHEER_WOOHOO_PATH`, `SFX_PATHS`, `VOICEOVER_ROSTER` consistent across voice-roster.js + main.js + generate-voiceover.mjs.
- Bug variant codes `"A" | "B" | "C"` consistent across rounds.js, scene.js (`bug-${variant.toLowerCase()}`), and styles.css (`.bug.bug-b`, `.bug.bug-c`).

**Placeholder scan:** none — every step has concrete code or commands.
