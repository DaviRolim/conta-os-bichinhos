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
