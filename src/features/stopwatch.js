import { byId, setText, showAppToast } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";
import { formatStopwatchMilliseconds } from "./shared/time-format.js";

const stopwatchState = FEATURE_RUNTIME_STATE.stopwatch;
const MAX_STOPWATCH_LAPS = 100;

function ensureStopwatchState() {
  if (
    typeof stopwatchState.stopwatchElapsedMs !== "number" ||
    !Number.isFinite(stopwatchState.stopwatchElapsedMs)
  ) {
    stopwatchState.stopwatchElapsedMs = 0;
  }
  if (typeof stopwatchState.stopwatchRunning !== "boolean") {
    stopwatchState.stopwatchRunning = false;
  }
  if (!Array.isArray(stopwatchState.stopwatchLaps)) {
    stopwatchState.stopwatchLaps = [];
  }
  if (
    typeof stopwatchState.stopwatchStartAtMs !== "number" ||
    !Number.isFinite(stopwatchState.stopwatchStartAtMs)
  ) {
    stopwatchState.stopwatchStartAtMs = 0;
  }
  if (!Object.prototype.hasOwnProperty.call(stopwatchState, "stopwatchIntervalId")) {
    stopwatchState.stopwatchIntervalId = null;
  }
  if (typeof stopwatchState.stopwatchInitialized !== "boolean") {
    stopwatchState.stopwatchInitialized = false;
  }
}

export function renderStopwatchDisplay() {
  ensureStopwatchState();
  const el = byId("stopwatch-display");
  if (el) {
    el.textContent = formatStopwatchMilliseconds(stopwatchState.stopwatchElapsedMs);
  }
}

export function renderStopwatchControls() {
  ensureStopwatchState();
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
  ensureStopwatchState();
  const holder = byId("stopwatch-laps");
  if (!holder) return;
  if (!stopwatchState.stopwatchLaps.length) {
    holder.textContent = t("stopwatchNoLaps");
    return;
  }
  const items = stopwatchState.stopwatchLaps.map((lap, index) => {
    const row = document.createElement("div");
    row.className = "calc-history-item";
    row.textContent = `#${index + 1}: ${formatStopwatchMilliseconds(lap)}`;
    return row;
  });
  items.reverse();
  holder.replaceChildren(...items);
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
  ensureStopwatchState();
  if (stopwatchState.stopwatchRunning) {
    stopwatchTick();
    stopwatchState.stopwatchRunning = false;
    stopStopwatchInterval();
    const message = t("stopwatchStoppedToast");
    showAppToast(message);
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
  ensureStopwatchState();
  stopwatchState.stopwatchRunning = false;
  stopStopwatchInterval();
  stopwatchState.stopwatchElapsedMs = 0;
  stopwatchState.stopwatchLaps.length = 0;
  renderStopwatchDisplay();
  renderStopwatchControls();
  renderStopwatchLaps();
}

export function addStopwatchLap() {
  ensureStopwatchState();
  if (!stopwatchState.stopwatchRunning && stopwatchState.stopwatchElapsedMs === 0) return;
  stopwatchState.stopwatchLaps.push(stopwatchState.stopwatchElapsedMs);
  if (stopwatchState.stopwatchLaps.length > MAX_STOPWATCH_LAPS) {
    stopwatchState.stopwatchLaps.splice(
      0,
      stopwatchState.stopwatchLaps.length - MAX_STOPWATCH_LAPS,
    );
  }
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
  ensureStopwatchState();
  renderStopwatchDisplay();
  renderStopwatchControls();
  renderStopwatchLaps();
  if (!stopwatchState.stopwatchInitialized) {
    registerTranslationApplier(applyStopwatchTranslations);
    stopwatchState.stopwatchInitialized = true;
  }
}
