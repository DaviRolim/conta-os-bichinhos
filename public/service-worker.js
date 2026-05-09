// IMPORTANT: bump CACHE_VERSION on every deploy that changes any precached or
// dynamically-fetched asset.
const CACHE_VERSION = "v6";
const CACHE_NAME = `conta-os-bichinhos-${CACHE_VERSION}`;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./splash-1170x2532.png",
  // Ocean artwork
  "./assets/images/ocean-bg.png",
  "./assets/images/turtle.png",
  "./assets/images/dolphin.png",
  "./assets/images/fish.png",
  "./assets/images/crab.png",
  "./assets/images/octopus.png",
  "./assets/images/seahorse.png",
  "./assets/images/whale.png",
  "./assets/images/starfish.png",
  "./assets/images/jellyfish.png",
  "./assets/images/shark.png",
  // Voice
  "./assets/voice/one.mp3",
  "./assets/voice/two.mp3",
  "./assets/voice/three.mp3",
  "./assets/voice/four.mp3",
  "./assets/voice/five.mp3",
  "./assets/voice/six.mp3",
  "./assets/voice/seven.mp3",
  "./assets/voice/eight.mp3",
  "./assets/voice/nine.mp3",
  "./assets/voice/ten.mp3",
  "./assets/voice/amazing.mp3",
  "./assets/voice/woohoo.mp3",
  // Ocean sounds
  "./assets/sounds/bubble-pop.wav",
  "./assets/sounds/confetti-cheer.wav"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("conta-os-bichinhos-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
