// src/rounds.js
// Pure data. ROUNDS[i] is round number i+1 (so ROUNDS[0].n === 1).
// Bug positions are normalized (0..1) within the tooth's render box.
// Hand-tuned to avoid overlap (≥ 0.18 separation) and feel non-grid-like.

export const ROUNDS = [
  {
    n: 1,
    bugs: [
      { id: "r1-b1", variant: "A", x: 0.50, y: 0.50 }
    ]
  },
  {
    n: 2,
    bugs: [
      { id: "r2-b1", variant: "A", x: 0.35, y: 0.45 },
      { id: "r2-b2", variant: "B", x: 0.65, y: 0.55 }
    ]
  },
  {
    n: 3,
    bugs: [
      { id: "r3-b1", variant: "A", x: 0.30, y: 0.40 },
      { id: "r3-b2", variant: "B", x: 0.55, y: 0.60 },
      { id: "r3-b3", variant: "C", x: 0.75, y: 0.40 }
    ]
  },
  {
    n: 4,
    bugs: [
      { id: "r4-b1", variant: "A", x: 0.28, y: 0.38 },
      { id: "r4-b2", variant: "B", x: 0.55, y: 0.32 },
      { id: "r4-b3", variant: "C", x: 0.72, y: 0.55 },
      { id: "r4-b4", variant: "A", x: 0.40, y: 0.65 }
    ]
  },
  {
    n: 5,
    bugs: [
      { id: "r5-b1", variant: "A", x: 0.25, y: 0.35 },
      { id: "r5-b2", variant: "B", x: 0.50, y: 0.28 },
      { id: "r5-b3", variant: "C", x: 0.75, y: 0.38 },
      { id: "r5-b4", variant: "A", x: 0.35, y: 0.60 },
      { id: "r5-b5", variant: "B", x: 0.65, y: 0.65 }
    ]
  },
  {
    n: 6,
    bugs: [
      { id: "r6-b1", variant: "A", x: 0.22, y: 0.30 },
      { id: "r6-b2", variant: "B", x: 0.48, y: 0.25 },
      { id: "r6-b3", variant: "C", x: 0.74, y: 0.30 },
      { id: "r6-b4", variant: "A", x: 0.30, y: 0.55 },
      { id: "r6-b5", variant: "B", x: 0.55, y: 0.60 },
      { id: "r6-b6", variant: "C", x: 0.78, y: 0.55 }
    ]
  },
  {
    n: 7,
    bugs: [
      { id: "r7-b1", variant: "A", x: 0.20, y: 0.28 },
      { id: "r7-b2", variant: "B", x: 0.42, y: 0.22 },
      { id: "r7-b3", variant: "C", x: 0.65, y: 0.25 },
      { id: "r7-b4", variant: "A", x: 0.85, y: 0.40 },
      { id: "r7-b5", variant: "B", x: 0.30, y: 0.55 },
      { id: "r7-b6", variant: "C", x: 0.55, y: 0.60 },
      { id: "r7-b7", variant: "A", x: 0.78, y: 0.65 }
    ]
  },
  {
    n: 8,
    bugs: [
      { id: "r8-b1", variant: "A", x: 0.18, y: 0.25 },
      { id: "r8-b2", variant: "B", x: 0.40, y: 0.20 },
      { id: "r8-b3", variant: "C", x: 0.62, y: 0.22 },
      { id: "r8-b4", variant: "A", x: 0.84, y: 0.30 },
      { id: "r8-b5", variant: "B", x: 0.22, y: 0.50 },
      { id: "r8-b6", variant: "C", x: 0.45, y: 0.55 },
      { id: "r8-b7", variant: "A", x: 0.68, y: 0.50 },
      { id: "r8-b8", variant: "B", x: 0.85, y: 0.65 }
    ]
  },
  {
    n: 9,
    bugs: [
      { id: "r9-b1", variant: "A", x: 0.18, y: 0.22 },
      { id: "r9-b2", variant: "B", x: 0.38, y: 0.20 },
      { id: "r9-b3", variant: "C", x: 0.58, y: 0.20 },
      { id: "r9-b4", variant: "A", x: 0.78, y: 0.25 },
      { id: "r9-b5", variant: "B", x: 0.20, y: 0.45 },
      { id: "r9-b6", variant: "C", x: 0.42, y: 0.48 },
      { id: "r9-b7", variant: "A", x: 0.65, y: 0.45 },
      { id: "r9-b8", variant: "B", x: 0.86, y: 0.48 },
      { id: "r9-b9", variant: "C", x: 0.50, y: 0.72 }
    ]
  },
  {
    n: 10,
    bugs: [
      { id: "r10-b1",  variant: "A", x: 0.16, y: 0.20 },
      { id: "r10-b2",  variant: "B", x: 0.36, y: 0.18 },
      { id: "r10-b3",  variant: "C", x: 0.55, y: 0.18 },
      { id: "r10-b4",  variant: "A", x: 0.74, y: 0.20 },
      { id: "r10-b5",  variant: "B", x: 0.90, y: 0.30 },
      { id: "r10-b6",  variant: "C", x: 0.20, y: 0.45 },
      { id: "r10-b7",  variant: "A", x: 0.40, y: 0.48 },
      { id: "r10-b8",  variant: "B", x: 0.62, y: 0.48 },
      { id: "r10-b9",  variant: "C", x: 0.84, y: 0.50 },
      { id: "r10-b10", variant: "A", x: 0.50, y: 0.74 }
    ]
  }
];
