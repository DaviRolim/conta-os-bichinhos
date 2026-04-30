export function createAudioSystem({ backend, clock, cooldownMs = 1800, sequenceGapMs = 950 }) {
  const cache = new Map();
  let currentSrc = null;
  let currentEl = null;
  let lastPlayedAt = new Map();
  let generation = 0;

  function getElement(src) {
    if (!cache.has(src)) {
      cache.set(src, backend.create(src));
    }
    return cache.get(src);
  }

  async function play(src) {
    const now = clock.now();
    if (currentSrc === src) {
      const last = lastPlayedAt.get(src) ?? -Infinity;
      if (now - last < cooldownMs) {
        return;
      }
    } else if (currentEl && currentEl.playing) {
      currentEl.pause();
    }

    // Any new top-level play call cancels in-flight playSequence.
    generation += 1;

    const el = getElement(src);
    el.currentTime = 0;
    currentSrc = src;
    currentEl = el;
    lastPlayedAt.set(src, now);
    try {
      await el.play();
    } catch (err) {
      // Audio failures are intentionally swallowed.
      // No error UI per spec section 3.5.
    }
  }

  async function playSequence(srcs) {
    const myGen = ++generation;
    for (const src of srcs) {
      if (myGen !== generation) return;
      // Inline-play to keep the gesture chain on the FIRST clip (iOS).
      const now = clock.now();
      if (currentSrc === src) {
        const last = lastPlayedAt.get(src) ?? -Infinity;
        if (now - last < cooldownMs) {
          return;
        }
      } else if (currentEl && currentEl.playing) {
        currentEl.pause();
      }
      const el = getElement(src);
      el.currentTime = 0;
      currentSrc = src;
      currentEl = el;
      lastPlayedAt.set(src, now);
      try {
        await el.play();
      } catch (err) {}
      if (myGen !== generation) return;
      await new Promise((resolve) => setTimeout(resolve, sequenceGapMs));
    }
  }

  function preload(srcs) {
    for (const src of srcs) {
      getElement(src);
    }
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
