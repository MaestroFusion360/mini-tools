export function initPwa() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .register("./sw.js", { scope: "./", updateViaCache: "none" })
    .then((reg) => {
      const runUpdate = () => {
        reg.update().catch(() => {});
      };
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(runUpdate, { timeout: 3000 });
      } else {
        window.setTimeout(runUpdate, 1200);
      }
    })
    .catch((err) => {
      console.warn("SW registration failed:", err);
    });
}
