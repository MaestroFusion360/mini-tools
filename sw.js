const CACHE_NAME = "mobile-tools-v4";

// App shell files required to render the UI offline.
const APP_SHELL_PATHS = [
  "./",
  "./index.html",
  "./src/styles.css",
  "./src/app.html",
  "./src/data/i18n.json",
  "./src/data/app-meta.json",
  "./src/data/changelog.json",
  "./manifest.webmanifest",
  "./src/main.js",
  "./src/core/state.js",
  "./src/core/dom.js",
  "./src/core/utils.js",
  "./src/core/i18n.js",
  "./src/core/changelog.js",
  "./src/core/app-meta.js",
  "./src/core/theme.js",
  "./src/core/navigation.js",
  "./src/core/about.js",
  "./src/core/pwa.js",
  "./src/features/weather.js",
  "./src/features/world-time.js",
  "./src/features/timer.js",
  "./src/features/stopwatch.js",
  "./src/features/calendar.js",
  "./src/features/converter.js",
  "./src/features/calculator.js",
  "./src/features/text-tools.js",
  "./src/features/currency.js",
  "./assets/favicon.ico",
  "./assets/apple-touch-icon.png",
  "./assets/icon-192x192.png",
  "./assets/icon-512x512.png",
  "./assets/icon.svg",
];

const APP_SHELL_ABSOLUTE = APP_SHELL_PATHS.map(
  (path) => new URL(path, self.registration.scope).href,
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_PATHS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isAppShellRequest(request) {
  if (request.mode === "navigate") return true;
  if (request.method !== "GET") return false;
  return APP_SHELL_ABSOLUTE.includes(request.url);
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    if (request.mode === "navigate") {
      const fallback = await cache.match("./index.html");
      if (fallback) return fallback;
    }

    return new Response("Offline", {
      status: 503,
      statusText: "Offline",
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cachedResponse) return cachedResponse;

  const networkResponse = await networkPromise;
  return (
    networkResponse ||
    new Response("Offline", {
      status: 503,
      statusText: "Offline",
    })
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Keep third-party API requests live-only to avoid stale external data in cache.
  if (!sameOrigin) return;

  if (isAppShellRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
