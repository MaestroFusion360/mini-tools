export function initPwa() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
        .then(reg => reg.update())
        .catch(err => {
            console.warn('SW registration failed:', err);
        });
}
