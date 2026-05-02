export function createAudioSystem({ backend, clock, cooldownMs = 1800, sequenceGapMs = 950 }) {
  // Per-src "warm" element kept alive so the file stays in browser cache.
  const cache = new Map();
  // Per-src last-played timestamp for spam protection.
  const lastPlayedAt = new Map();

  function ensureCached(src) {
    if (!cache.has(src)) {
      cache.set(src, backend.create(src));
    }
  }

  // Always create a FRESH element for actual playback. This lets multiple
  // sounds overlap freely (rapid toddler taps, voice + sfx, round-complete
  // cheers landing on top of an in-flight bubble pop) instead of pausing
  // each other.
  function spawn(src) {
    ensureCached(src);
    return backend.create(src);
  }

  async function play(src) {
    const now = clock.now();
    const last = lastPlayedAt.get(src) ?? -Infinity;
    if (now - last < cooldownMs) return;
    lastPlayedAt.set(src, now);

    const el = spawn(src);
    try {
      await el.play();
    } catch (err) {
      // Audio failures are intentionally swallowed (no error UI per spec 3.5).
    }
  }

  async function playSequence(srcs) {
    for (let i = 0; i < srcs.length; i++) {
      const src = srcs[i];
      const now = clock.now();
      const last = lastPlayedAt.get(src) ?? -Infinity;
      const onCooldown = now - last < cooldownMs;
      if (!onCooldown) {
        lastPlayedAt.set(src, now);
        const el = spawn(src);
        try {
          await el.play();
        } catch (err) {}
      }
      if (i < srcs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, sequenceGapMs));
      }
    }
  }

  function preload(srcs) {
    for (const src of srcs) ensureCached(src);
  }

  return { play, playSequence, preload };
}

export function createBrowserBackend() {
  return {
    create(src) {
      const el = new Audio(src);
      el.preload = "auto";
      el.playing = false;
      el.addEventListener("playing", () => {
        el.playing = true;
      });
      el.addEventListener("pause", () => {
        el.playing = false;
      });
      el.addEventListener("ended", () => {
        el.playing = false;
      });
      return el;
    }
  };
}

export function createBrowserClock() {
  return { now: () => performance.now() };
}
