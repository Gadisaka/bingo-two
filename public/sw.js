const CACHE_NAME = "bingo-audio-v1";

self.addEventListener("install", (event) => {
  // Skip waiting so updated SW activates sooner
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Cache-first strategy for audio files
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isAudio = url.pathname.match(/\.(mp3|wav|ogg)$/i);

  if (isAudio) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch (err) {
          return new Response("", { status: 504 });
        }
      })
    );
  }
});

// Pre-cache via postMessage
self.addEventListener("message", (event) => {
  const { data } = event;
  if (!data || typeof data !== "object") return;

  if (data.type === "PRECACHE_AUDIOS" && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        await Promise.all(
          data.urls.map(async (url) => {
            try {
              const req = new Request(url, { mode: "no-cors" });
              const existing = await cache.match(req);
              if (!existing) {
                const res = await fetch(req);
                if (res && (res.ok || res.type === "opaque")) {
                  await cache.put(req, res.clone());
                }
              }
            } catch (e) {
              // ignore
            }
          })
        );
      })
    );
  }
});
