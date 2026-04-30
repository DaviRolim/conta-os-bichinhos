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
