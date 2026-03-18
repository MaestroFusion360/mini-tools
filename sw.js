const CACHE_NAME = 'mobile-tools-v4';

const PRECACHE_URLS = [
    './',
    './index.html',
    './styles.css',
    './scripts.js',
    './manifest.webmanifest',
    './assets/favicon.ico',
    './assets/apple-touch-icon.png',
    './assets/icon-192x192.png',
    './assets/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(
                names
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request)
                .then(response => {
                    if (
                        response &&
                        response.status === 200 &&
                        (response.type === 'basic' || response.type === 'cors')
                    ) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => new Response('Offline', {
                    status: 503,
                    statusText: 'Offline'
                }));
        })
    );
});
