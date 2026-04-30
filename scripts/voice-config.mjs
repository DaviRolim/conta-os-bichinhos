// British (English) voice — picked during v1 audition.
export const BRITISH_VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2";

// Brazilian Portuguese voice — picked during v1.5 audition.
// Run `npm run voiceover:samples:brpt` to audition, then paste the chosen ID here.
export const BR_PT_VOICE_ID = "TX3LPaxmHKxFdv7VOQHJ";

export const MODEL_ID = "eleven_multilingual_v2";
export const VOICE_SETTINGS = { stability: 0.4, similarity_boost: 0.75, style: 0.5 };

const VOICE_IDS = {
  british: BRITISH_VOICE_ID,
  "br-pt": BR_PT_VOICE_ID
};

export function voiceIdFor(label = "british") {
  const id = VOICE_IDS[label];
  if (!id || id === "REPLACE_ME_AFTER_AUDITION") {
    throw new Error(`No ElevenLabs voice ID configured for label "${label}". Run audition first.`);
  }
  return id;
}
