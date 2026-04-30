// src/voice-roster.js
// 12 voice clips: 10 numbers + 2 cheers.
// Used by both the runtime audio system and the voiceover generation script.

export const NUMBER_WORDS = [
  "ONE", "TWO", "THREE", "FOUR", "FIVE",
  "SIX", "SEVEN", "EIGHT", "NINE", "TEN"
];

// Path returned at index i is the voice clip for digit i+1.
// e.g. NUMBER_VOICE_PATHS[0] is "ONE".
export const NUMBER_VOICE_PATHS = NUMBER_WORDS.map(
  (word) => `assets/voice/${word.toLowerCase()}.mp3`
);

export const CHEER_AMAZING_PATH = "assets/voice/amazing.mp3";
export const CHEER_WOOHOO_PATH = "assets/voice/woohoo.mp3";

// Used by scripts/generate-voiceover.mjs to drive ElevenLabs.
export const VOICEOVER_ROSTER = [
  ...NUMBER_WORDS.map((word) => ({
    id: word.toLowerCase(),
    text: `${word}!`,
    voicePath: `assets/voice/${word.toLowerCase()}.mp3`
  })),
  { id: "amazing", text: "Amazing!", voicePath: CHEER_AMAZING_PATH },
  { id: "woohoo",  text: "Woohoo!",  voicePath: CHEER_WOOHOO_PATH }
];

export const SFX_PATHS = {
  pop:      "assets/sounds/bubble-pop.mp3",
  drain:    "assets/sounds/drain-swoosh.mp3",
  confetti: "assets/sounds/confetti-cheer.mp3"
};
