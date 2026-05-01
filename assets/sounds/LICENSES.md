# Sound Effects

These three SFX are **synthesized programmatically** by `scripts/synthesize-sfx.mjs`. Public domain.

| File                | Source       | Description                                         |
| ------------------- | ------------ | --------------------------------------------------- |
| bubble-pop.wav      | synthesized  | 220ms blop (rising sine + fast decay) on bug tap.   |
| drain-swoosh.wav    | synthesized  | 1.0s low-passed noise sweep at round-end.           |
| confetti-cheer.wav  | synthesized  | 1.6s rising C-major chord with sparkle on game-end. |

To regenerate: `node scripts/synthesize-sfx.mjs`.

**Future:** swap these for curated Pixabay clips when convenient. Update this file with attribution and replace the `.wav` files with same-named MP3s (and update `src/voice-roster.js` to switch the extension).
