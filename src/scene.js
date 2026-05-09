// src/scene.js
// DOM rendering for the underwater counting scene.

import { floatNumeral } from "./numerals.js";

const IDLE_NUDGE_MS = 6000;
const FINALE_NUMERAL_DELAY_MS = 700;
const FINALE_RESTART_DELAY_MS = 1200 + 11 * FINALE_NUMERAL_DELAY_MS + 2000;
const ROUND_TRANSITION_AUDIO_DELAY_MS = 1000;
const ROUND_ADVANCE_AFTER_TRANSITION_AUDIO_MS = 1800;

export function createScene({ root, game, audio, voiceRoster, sfxPaths, onTap }) {
  const stage = root;
  const animalLayer = stage.querySelector(".animal-layer");
  const numeralLayer = stage.querySelector(".numeral-layer");
  const countRibbon = stage.querySelector(".count-ribbon");
  const celebration = stage.querySelector(".celebration");
  const finale = stage.querySelector(".finale");

  let idleTimer = null;
  let roundAdvanceTimer = null;
  let finaleRestartTimer = null;
  let finaleNumeralTimers = [];

  function clearIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  function clearRoundAdvanceTimer() {
    if (roundAdvanceTimer) {
      clearTimeout(roundAdvanceTimer);
      roundAdvanceTimer = null;
    }
  }

  function clearFinaleTimers() {
    for (const timer of finaleNumeralTimers) {
      clearTimeout(timer);
    }
    finaleNumeralTimers = [];

    if (finaleRestartTimer) {
      clearTimeout(finaleRestartTimer);
      finaleRestartTimer = null;
    }
  }

  function clearSceneTimers() {
    clearIdleTimer();
    clearRoundAdvanceTimer();
    clearFinaleTimers();
  }

  function renderAnimals(round) {
    animalLayer.innerHTML = "";

    for (const target of round.targets) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `animal animal-${round.animal}`;
      el.dataset.targetId = target.id;
      el.dataset.animal = round.animal;
      el.setAttribute("aria-label", round.label);
      el.style.left = `${target.x * 100}%`;
      el.style.top = `${target.y * 100}%`;
      el.style.setProperty("--animal-scale", String(target.scale ?? 1));
      el.style.setProperty("--animal-rotate", `${target.rotate ?? 0}deg`);
      el.style.setProperty("--animal-flip", target.flip ? "-1" : "1");
      el.style.backgroundImage = `url("${round.sprite}")`;
      animalLayer.appendChild(el);
    }
  }

  function renderCountRibbon(total) {
    countRibbon.innerHTML = "";

    for (let count = 1; count <= total; count++) {
      const bubble = document.createElement("span");
      bubble.className = "count-bubble";
      bubble.dataset.count = String(count);
      bubble.textContent = String(count);
      countRibbon.appendChild(bubble);
    }
  }

  function setAnimalInputEnabled(enabled) {
    animalLayer.style.pointerEvents = enabled ? "auto" : "none";
  }

  function scheduleIdleNudge() {
    clearIdleTimer();
    idleTimer = setTimeout(() => {
      const candidates = Array.from(animalLayer.querySelectorAll(".animal:not(.counted)"));
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        target.classList.remove("nudge");
        void target.offsetWidth;
        target.classList.add("nudge");
        // Remove after the nudge animation completes so the idle bob+glow
        // animations resume; otherwise .nudge sticks and overrides them.
        setTimeout(() => target.classList.remove("nudge"), 800);
      }
      scheduleIdleNudge();
    }, IDLE_NUDGE_MS);
  }

  function fillRibbonBubble(count) {
    const bubble = countRibbon.querySelector(`[data-count="${count}"]`);
    if (bubble) {
      bubble.classList.add("filled");
    }
  }

  function makeCenteredOrigin() {
    const rect = stage.getBoundingClientRect();
    return {
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2,
      width: 0,
      height: 0
    };
  }

  function renderFinale() {
    finale.innerHTML = "";

    const title = document.createElement("div");
    title.className = "finale-title";
    title.textContent = "1 2 3 4 5 6 7 8 9 10";
    finale.appendChild(title);

    const confetti = document.createElement("div");
    confetti.className = "bubble-confetti";
    for (let i = 0; i < 36; i++) {
      const bubble = document.createElement("i");
      bubble.style.setProperty("--x", `${(i * 17) % 100}%`);
      bubble.style.setProperty("--delay", `${(i % 12) * 0.08}s`);
      bubble.style.setProperty("--size", `${8 + (i % 5) * 3}px`);
      confetti.appendChild(bubble);
    }
    finale.appendChild(confetti);
  }

  animalLayer.addEventListener("pointerdown", (event) => {
    const target = event.target.closest(".animal");
    if (!target || target.classList.contains("counted")) return;

    onTap(target.dataset.targetId, target);
    scheduleIdleNudge();
  });

  game.addEventListener("round-started", (event) => {
    const { n, round } = event.detail;
    clearSceneTimers();

    stage.dataset.round = String(n);
    stage.dataset.animal = round.animal;

    renderAnimals(round);
    renderCountRibbon(round.targets.length);
    celebration.hidden = true;
    finale.hidden = true;
    setAnimalInputEnabled(true);
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

    fillRibbonBubble(count);
    floatNumeral(numeralLayer, count, rect);
  });

  game.addEventListener("round-complete", () => {
    clearIdleTimer();
    setAnimalInputEnabled(false);
    celebration.hidden = false;
    roundAdvanceTimer = setTimeout(() => {
      audio.playSequence([voiceRoster.CHEER_AMAZING_PATH]);
      roundAdvanceTimer = setTimeout(() => {
        roundAdvanceTimer = null;
        game.advanceRound();
      }, ROUND_ADVANCE_AFTER_TRANSITION_AUDIO_MS);
    }, ROUND_TRANSITION_AUDIO_DELAY_MS);
  });

  game.addEventListener("game-complete", () => {
    clearSceneTimers();
    setAnimalInputEnabled(false);
    celebration.hidden = true;
    finale.hidden = false;
    renderFinale();

    audio.playSequence([voiceRoster.CHEER_WOOHOO_PATH, sfxPaths.finale]);

    for (let i = 1; i <= 10; i++) {
      const timer = setTimeout(() => {
        floatNumeral(numeralLayer, i, makeCenteredOrigin());
        audio.playSequence([voiceRoster.NUMBER_VOICE_PATHS[i - 1]]);
      }, 1200 + i * FINALE_NUMERAL_DELAY_MS);
      finaleNumeralTimers.push(timer);
    }

    finaleRestartTimer = setTimeout(() => {
      finaleRestartTimer = null;
      game.restart();
    }, FINALE_RESTART_DELAY_MS);
  });
}
