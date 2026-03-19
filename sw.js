const CACHE_NAME = "mobile-tools-v6";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./styles.css",
  "./main.js",
  "./state.js",
  "./dom.js",
  "./utils.js",
  "./i18n.js",
  "./theme.js",
  "./navigation.js",
  "./weather.js",
  "./world-time.js",
  "./timer.js",
  "./stopwatch.js",
  "./calendar.js",
  "./converter.js",
  "./calculator.js",
  "./text-tools.js",
  "./currency.js",
  "./pwa.js",
  "./scripts.js",
  "./i18n.json",
  "./manifest.webmanifest",
  "./assets/favicon.ico",
  "./assets/apple-touch-icon.png",
  "./assets/icon-192x192.png",
  "./assets/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const appScriptPaths = [
    "/main.js",
    "/state.js",
    "/dom.js",
    "/utils.js",
    "/i18n.js",
    "/theme.js",
    "/navigation.js",
    "/weather.js",
    "/world-time.js",
    "/timer.js",
    "/stopwatch.js",
    "/calendar.js",
    "/converter.js",
    "/calculator.js",
    "/text-tools.js",
    "/currency.js",
    "/pwa.js",
    "/scripts.js",
  ];
  const isAppShellRequest =
    event.request.mode === "navigate" ||
    (sameOrigin &&
      (url.pathname.endsWith("/index.html") ||
        url.pathname.endsWith("/styles.css") ||
        url.pathname.endsWith("/i18n.json") ||
        appScriptPaths.some((path) => url.pathname.endsWith(path))));

  if (isAppShellRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && sameOrigin) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (
            response &&
            response.status === 200 &&
            (response.type === "basic" || response.type === "cors")
          ) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(
          () =>
            new Response("Offline", {
              status: 503,
              statusText: "Offline",
            }),
        );
    }),
  );
});
