// src/rounds.js
// Pure sea-animal round data. ROUNDS[i] is round number i + 1.
// Target positions are normalized (0..1) within the underwater stage.

const ROUND_DEFS = [
  {
    animal: "turtle",
    label: "Turtle",
    targets: [
      { x: 0.50, y: 0.52, scale: 1.05, flip: false, rotate: -2 }
    ]
  },
  {
    animal: "dolphin",
    label: "Dolphin",
    targets: [
      { x: 0.36, y: 0.44, scale: 0.98, flip: false, rotate: -7 },
      { x: 0.66, y: 0.57, scale: 1.08, flip: true, rotate: 5 }
    ]
  },
  {
    animal: "fish",
    label: "Fish",
    targets: [
      { x: 0.27, y: 0.42, scale: 0.88, flip: false, rotate: -5 },
      { x: 0.53, y: 0.62, scale: 1.06, flip: true, rotate: 4 },
      { x: 0.76, y: 0.38, scale: 0.96, flip: false, rotate: 8 }
    ]
  },
  {
    animal: "crab",
    label: "Crab",
    targets: [
      { x: 0.23, y: 0.63, scale: 0.94, flip: false, rotate: 6 },
      { x: 0.45, y: 0.43, scale: 1.04, flip: true, rotate: -4 },
      { x: 0.67, y: 0.66, scale: 0.98, flip: false, rotate: 3 },
      { x: 0.82, y: 0.36, scale: 0.90, flip: true, rotate: -8 }
    ]
  },
  {
    animal: "octopus",
    label: "Octopus",
    targets: [
      { x: 0.20, y: 0.34, scale: 0.92, flip: false, rotate: -6 },
      { x: 0.42, y: 0.57, scale: 1.12, flip: true, rotate: 4 },
      { x: 0.58, y: 0.33, scale: 0.98, flip: false, rotate: 7 },
      { x: 0.76, y: 0.60, scale: 1.06, flip: true, rotate: -3 },
      { x: 0.88, y: 0.40, scale: 0.86, flip: false, rotate: 9 }
    ]
  },
  {
    animal: "seahorse",
    label: "Seahorse",
    targets: [
      { x: 0.16, y: 0.32, scale: 0.84, flip: false, rotate: -7 },
      { x: 0.34, y: 0.55, scale: 1.00, flip: true, rotate: 5 },
      { x: 0.50, y: 0.29, scale: 1.08, flip: false, rotate: -3 },
      { x: 0.63, y: 0.67, scale: 0.92, flip: true, rotate: 8 },
      { x: 0.77, y: 0.43, scale: 1.04, flip: false, rotate: -5 },
      { x: 0.90, y: 0.71, scale: 0.88, flip: true, rotate: 6 }
    ]
  },
  {
    animal: "whale",
    label: "Whale",
    targets: [
      { x: 0.14, y: 0.30, scale: 0.82, flip: false, rotate: -4 },
      { x: 0.29, y: 0.53, scale: 0.94, flip: true, rotate: 7 },
      { x: 0.42, y: 0.27, scale: 1.12, flip: false, rotate: 3 },
      { x: 0.55, y: 0.61, scale: 0.98, flip: true, rotate: -6 },
      { x: 0.69, y: 0.37, scale: 1.06, flip: false, rotate: 8 },
      { x: 0.82, y: 0.70, scale: 0.90, flip: true, rotate: -3 },
      { x: 0.91, y: 0.47, scale: 0.78, flip: false, rotate: 5 }
    ]
  },
  {
    animal: "starfish",
    label: "Starfish",
    targets: [
      { x: 0.13, y: 0.30, scale: 0.82, flip: false, rotate: -9 },
      { x: 0.25, y: 0.56, scale: 0.96, flip: true, rotate: 6 },
      { x: 0.38, y: 0.36, scale: 0.88, flip: false, rotate: 10 },
      { x: 0.49, y: 0.71, scale: 1.08, flip: true, rotate: -5 },
      { x: 0.60, y: 0.28, scale: 0.94, flip: false, rotate: 4 },
      { x: 0.72, y: 0.55, scale: 1.12, flip: true, rotate: -8 },
      { x: 0.84, y: 0.36, scale: 0.86, flip: false, rotate: 7 },
      { x: 0.91, y: 0.66, scale: 0.80, flip: true, rotate: -2 }
    ]
  },
  {
    animal: "jellyfish",
    label: "Jellyfish",
    targets: [
      { x: 0.12, y: 0.28, scale: 0.78, flip: false, rotate: -6 },
      { x: 0.22, y: 0.51, scale: 0.92, flip: true, rotate: 5 },
      { x: 0.34, y: 0.72, scale: 0.86, flip: false, rotate: -10 },
      { x: 0.42, y: 0.35, scale: 1.08, flip: true, rotate: 8 },
      { x: 0.55, y: 0.59, scale: 0.96, flip: false, rotate: -4 },
      { x: 0.66, y: 0.28, scale: 1.14, flip: true, rotate: 3 },
      { x: 0.75, y: 0.70, scale: 0.90, flip: false, rotate: 9 },
      { x: 0.84, y: 0.47, scale: 1.00, flip: true, rotate: -7 },
      { x: 0.93, y: 0.62, scale: 0.74, flip: false, rotate: 6 }
    ]
  },
  {
    animal: "shark",
    label: "Shark",
    targets: [
      { x: 0.11, y: 0.27, scale: 0.76, flip: false, rotate: -7 },
      { x: 0.20, y: 0.49, scale: 0.92, flip: true, rotate: 5 },
      { x: 0.31, y: 0.70, scale: 0.84, flip: false, rotate: -9 },
      { x: 0.39, y: 0.35, scale: 1.04, flip: true, rotate: 8 },
      { x: 0.50, y: 0.57, scale: 1.16, flip: false, rotate: -4 },
      { x: 0.61, y: 0.78, scale: 0.88, flip: true, rotate: 6 },
      { x: 0.69, y: 0.31, scale: 1.08, flip: false, rotate: 4 },
      { x: 0.78, y: 0.53, scale: 0.98, flip: true, rotate: -8 },
      { x: 0.87, y: 0.74, scale: 0.82, flip: false, rotate: 9 },
      { x: 0.93, y: 0.43, scale: 0.72, flip: true, rotate: -3 }
    ]
  }
];

export const ROUNDS = ROUND_DEFS.map((round, index) => {
  const n = index + 1;

  return {
    n,
    count: n,
    animal: round.animal,
    label: round.label,
    sprite: `assets/images/${round.animal}.png`,
    targets: round.targets.map((target, targetIndex) => ({
      id: `r${n}-${round.animal}-${targetIndex + 1}`,
      ...target
    }))
  };
});
