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
  // 1.4 s ocean wave: build-up, crest with spray, retreat.
  // - Cascaded one-pole low-pass on white noise gives warm "water" texture.
  // - Cutoff sweeps up to crest then back down (the rushing motion).
  // - Low-frequency rumble layer adds water-mass body.
  // - High-passed noise burst at the crest is the spray.
  const duration = 1.4;
  const N = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(N);
  let lp1 = 0, lp2 = 0, lp3 = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;
    const tn = t / duration;
    const skew = Math.pow(tn, 0.85);
    const env = Math.pow(Math.sin(Math.PI * skew), 1.5);
    const cutoffHz = 350 + 2200 * Math.sin(Math.PI * tn);
    const omega = 2 * Math.PI * cutoffHz / SAMPLE_RATE;
    const alpha = omega / (omega + 1);
    const w = Math.random() * 2 - 1;
    lp1 += alpha * (w - lp1);
    lp2 += alpha * (lp1 - lp2);
    lp3 += alpha * (lp2 - lp3);
    const spray = 0.18 * (w - lp1) * Math.exp(-Math.pow((tn - 0.45) * 4.2, 2));
    const rumbleFreq = 55 + 12 * Math.sin(2 * Math.PI * 0.6 * t);
    const rumble = 0.20 * Math.sin(2 * Math.PI * rumbleFreq * t);
    samples[i] = 0.6 * env * (lp3 * 3.5 + spray + rumble);
  }
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
  }
  if (peak > 0.97) {
    const gain = 0.97 / peak;
    for (let i = 0; i < N; i++) samples[i] *= gain;
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
