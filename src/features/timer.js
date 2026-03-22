import { byId, setText, showAppToast } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";
import { formatTimerSeconds } from "./shared/time-format.js";

const timerState = FEATURE_RUNTIME_STATE.timer;

function ensureTimerState() {
  if (
    typeof timerState.timerRemainingSeconds !== "number" ||
    !Number.isFinite(timerState.timerRemainingSeconds)
  ) {
    timerState.timerRemainingSeconds = 0;
  }
  if (typeof timerState.timerRunning !== "boolean") {
    timerState.timerRunning = false;
  }
  if (typeof timerState.timerHasStarted !== "boolean") {
    timerState.timerHasStarted = false;
  }
  if (typeof timerState.timerFinished !== "boolean") {
    timerState.timerFinished = false;
  }
  if (
    typeof timerState.timerEndAtMs !== "number" ||
    !Number.isFinite(timerState.timerEndAtMs)
  ) {
    timerState.timerEndAtMs = 0;
  }
  if (!Object.prototype.hasOwnProperty.call(timerState, "timerIntervalId")) {
    timerState.timerIntervalId = null;
  }
  if (typeof timerState.timerInitialized !== "boolean") {
    timerState.timerInitialized = false;
  }
}

function parseTimerInputValue(id, min, max) {
  const input = byId(id);
  if (!input) return 0;
  const raw = Number(input.value);
  const clamped = Math.max(
    min,
    Math.min(max, Number.isFinite(raw) ? Math.floor(raw) : 0),
  );
  input.value = String(clamped);
  return clamped;
}

function readTimerInputs() {
  const h = parseTimerInputValue("timer-hours", 0, 99);
  const m = parseTimerInputValue("timer-minutes", 0, 59);
  const s = parseTimerInputValue("timer-seconds", 0, 59);
  return h * 3600 + m * 60 + s;
}

function renderTimerDisplay() {
  ensureTimerState();
  const display = byId("timer-display");
  if (display) {
    display.textContent = formatTimerSeconds(timerState.timerRemainingSeconds);
  }
}

function setTimerStatus(statusKey) {
  const statusEl = byId("timer-status");
  if (statusEl) statusEl.textContent = t(statusKey);
}

export function renderTimerControls() {
  ensureTimerState();
  const startBtn = byId("timer-start-btn");
  if (startBtn)
    startBtn.textContent = timerState.timerRunning
      ? t("timerPause")
      : timerState.timerHasStarted
        ? t("timerResume")
        : t("timerStart");

  if (timerState.timerRunning) setTimerStatus("timerRunning");
  else if (timerState.timerFinished) setTimerStatus("timerDone");
  else if (timerState.timerHasStarted && timerState.timerRemainingSeconds > 0)
    setTimerStatus("timerPaused");
  else setTimerStatus("timerReady");
}

function stopTimerInterval() {
  ensureTimerState();
  if (timerState.timerIntervalId) {
    clearInterval(timerState.timerIntervalId);
    timerState.timerIntervalId = null;
  }
}

function onTimerFinished() {
  ensureTimerState();
  timerState.timerRunning = false;
  timerState.timerHasStarted = false;
  timerState.timerFinished = true;
  stopTimerInterval();
  timerState.timerRemainingSeconds = 0;
  renderTimerDisplay();
  renderTimerControls();
  const message = t("timerFinishedToast");
  showAppToast(message);
}

function timerTick() {
  ensureTimerState();
  if (!timerState.timerRunning) return;
  timerState.timerRemainingSeconds = Math.max(
    0,
    Math.ceil((timerState.timerEndAtMs - Date.now()) / 1000),
  );
  renderTimerDisplay();
  if (timerState.timerRemainingSeconds <= 0) onTimerFinished();
}

export function toggleTimer() {
  ensureTimerState();
  if (timerState.timerRunning) {
    timerTick();
    timerState.timerRunning = false;
    stopTimerInterval();
    setTimerStatus("timerPaused");
    renderTimerControls();
    return;
  }

  if (timerState.timerRemainingSeconds <= 0) {
    timerState.timerRemainingSeconds = readTimerInputs();
  }
  if (timerState.timerRemainingSeconds <= 0) {
    setTimerStatus("timerInvalid");
    return;
  }

  timerState.timerRunning = true;
  timerState.timerHasStarted = true;
  timerState.timerFinished = false;
  timerState.timerEndAtMs = Date.now() + timerState.timerRemainingSeconds * 1000;
  stopTimerInterval();
  timerState.timerIntervalId = setInterval(timerTick, 250);
  renderTimerControls();
}

export function resetTimer() {
  ensureTimerState();
  timerState.timerRunning = false;
  timerState.timerHasStarted = false;
  timerState.timerFinished = false;
  stopTimerInterval();
  timerState.timerRemainingSeconds = readTimerInputs();
  renderTimerDisplay();
  renderTimerControls();
}

export function syncTimerFromInputs() {
  ensureTimerState();
  if (timerState.timerRunning) return;
  timerState.timerHasStarted = false;
  timerState.timerFinished = false;
  timerState.timerRemainingSeconds = readTimerInputs();
  renderTimerDisplay();
  renderTimerControls();
}

function applyTimerTranslations() {
  setText("title-timer", t("timerTitle"));
  setText("timer-reset-btn", t("timerReset"));
  setText("timer-hours-label", t("hours"));
  setText("timer-minutes-label", t("minutes"));
  setText("timer-seconds-label", t("seconds"));
  renderTimerControls();
}

export function initTimer() {
  ensureTimerState();
  syncTimerFromInputs();
  if (!timerState.timerInitialized) {
    registerTranslationApplier(applyTimerTranslations);
    timerState.timerInitialized = true;
  }
}
