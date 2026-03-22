import { byId, setSelectOptionText, setText } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import {
  FEATURE_RUNTIME_STATE,
  STORAGE_KEYS,
  getStored,
  setStored,
} from "../core/state.js";
import { getLocale } from "../core/utils.js";

const worldTimeState = FEATURE_RUNTIME_STATE.worldTime;
const WORLD_TIME_INTERVAL_MS = 1000;

function ensureWorldTimeState() {
  if (typeof worldTimeState.time24h !== "boolean") {
    worldTimeState.time24h = true;
  }
  if (!Object.prototype.hasOwnProperty.call(worldTimeState, "worldTimeIntervalId")) {
    worldTimeState.worldTimeIntervalId = null;
  }
  if (typeof worldTimeState.worldTimeInitialized !== "boolean") {
    worldTimeState.worldTimeInitialized = false;
  }
}

function isValidTimeZone(zone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export function toggleTimeFormat() {
  ensureWorldTimeState();
  worldTimeState.time24h = !worldTimeState.time24h;
  const formatBtn = byId("time-format-btn");
  if (formatBtn) {
    formatBtn.textContent = worldTimeState.time24h
      ? t("timeFormat24")
      : t("timeFormat12");
  }
  setStored(STORAGE_KEYS.timeFormat, worldTimeState.time24h ? "24" : "12");
  updateWorldTime();
}

function loadTimeFormat() {
  ensureWorldTimeState();
  const savedFormat = getStored(STORAGE_KEYS.timeFormat, "24");
  worldTimeState.time24h = savedFormat !== "12";
  const formatBtn = byId("time-format-btn");
  if (formatBtn) {
    formatBtn.textContent = worldTimeState.time24h
      ? t("timeFormat24")
      : t("timeFormat12");
  }
}

export function updateWorldTime() {
  ensureWorldTimeState();
  const tzSelect = byId("timezone-select");
  if (!tzSelect) return;
  const tz = tzSelect.value;
  const now = new Date();
  const opts = tz === "local" ? {} : { timeZone: tz };
  const timeStr = now.toLocaleTimeString(getLocale(), {
    ...opts,
    hour12: !worldTimeState.time24h,
  });
  const worldTimeEl = byId("world-time");
  if (worldTimeEl) worldTimeEl.textContent = timeStr;
  const unixTimeEl = byId("unix-time");
  if (unixTimeEl) {
    unixTimeEl.textContent = `${t("unixLabel")}: ${Math.floor(now.getTime() / 1000)}`;
  }
}

function applyWorldTimeTranslations() {
  setText("title-time", t("worldTimeTitle"));

  setSelectOptionText("timezone-select", "local", t("localTimezone"));
  setSelectOptionText(
    "timezone-select",
    "America/New_York",
    t("presetNewYork"),
  );
  setSelectOptionText("timezone-select", "America/Chicago", t("presetChicago"));
  setSelectOptionText("timezone-select", "America/Denver", t("presetDenver"));
  setSelectOptionText(
    "timezone-select",
    "America/Los_Angeles",
    t("presetLosAngeles"),
  );
  setSelectOptionText("timezone-select", "America/Toronto", t("presetToronto"));
  setSelectOptionText(
    "timezone-select",
    "America/Sao_Paulo",
    t("presetSaoPaulo"),
  );
  setSelectOptionText("timezone-select", "Europe/London", t("presetLondon"));
  setSelectOptionText("timezone-select", "Europe/Berlin", t("presetBerlin"));
  setSelectOptionText("timezone-select", "Europe/Paris", t("presetParis"));
  setSelectOptionText("timezone-select", "Europe/Madrid", t("presetMadrid"));
  setSelectOptionText("timezone-select", "Europe/Rome", t("presetRome"));
  setSelectOptionText(
    "timezone-select",
    "Europe/Istanbul",
    t("presetIstanbul"),
  );
  setSelectOptionText("timezone-select", "Europe/Kiev", t("presetKyiv"));
  setSelectOptionText("timezone-select", "Europe/Moscow", t("presetMoscow"));
  setSelectOptionText("timezone-select", "Asia/Dubai", t("presetDubai"));
  setSelectOptionText("timezone-select", "Asia/Bangkok", t("presetBangkok"));
  setSelectOptionText("timezone-select", "Asia/Tokyo", t("presetTokyo"));
  setSelectOptionText("timezone-select", "Asia/Shanghai", t("presetShanghai"));
  setSelectOptionText("timezone-select", "Asia/Hong_Kong", t("presetHongKong"));
  setSelectOptionText("timezone-select", "Asia/Seoul", t("presetSeoul"));
  setSelectOptionText(
    "timezone-select",
    "Asia/Singapore",
    t("presetSingapore"),
  );
  setSelectOptionText("timezone-select", "Asia/Kolkata", t("presetDelhi"));
  setSelectOptionText("timezone-select", "Australia/Sydney", t("presetSydney"));
  setSelectOptionText(
    "timezone-select",
    "Pacific/Auckland",
    t("presetAuckland"),
  );
  const formatBtn = byId("time-format-btn");
  if (formatBtn) {
    formatBtn.textContent = worldTimeState.time24h
      ? t("timeFormat24")
      : t("timeFormat12");
  }
  updateWorldTime();
}

export function initWorldTime() {
  ensureWorldTimeState();
  loadTimeFormat();
  const select = byId("timezone-select");
  if (select && !isValidTimeZone(select.value) && select.value !== "local") {
    select.value = "local";
  }
  if (!worldTimeState.worldTimeInitialized) {
    registerTranslationApplier(applyWorldTimeTranslations);
    worldTimeState.worldTimeInitialized = true;
  }
  updateWorldTime();
  if (worldTimeState.worldTimeIntervalId) {
    clearInterval(worldTimeState.worldTimeIntervalId);
  }
  worldTimeState.worldTimeIntervalId = setInterval(
    updateWorldTime,
    WORLD_TIME_INTERVAL_MS,
  );
}
