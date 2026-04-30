# Conta os Bichinhos — Design

**Status:** Approved (2026-04-30)
**Audience:** Natan (2 years 4 months as of 2026-04-30, Portuguese-native, pre-reader).
**Goal:** Teach English numbers 1–10 by tapping sugar bugs to "brush" them down a drain.
**Position in roadmap:** Game #4 of the planned 9-game series (Safari de Sons → Peek-a-Boo Safari → Body Parts → **this** → Frutas dos Lêmures → ...). Roadmap originally scoped this as 1–3; expanded to 1–10 per parent's request.

## Why this game, why now

The roadmap entry for this game read: *"Counting 1–3. Simple count tracker. Reuses existing Bichinhos do Açúcar art from the storybook."* Two changes from that brief:

1. **Range expanded to 1–10.** Counting up to ten is a more durable English skill and gives the game a longer engagement runway.
2. **Numeral display added.** Each tap shows the matching digit (1, 2, ...) on screen so Natan begins to associate the spoken word with the symbol.

Roadmap rule "wait two weeks between games" was waived by parent for this build.

## Gameplay loop

Single-screen, landscape-locked. No instructions, no fail state, no reading.

### Scene

A giant friendly **smiling tooth** fills the center on a soft pastel-tile bathroom backdrop. A stylized **drain** sits at the base of the tooth (rendered as one composite tooth+drain image). The **green toothbrush** sits to the right of the tooth, idly wiggling.

### Round flow (round N where N ∈ 1..10)

1. **Round starts.** N sugar bugs appear on the tooth's surface. Bug positions are pre-baked per round (so they don't overlap). Each bug does a small idle bob.
2. **Natan taps a bug.** That bug:
   - poofs/squishes with a sparkle,
   - slides toward the drain on a curved bubble path,
   - a big colorful numeral matching the tap-order (1, then 2, ...) floats up from where the bug was, fading after ~1s,
   - voice plays the matching English word ("ONE!", "TWO!", ..., "TEN!"),
   - the toothbrush wiggles in sync,
   - a bubble-pop SFX plays.
3. **Round ends** when the last bug is gone: brief celebration (sparkle burst + voice "AMAZING!" + drain swoosh SFX), ~1.5s pause, round N+1 auto-loads.
4. **Game ends** after round 10's last bug: confetti finale — voice "WOOHOO!" + confetti-cheer SFX kick off the scene, then numerals 1–10 flash on screen one by one with their voice clips replayed, the Safari animal squad pops in to clap, then the game loops back to round 1.

### Tap-order

Bugs may be tapped in any order. The count just increments on each tap (1, 2, 3, ...). There is no "wrong" tap.

### Idle nudge

If no tap for ~6s mid-round, one random remaining bug does a bigger wiggle to draw attention. Same pattern as Safari de Sons.

### Start screen

A single full-screen "tap anywhere to begin" with the tooth visible behind a friendly "TAP!" cue. Required once per session for iOS audio unlock — same trick Safari uses.

## Visual design

**Style:** continuous with Safari de Sons and natan-escova-floresta — polished 3D cartoon, rounded shapes, expressive faces, bedtime warmth.

### Numerals

Pure CSS — bold, colorful, big. One color per digit so each number has a personality:

| Digit | Color |
| ----- | ----- |
| 1     | red   |
| 2     | orange |
| 3     | yellow |
| 4     | green |
| 5     | teal |
| 6     | blue |
| 7     | indigo |
| 8     | violet |
| 9     | pink |
| 10    | gold |

Float-up animation: from the tapped bug's position, scale 0.5 → 1.4 → 1.0, translateY -120px, fade out over 900ms.

### Sprites (Flow / Nano Banana 2)

| Asset | Aspect | Notes |
| ----- | ------ | ----- |
| Sugar bug — variant A | 1:1 | Round, big eyes, goofy face. Reuses storybook visual language. |
| Sugar bug — variant B | 1:1 | Different color/face from A. |
| Sugar bug — variant C | 1:1 | Different color/face from A and B. |
| Smiling tooth + drain (composite) | 1:1 | One image, drain integrated at base. Friendly smile. |
| Green toothbrush | 3:4 | Same green as `natan-escova-floresta`. |
| Bathroom tile backdrop | 16:9 | Soft pastel tiles, warm lighting. |

3 bug variants are recolored or shuffled to fill up to 10 bugs per round (no two adjacent bugs use the same variant where possible).

### Reused assets (no Flow generation needed)

The animal squad finale reuses the existing Safari sprites. Files copied verbatim from `safari-de-sons/assets/images/` into this project's `assets/images/`:

- `lion.png`, `zebra.png`, `hippo.png`, `giraffe.png`, `lemur.png`

### Confetti / sparkles

Procedural CSS — no images.

## Audio

**Voice:** ElevenLabs Alice (same voice as Safari de Sons) for continuity.

**Voice clips to generate** (12 total):
- "ONE!", "TWO!", "THREE!", "FOUR!", "FIVE!", "SIX!", "SEVEN!", "EIGHT!", "NINE!", "TEN!"
- "AMAZING!" (round-end celebration)
- "WOOHOO!" (game-end finale)

**Sound effects** (3 total, sourced from Pixabay or similar with permissive license; LICENSES.md committed alongside):
- Bubble pop (on each tap)
- Drain swoosh (when a bug reaches the drain — also used at round-end)
- Confetti cheer (on game-end finale)

**Audio engine:** copied from Safari de Sons (`src/audio.js`) verbatim. `playSequence(clips)` with cooldown, interrupt, cancel-on-new-tap. iOS unlock on first user gesture in `main.js`.

## Tech stack

Identical to Safari de Sons:

- **Runtime:** vanilla HTML/CSS/JS + ESM. No framework.
- **Build:** Vite (`base: "./"`, `publicDir: "public"`). Build script: `vite build && cp -R assets dist/`.
- **Tests:** `node --test` for units, Playwright (mobile-landscape WebKit profile `iPhone 14 landscape`) for E2E.
- **PWA:** manifest + service worker (cache-first, manual `CACHE_VERSION` bump per deploy).
- **CI/Deploy:** GitHub Actions → GitHub Pages on push to `main`.
- **Repo:** new `conta-os-bichinhos` under `davirolim94` GitHub account. Per-repo git identity: `davirolim94@gmail.com`.

## Project layout

```
conta-os-bichinhos/
├── index.html
├── vite.config.js                # base: "./", publicDir: "public"
├── playwright.config.mjs         # iPhone 14 landscape WebKit
├── package.json
├── .npmrc                        # public npm registry pin
├── .env.example                  # ELEVENLABS_API_KEY
├── .gitignore                    # standard + .env
│
├── src/
│   ├── main.js                   # bootstrap: audio unlock + game start, SW register
│   ├── game.js                   # round controller (state machine)
│   ├── scene.js                  # DOM rendering: tooth, drain, bugs, brush
│   ├── audio.js                  # copied from Safari (cooldown/interrupt/cancel)
│   ├── numerals.js               # float-up numeral animation
│   ├── rounds.js                 # pure data: bug positions per round (1..10)
│   └── styles.css                # theme + animations
│
├── assets/                       # cp -R into dist/ at build time
│   ├── images/                   # 3 bug variants, tooth, brush, bg, animal squad
│   ├── voice/                    # 12 ElevenLabs MP3s
│   └── sounds/                   # 3 SFX MP3s + LICENSES.md
│
├── public/
│   ├── manifest.webmanifest
│   ├── service-worker.js         # cache-first, CACHE_VERSION constant
│   ├── icon-192.png, icon-512.png
│   └── splash-1170x2532.png
│
├── scripts/
│   ├── generate-voiceover.mjs    # adapted from Safari (12 clips: 10 numbers + 2 cheers)
│   └── make-icons.mjs            # PWA icons from tooth.png
│
├── tests/
│   ├── unit/
│   │   ├── rounds.test.js        # shape + non-overlap sanity
│   │   └── audio.test.js         # cooldown / interrupt logic
│   └── e2e/
│       ├── tap-flow.spec.mjs     # round 1: tap bug → numeral → bug gone
│       ├── round-progression.spec.mjs  # finish round → next loads
│       └── finale.spec.mjs       # round 10 → confetti screen
│
├── .github/workflows/deploy.yml  # test → build → deploy
└── docs/
    ├── superpowers/specs/2026-04-30-conta-os-bichinhos-design.md
    └── superpowers/plans/2026-04-30-conta-os-bichinhos.md
```

## Module responsibilities

Each module does one thing. Boundaries follow the Safari de Sons pattern.

### `rounds.js` (pure data)

```js
export const ROUNDS = [
  { n: 1, bugs: [{ id: "r1-b1", variant: "A", x: 0.50, y: 0.55 }] },
  { n: 2, bugs: [/* 2 bugs */] },
  // ...
  { n: 10, bugs: [/* 10 bugs */] },
];
```

`x` and `y` are normalized 0..1 over the tooth's render box (resolution-independent). Positions hand-tuned to avoid overlap and feel non-grid-like.

### `game.js` (state machine, no DOM)

State:
```js
{ roundIndex: 0, popped: Set<bugId>, transitioning: bool }
```

Methods:
- `start()`
- `tapBug(id)` — idempotent on already-popped ids; emits `bug-popped` with the running count.
- `advanceRound()` — emits `round-complete` then `round-started`.
- `finishGame()` — emits `game-complete`.

Communicates via an `EventTarget`. No DOM, no audio.

### `scene.js` (DOM-only)

Subscribes to `game` events and renders. Owns:
- the tooth+drain image,
- the bug DOM elements (one per bug in the current round),
- the toothbrush wiggle,
- the celebration overlay,
- the finale overlay (confetti + animal squad).

Delegates pointer events on bug elements to `game.tapBug(id)`.

### `numerals.js` (DOM/CSS)

```js
floatNumeral(parent, digit, originRect)
```

Creates a `<span class="numeral n-{digit}">` positioned at `originRect`'s center, applies the float-up keyframes, removes the node on `animationend`.

### `audio.js`

Verbatim copy from `safari-de-sons/src/audio.js`. `createAudioSystem({ clips })` returning `{ playSequence, cancel, unlock }`. Documented gotcha: `play()` must be called synchronously from a user-gesture event handler — main.js and scene.js's tap delegate honor this.

### `main.js`

```
1. import audio, game, scene
2. wait for first tap on start screen → audio.unlock()
3. game.start()
4. register service worker
```

## Tap-to-count synchronous path

Critical for iOS audio. The tap handler MUST call `audio.playSequence` synchronously:

```
pointerdown on .bug
  → game.tapBug(id)
       → if already popped: return
       → mark popped, increment count
       → emit bug-popped { id, count }
  → audio.playSequence([numberClip[count], popSfx])  ← synchronous
  → scene.popBug(id)                                   ← CSS animation
  → numerals.float(originRect, count)
```

Order matters. `audio.playSequence` first (within the gesture window), DOM/CSS work after.

## Edge cases

| Case | Resolution |
| --- | --- |
| Rapid double-tap on same bug | `game.tapBug` is idempotent; second tap returns early. |
| Tap during round transition | Scene root has `pointer-events: none` during the ~1.5s window. |
| Tap during numeral float | Fine. Animations stack independently. |
| Image fails to load | Bug renders as a colored CSS circle placeholder; round still completable. |
| Voice clip fails / iOS audio not unlocked | SFX still plays (separate `Audio`); voice silently skipped. Numeral still floats. |
| Portrait orientation | "Please rotate" hint (CSS reused from Safari). |
| Service worker stale cache | Manual `CACHE_VERSION` bump per deploy; documented in CLAUDE.md. |

## Out of scope for v1

Deferred to a future iteration if Natan engages:

- localStorage progress / sticker book.
- Numbers 11–20.
- Random or tiered round mode.
- PT-BR encouragement mix-in (current build is English-only).
- Multi-pose / animated bug sprites.
- Counting in reverse / subtraction.

## Validation

Game is "playable" (acceptance criterion) when:

1. `npm run dev` opens the game in a browser; tapping bugs runs the full loop through round 10 and back to round 1.
2. `npm test` and `npm run test:e2e` pass.
3. Playwright finale spec confirms the confetti + animal squad screen renders after round 10's final tap.
4. Game is deployed to GitHub Pages and reachable at `https://davirolim94.github.io/conta-os-bichinhos/`.

## Open assumptions baked in (flag if wrong)

- The `safari-de-sons/src/audio.js` module is reusable verbatim with no edits.
- The Safari animal squad PNGs are appropriate for a "they cheer at game-end" moment without re-generation.
- Bug positions can be hand-authored once (10 layouts) without needing a positioning algorithm.
- One composite tooth+drain image is sufficient — no need for a separate drain layer for animation.
