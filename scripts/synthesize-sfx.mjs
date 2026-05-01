// scripts/synthesize-sfx.mjs
// Synthesize 3 placeholder SFX (WAV) for the game.
// These are intentionally simple — swap in real Pixabay sounds whenever.
//
// Outputs:
//   assets/sounds/bubble-pop.wav   — short blop on bug tap
//   assets/sounds/drain-swoosh.wav — sweep when round ends
//   assets/sounds/confetti-cheer.wav — rising chord on game-end finale

import { promises as fs } from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 44100;

function writeWav(filename, samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.floor(s * 32767), 44 + i * 2);
  }
  return fs.writeFile(filename, buffer);
}

function synthBubblePop() {
  // 220 ms: rising sine that drops to silence with a wobble. Cartoonish blop.
  const duration = 0.22;
  const N = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;
    const f = 220 + 600 * Math.exp(-t * 18); // start mid, rise then fall
    const env = Math.exp(-t * 12);
    const phase = 2 * Math.PI * f * t;
    samples[i] = 0.6 * env * Math.sin(phase) * (1 + 0.2 * Math.sin(phase * 0.5));
  }
  return samples;
}

function synthDrainSwoosh() {
  // 1.0 s: filtered noise that pitches down. "swoosh."
  const duration = 1.0;
  const N = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(N);
  // Crude IIR low-pass over white noise to make it less harsh.
  let prev = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;
    const noise = Math.random() * 2 - 1;
    const cutoff = 0.05 + 0.5 * Math.exp(-t * 2.5); // low-pass narrows over time
    prev = prev + cutoff * (noise - prev);
    const env = Math.sin(Math.PI * (t / duration)); // sin-shaped attack/release
    samples[i] = 0.55 * env * prev;
  }
  return samples;
}

function synthConfettiCheer() {
  // 1.6 s: rising major chord (C, E, G) with sparkle.
  const duration = 1.6;
  const N = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(N);
  const freqs = [262, 330, 392]; // C4, E4, G4
  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.min(1, t * 6) * Math.exp(-t * 0.7);
    let s = 0;
    for (const f0 of freqs) {
      const f = f0 * (1 + 0.15 * (t / duration)); // slight upward sweep
      s += Math.sin(2 * Math.PI * f * t);
    }
    // sparkle (high-freq jitter) on top
    s += 0.3 * Math.sin(2 * Math.PI * (1800 + 800 * Math.sin(t * 9)) * t) * Math.exp(-t * 1.2);
    samples[i] = 0.22 * env * s;
  }
  return samples;
}

const outDir = path.resolve("assets/sounds");
await fs.mkdir(outDir, { recursive: true });

await writeWav(path.join(outDir, "bubble-pop.wav"), synthBubblePop());
console.log("  ok    bubble-pop.wav");

await writeWav(path.join(outDir, "drain-swoosh.wav"), synthDrainSwoosh());
console.log("  ok    drain-swoosh.wav");

await writeWav(path.join(outDir, "confetti-cheer.wav"), synthConfettiCheer());
console.log("  ok    confetti-cheer.wav");

console.log("Done.");
