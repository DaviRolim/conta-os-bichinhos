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
  SFX_PATHS.tap,
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

// The synchronous-audio chain: we call audio.playSequence INSIDE the listener
// for animal-counted, BUT animal-counted is dispatched synchronously by game.tapTarget,
// which is itself called synchronously from the pointerdown event in scene.js.
// EventTarget.dispatchEvent is fully synchronous, so the gesture chain holds.
game.addEventListener("animal-counted", (event) => {
  const { count } = event.detail;
  audio.playSequence([NUMBER_VOICE_PATHS[count - 1], SFX_PATHS.tap]);
});

function handleTap(id) {
  game.tapTarget(id);
}

// Start screen — single tap unlocks audio + starts the game.
function startGame() {
  // Trigger an audio play to unlock iOS — silent if not yet loaded.
  audio.playSequence([SFX_PATHS.tap]);
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
