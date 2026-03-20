import { queryAll, setText } from "./dom.js";
import { STORAGE_KEYS, getStored, setStored } from "./state.js";

let dictionary = { en: {}, ru: {} };
let currentLang = getStored(STORAGE_KEYS.lang, "en");
const translationAppliers = new Set();

export async function initI18n() {
  const response = await fetch("./i18n.json", { cache: "no-store" });
  dictionary = await response.json();
  if (!dictionary[currentLang]) currentLang = "en";
}

export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (!dictionary[lang]) return;
  currentLang = lang;
  setStored(STORAGE_KEYS.lang, currentLang);
}

export function toggleLanguage() {
  setLanguage(currentLang === "ru" ? "en" : "ru");
  applyTranslations();
}

export function t(key) {
  return dictionary[currentLang]?.[key] || dictionary.en?.[key] || key;
}

export function isKnownTranslation(value, key) {
  const normalized = (value || "").trim();
  return (
    normalized === (dictionary.en?.[key] || "") ||
    normalized === (dictionary.ru?.[key] || "")
  );
}

export function registerTranslationApplier(fn) {
  translationAppliers.add(fn);
}

export function applyTranslations() {
  document.documentElement.lang = currentLang;
  const setPlaceholder = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = value;
  };
  const setControlTooltip = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.title = value;
    el.setAttribute("aria-label", value);
  };
  setText("title-tools-text", t("tools"));
  setText("menu-weather", t("weather"));
  setText("menu-time", t("worldTime"));
  setText("menu-timer", t("timer"));
  setText("menu-stopwatch", t("stopwatch"));
  setText("menu-calendar", t("calendar"));
  setText("menu-converter", t("converter"));
  setText("menu-calc", t("calculator"));
  setText("menu-text", t("textAnalysis"));
  setText("menu-currency", t("currency"));
  setText("menu-paint", t("paint"));
  setText("menu-media", t("mediaPlayer"));
  setText("menu-exit", t("exit"));
  setText("title-paint", t("paintTitle"));
  setText("title-media", t("mediaPlayerTitle"));
  setControlTooltip("paint-open-btn", t("paintOpenImage"));
  setControlTooltip("paint-save-btn", t("paintSavePng"));
  setControlTooltip("paint-undo-btn", t("paintUndo"));
  setControlTooltip("paint-redo-btn", t("paintRedo"));
  setControlTooltip("paint-clear-btn", t("paintClear"));
  setControlTooltip("paint-fullscreen-btn", t("paintFullscreen"));
  setControlTooltip("paint-panel-draw-btn", t("paint"));
  setControlTooltip("paint-panel-resize-btn", t("paintResize"));
  setControlTooltip("paint-panel-crop-btn", t("paintCrop"));
  setControlTooltip("paint-panel-rotate-btn", t("paintRotate"));
  setControlTooltip("paint-panel-mirror-btn", t("paintMirror"));
  setText("paint-tool-brush", t("paintToolBrush"));
  setText("paint-tool-eraser", t("paintToolEraser"));
  setText("paint-tool-text", t("paintToolText"));
  setPlaceholder("paint-text", t("paintTextPlaceholder"));
  setPlaceholder("paint-crop-x", t("paintCropX"));
  setPlaceholder("paint-crop-y", t("paintCropY"));
  setPlaceholder("paint-crop-w", t("paintCropW"));
  setPlaceholder("paint-crop-h", t("paintCropH"));
  setControlTooltip("paint-crop-btn", t("paintCrop"));
  setPlaceholder("paint-resize-w", t("paintWidth"));
  setPlaceholder("paint-resize-h", t("paintHeight"));
  setText("paint-resize-btn", t("paintResize"));
  setControlTooltip("paint-rotate-angle", t("paintRotate"));
  setControlTooltip("paint-rotate-btn", t("paintRotate"));
  setText("paint-mirror-opt-horizontal", t("paintMirrorHorizontal"));
  setText("paint-mirror-opt-vertical", t("paintMirrorVertical"));
  setControlTooltip("paint-mirror-btn", t("paintMirror"));
  setControlTooltip("media-open-btn", t("mediaOpenFiles"));
  setControlTooltip("media-prev-btn", t("mediaPrev"));
  setControlTooltip("media-next-btn", t("mediaNext"));
  setControlTooltip("media-clear-btn", t("mediaClearList"));
  setText("media-now-playing", t("mediaNoFileSelected"));

  queryAll('[data-i18n="back-btn"]').forEach((btn) => {
    btn.innerHTML = `<svg class="icon-svg btn-icon"><use href="#i-arrow-left"></use></svg><span>${t("back")}</span>`;
  });

  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.textContent = currentLang === "ru" ? "RU" : "EN";
    langBtn.title = currentLang === "ru" ? "Язык" : "Language";
  }

  translationAppliers.forEach((fn) => fn());
}
