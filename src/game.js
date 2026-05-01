// src/game.js
// DOM-free state machine for Conta os Bichinhos.
// Communicates via EventTarget. Callers decide how to render, play audio, and advance.

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

  function emitRoundStarted() {
    const round = currentRound();
    emit("round-started", { n: round.n, round, targets: round.targets });
  }

  function start() {
    roundIndex = 0;
    counted = new Set();
    pendingComplete = false;
    emitRoundStarted();
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
    emitRoundStarted();
  }

  return Object.assign(target, { start, restart, tapTarget, advanceRound });
}
