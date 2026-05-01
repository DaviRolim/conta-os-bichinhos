# Natan's Counting Dive - Design

**Status:** Approved for spec (2026-05-01)
**Audience:** Natan (2 years 4 months, Portuguese-native, pre-reader).
**Goal:** Teach English counting from 1 to 10 through large, joyful sea-animal tap targets.
**Project:** Replaces the original tooth/sugar-bug concept for `conta-os-bichinhos`.

## Why redesign

The original design centered the screen around a large tooth with small sugar bugs. In practice, that made the learning target less clear: the tooth dominated the scene, the bugs were too small, and the game felt more like target cleanup than counting.

This redesign makes counting the main event. Natan sees a clear group of one animal type, taps each animal in any order, hears the next English number, and sees the matching numeral. Animals stay visible after they are counted so the group quantity remains readable throughout the round.

## Core concept

The game becomes **Natan's Counting Dive**: a single-screen, landscape-locked underwater counting game. Natan appears in the scene wearing diving equipment, swimming in a bright reef world. He is part of the story and emotional hook, but the interactive targets are sea animals.

There are 10 sequential rounds:

| Round | Animal | Count |
| --- | --- | --- |
| 1 | Turtle | 1 |
| 2 | Dolphins | 2 |
| 3 | Fish | 3 |
| 4 | Crabs | 4 |
| 5 | Octopuses | 5 |
| 6 | Seahorses | 6 |
| 7 | Whales | 7 |
| 8 | Starfish | 8 |
| 9 | Jellyfish | 9 |
| 10 | Sharks | 10 |

The game always progresses from 1 to 10. No random-number mode in this version.

## Gameplay loop

1. Start screen appears once so iOS audio can unlock from a user gesture.
2. Round N begins with exactly N animals of one type already visible.
3. Natan taps any uncounted animal.
4. The tap immediately plays the next English number voice clip, then a small bubble/ocean reward sound.
5. A large numeral pops up near the tapped animal.
6. The animal bounces or glows and remains visible in a counted state.
7. A subtle count ribbon fills one numbered bubble.
8. When all animals in the round are counted, the game celebrates briefly and advances automatically.
9. After round 10, an underwater finale replays 1-10 with big numerals, bubbles, sparkles, and a happy Natan/diver celebration.

There is no fail state, no wrong tap, no reading, and no required tap order.

## Layout and interaction

The screen should feel like a playable picture-book page rather than an app dashboard.

### Stage

- Full-screen underwater reef scene.
- Natan is visible as a diver in the lower-left of the scene.
- Natan should anchor the story without covering the animals.
- Main open-water area is reserved for animal tap targets.
- Coral, rocks, seaweed, and bubbles frame the play area without becoming clutter.

### Animals

- Animals are large and expressive, with generous invisible hit boxes.
- Low-count rounds use very large animals.
- High-count rounds arrange animals in gentle rows, arcs, or reef clusters so all remain tappable.
- Animals do not disappear when counted.
- Counted animals get a persistent visual state: a warm glow plus a tiny bubble ring.
- Uncounted animals keep a small idle motion.

### Numerals

- Every tap creates a large numeral pop-up near the tapped animal.
- The numeral should be one of the main visual events of the game, not a small label.
- Numeral styling stays colorful and high-contrast against the ocean background.
- The pop-up animation should be short, satisfying, and readable.

### Count ribbon

- A small top ribbon shows numbered bubbles from 1 through the current round target.
- As animals are counted, the next bubble fills.
- The ribbon reinforces number symbols without becoming instructional text.
- It should be subtle enough that the animals remain the main focus.

### Idle nudge

If there is no tap for about 6 seconds during a round, one uncounted animal wiggles and releases bubbles. This invites interaction without using written instructions.

## Visual design

Style should remain continuous with the other Natan games:

- polished 3D cartoon,
- warm and gentle,
- expressive faces,
- rounded shapes,
- bright but not noisy,
- clearly toddler-friendly.

The ocean palette should use varied reef colors rather than becoming one-note blue. The background should include turquoise water, golden light rays, coral pinks, green seaweed, sandy floor accents, and colorful animals.

## Assets

Replace the tooth-game art set with an ocean art set.

### Required images

| Asset | Format | Notes |
| --- | --- | --- |
| Underwater background with Natan diver | 16:9 image | Full scene background, Natan integrated into the environment. |
| Turtle sprite | transparent PNG | Round 1. |
| Dolphin sprite | transparent PNG | Round 2. |
| Fish sprite | transparent PNG | Round 3. |
| Crab sprite | transparent PNG | Round 4. |
| Octopus sprite | transparent PNG | Round 5. |
| Seahorse sprite | transparent PNG | Round 6. |
| Whale sprite | transparent PNG | Round 7. |
| Starfish sprite | transparent PNG | Round 8. |
| Jellyfish sprite | transparent PNG | Round 9. |
| Shark sprite | transparent PNG | Round 10, friendly not scary. |

The first implementation can use one sprite per animal type. The same sprite repeats within a round, with small scale, flip, rotation, or animation differences to avoid a stamped look.

### Asset naming

Preferred filenames:

- `assets/images/ocean-bg.png`
- `assets/images/turtle.png`
- `assets/images/dolphin.png`
- `assets/images/fish.png`
- `assets/images/crab.png`
- `assets/images/octopus.png`
- `assets/images/seahorse.png`
- `assets/images/whale.png`
- `assets/images/starfish.png`
- `assets/images/jellyfish.png`
- `assets/images/shark.png`

Do not introduce new filenames without updating the JS manifests that reference them.

## Audio

The number voice clips remain the primary learning signal.

### Keep

Existing clips can be reused if they still sound good:

- `one.mp3`
- `two.mp3`
- `three.mp3`
- `four.mp3`
- `five.mp3`
- `six.mp3`
- `seven.mp3`
- `eight.mp3`
- `nine.mp3`
- `ten.mp3`

### Replace or add

Tooth-specific sound effects should be replaced:

- tap reward: gentle bubble pop or soft underwater sparkle,
- round complete: ocean shimmer or bubble swell,
- finale: underwater sparkle/celebration.

Per-animal sounds are optional for a later iteration. The first polished version should prioritize the number voice, numeral pop-up, and clean animal interaction. If per-animal sounds are added later, they should play after the number so the number remains the lesson.

### iOS audio constraint

`Audio.play()` must still be synchronous from the gesture event. The tap handler should call `audio.playSequence(...)` inside the pointer event path before deferred DOM work.

## Architecture

Preserve the useful structure of the existing project while changing the theme.

### `src/game.js`

Keep as the DOM-free state machine:

- sequential rounds,
- counted target set,
- idempotent taps,
- `round-started`,
- `animal-counted`,
- `round-complete`,
- `game-complete`.

It should not know about DOM, images, or audio.

### `src/rounds.js`

Change from bug/tooth positions to sea-animal round data:

```js
{
  n: 4,
  animal: "crab",
  label: "Crab",
  sprite: "assets/images/crab.png",
  targets: [
    { id: "r4-crab-1", x: 0.22, y: 0.62, scale: 1.0, flip: false },
    // ...
  ]
}
```

Coordinates are normalized over the stage/play-area, not over a tooth image. Positions should be hand-tuned per round for large tap targets and a pleasant composition.

### `src/scene.js`

Replace tooth/bug rendering with ocean rendering:

- render animal buttons for the current round,
- apply counted state without removing the animal,
- render count ribbon bubbles,
- trigger numeral pop-ups,
- run idle nudge,
- show round and finale effects.

The scene owns DOM and CSS classes only. It delegates state changes to `game.js`.

### `src/numerals.js`

Keep the numeral float helper, with ocean-appropriate styling and a larger default size than the tooth-game version.

### `src/audio.js`

Keep the Safari-derived audio system. The synchronous playback behavior is still important.

### `src/main.js`

Keep the basic wiring:

- create audio,
- unlock on first gesture,
- create game,
- create scene,
- start the game,
- register service worker.

## Testing

### Unit tests

Update tests to verify:

- exactly 10 rounds,
- round counts are 1 through 10,
- each round has one animal type,
- each round has exactly N targets,
- target IDs are unique,
- target coordinates stay in bounds,
- game tap events count upward correctly,
- repeated taps on the same animal are idempotent,
- round progression and game completion still work.

### E2E tests

Update Playwright tests for mobile-landscape WebKit:

- start screen unlocks and round 1 appears,
- tapping an animal shows the numeral and counted state,
- counted animal remains visible,
- count ribbon advances,
- completing a round advances to the next animal/count,
- completing round 10 shows the underwater finale.

### Visual verification

Before delivery, verify the game in mobile landscape and desktop landscape. Check that:

- animals are not too small,
- high-count rounds remain tappable,
- text/numerals do not overlap key animals,
- Natan remains visible but not intrusive,
- portrait rotate hint still works,
- finale appears above the scene correctly.

## Service worker and deploy notes

Any implementation that changes HTML, JS, CSS, or precached assets must bump the service worker `CACHE_VERSION`.

The build still uses Vite and copies `assets/` into `dist/`. Preserve the project gotchas from `AGENTS.md`, including the Ubuntu-safe `npm test` script and the `.npmrc` public registry pin.

## Out of scope for first rebuild

- Random number mode.
- Wrong-answer mechanics.
- Drag-and-drop.
- Hidden animals.
- Per-animal voice prompts.
- Per-animal sound set, unless asset production is already trivial.
- New land-animal finale squad.

## Success criteria

The redesign is successful if:

- the counting sequence is unmistakable,
- Natan can tap every animal comfortably,
- animals remain large and appealing through round 10,
- the spoken number and visual numeral are clearly paired on every tap,
- the game feels like an underwater Natan adventure, not a reskinned tooth game,
- the code keeps the current clean state/render/audio separation.
