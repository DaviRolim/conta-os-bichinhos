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
