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
