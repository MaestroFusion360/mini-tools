import { byId, setText, showAppToast } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";
import { formatStopwatchMilliseconds } from "./shared/time-format.js";

const stopwatchState = FEATURE_RUNTIME_STATE.stopwatch;

export function renderStopwatchDisplay() {
  const el = byId("stopwatch-display");
  if (el) {
    el.textContent = formatStopwatchMilliseconds(stopwatchState.stopwatchElapsedMs);
  }
}

export function renderStopwatchControls() {
  const startBtn = byId("stopwatch-start-btn");
  if (startBtn) {
    startBtn.textContent = stopwatchState.stopwatchRunning
      ? t("stopwatchPause")
      : stopwatchState.stopwatchElapsedMs > 0
        ? t("stopwatchResume")
        : t("stopwatchStart");
  }
}

export function renderStopwatchLaps() {
  const holder = byId("stopwatch-laps");
  if (!holder) return;
  if (!stopwatchState.stopwatchLaps.length) {
    holder.textContent = t("stopwatchNoLaps");
    return;
  }
  holder.innerHTML = stopwatchState.stopwatchLaps
    .map(
      (lap, index) =>
        `<div class="calc-history-item">#${index + 1}: ${formatStopwatchMilliseconds(lap)}</div>`,
    )
    .reverse()
    .join("");
}

function stopStopwatchInterval() {
  if (stopwatchState.stopwatchIntervalId) {
    clearInterval(stopwatchState.stopwatchIntervalId);
    stopwatchState.stopwatchIntervalId = null;
  }
}

function stopwatchTick() {
  if (!stopwatchState.stopwatchRunning) return;
  stopwatchState.stopwatchElapsedMs = Date.now() - stopwatchState.stopwatchStartAtMs;
  renderStopwatchDisplay();
}

export function toggleStopwatch() {
  if (stopwatchState.stopwatchRunning) {
    stopwatchTick();
    stopwatchState.stopwatchRunning = false;
    stopStopwatchInterval();
    const message = t("stopwatchStoppedToast");
    showAppToast(message);
    if (document.hidden) alert(message);
    renderStopwatchControls();
    return;
  }
  stopwatchState.stopwatchRunning = true;
  stopwatchState.stopwatchStartAtMs = Date.now() - stopwatchState.stopwatchElapsedMs;
  stopStopwatchInterval();
  stopwatchState.stopwatchIntervalId = setInterval(stopwatchTick, 33);
  renderStopwatchControls();
}

export function resetStopwatch() {
  stopwatchState.stopwatchRunning = false;
  stopStopwatchInterval();
  stopwatchState.stopwatchElapsedMs = 0;
  stopwatchState.stopwatchLaps.length = 0;
  renderStopwatchDisplay();
  renderStopwatchControls();
  renderStopwatchLaps();
}

export function addStopwatchLap() {
  if (!stopwatchState.stopwatchRunning && stopwatchState.stopwatchElapsedMs === 0) return;
  stopwatchState.stopwatchLaps.push(stopwatchState.stopwatchElapsedMs);
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
