import { byId, setText, showAppToast } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";

let timerRemainingSeconds = 60;
let timerIntervalId = null;
let timerRunning = false;
let timerEndAtMs = 0;
let timerHasStarted = false;
let timerFinished = false;

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

function secondsToTimerParts(totalSeconds) {
  const total = Math.max(0, Math.floor(totalSeconds));
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

function formatTimerDisplay(totalSeconds) {
  const { h, m, s } = secondsToTimerParts(totalSeconds);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function renderTimerDisplay() {
  const display = byId("timer-display");
  if (display) display.textContent = formatTimerDisplay(timerRemainingSeconds);
}

function setTimerStatus(statusKey) {
  const statusEl = byId("timer-status");
  if (statusEl) statusEl.textContent = t(statusKey);
}

export function renderTimerControls() {
  const startBtn = byId("timer-start-btn");
  if (startBtn)
    startBtn.textContent = timerRunning
      ? t("timerPause")
      : timerHasStarted
        ? t("timerResume")
        : t("timerStart");

  if (timerRunning) setTimerStatus("timerRunning");
  else if (timerFinished) setTimerStatus("timerDone");
  else if (timerHasStarted && timerRemainingSeconds > 0)
    setTimerStatus("timerPaused");
  else setTimerStatus("timerReady");
}

function stopTimerInterval() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function onTimerFinished() {
  timerRunning = false;
  timerHasStarted = false;
  timerFinished = true;
  stopTimerInterval();
  timerRemainingSeconds = 0;
  renderTimerDisplay();
  renderTimerControls();
  const message = t("timerFinishedToast");
  showAppToast(message);
  if (document.hidden) alert(message);
}

function timerTick() {
  if (!timerRunning) return;
  timerRemainingSeconds = Math.max(
    0,
    Math.ceil((timerEndAtMs - Date.now()) / 1000),
  );
  renderTimerDisplay();
  if (timerRemainingSeconds <= 0) onTimerFinished();
}

export function toggleTimer() {
  if (timerRunning) {
    timerTick();
    timerRunning = false;
    stopTimerInterval();
    setTimerStatus("timerPaused");
    renderTimerControls();
    return;
  }

  if (timerRemainingSeconds <= 0) timerRemainingSeconds = readTimerInputs();
  if (timerRemainingSeconds <= 0) {
    setTimerStatus("timerInvalid");
    return;
  }

  timerRunning = true;
  timerHasStarted = true;
  timerFinished = false;
  timerEndAtMs = Date.now() + timerRemainingSeconds * 1000;
  stopTimerInterval();
  timerIntervalId = setInterval(timerTick, 250);
  renderTimerControls();
}

export function resetTimer() {
  timerRunning = false;
  timerHasStarted = false;
  timerFinished = false;
  stopTimerInterval();
  timerRemainingSeconds = readTimerInputs();
  renderTimerDisplay();
  renderTimerControls();
}

export function syncTimerFromInputs() {
  if (timerRunning) return;
  timerHasStarted = false;
  timerFinished = false;
  timerRemainingSeconds = readTimerInputs();
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
  syncTimerFromInputs();
  registerTranslationApplier(applyTimerTranslations);
}
