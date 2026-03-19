// Compatibility bootstrap for older cached HTML builds.
// Current app entry point is main.js (ES modules).
if (!window.__miniToolsBootstrapped) {
    window.__miniToolsBootstrapped = true;
    import('./main.js').catch(err => {
        console.error('Failed to load main.js from compatibility bootstrap:', err);
    });
}
