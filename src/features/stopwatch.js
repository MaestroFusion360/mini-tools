import { byId, setText, showAppToast } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";

let stopwatchRunning = false;
let stopwatchStartAtMs = 0;
let stopwatchElapsedMs = 0;
let stopwatchIntervalId = null;
const stopwatchLaps = [];

function formatStopwatchDisplay(ms) {
  const total = Math.max(0, Math.floor(ms));
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const centiseconds = Math.floor((total % 1000) / 10);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

export function renderStopwatchDisplay() {
  const el = byId("stopwatch-display");
  if (el) el.textContent = formatStopwatchDisplay(stopwatchElapsedMs);
}

export function renderStopwatchControls() {
  const startBtn = byId("stopwatch-start-btn");
  if (startBtn) {
    startBtn.textContent = stopwatchRunning
      ? t("stopwatchPause")
      : stopwatchElapsedMs > 0
        ? t("stopwatchResume")
        : t("stopwatchStart");
  }
}

export function renderStopwatchLaps() {
  const holder = byId("stopwatch-laps");
  if (!holder) return;
  if (!stopwatchLaps.length) {
    holder.textContent = t("stopwatchNoLaps");
    return;
  }
  holder.innerHTML = stopwatchLaps
    .map(
      (lap, index) =>
        `<div class="calc-history-item">#${index + 1}: ${formatStopwatchDisplay(lap)}</div>`,
    )
    .reverse()
    .join("");
}

function stopStopwatchInterval() {
  if (stopwatchIntervalId) {
    clearInterval(stopwatchIntervalId);
    stopwatchIntervalId = null;
  }
}

function stopwatchTick() {
  if (!stopwatchRunning) return;
  stopwatchElapsedMs = Date.now() - stopwatchStartAtMs;
  renderStopwatchDisplay();
}

export function toggleStopwatch() {
  if (stopwatchRunning) {
    stopwatchTick();
    stopwatchRunning = false;
    stopStopwatchInterval();
    const message = t("stopwatchStoppedToast");
    showAppToast(message);
    if (document.hidden) alert(message);
    renderStopwatchControls();
    return;
  }
  stopwatchRunning = true;
  stopwatchStartAtMs = Date.now() - stopwatchElapsedMs;
  stopStopwatchInterval();
  stopwatchIntervalId = setInterval(stopwatchTick, 33);
  renderStopwatchControls();
}

export function resetStopwatch() {
  stopwatchRunning = false;
  stopStopwatchInterval();
  stopwatchElapsedMs = 0;
  stopwatchLaps.length = 0;
  renderStopwatchDisplay();
  renderStopwatchControls();
  renderStopwatchLaps();
}

export function addStopwatchLap() {
  if (!stopwatchRunning && stopwatchElapsedMs === 0) return;
  stopwatchLaps.push(stopwatchElapsedMs);
  renderStopwatchLaps();
}

function applyStopwatchTranslations() {
  setText("title-stopwatch", t("stopwatchTitle"));
  setText("stopwatch-laps-title", t("stopwatchLapsTitle"));
  setText("stopwatch-lap-btn", t("stopwatchLap"));
  setText("stopwatch-reset-btn", t("stopwatchReset"));
  renderStopwatchControls();
  renderStopwatchLaps();
}

export function initStopwatch() {
  renderStopwatchDisplay();
  renderStopwatchLaps();
  registerTranslationApplier(applyStopwatchTranslations);
}
