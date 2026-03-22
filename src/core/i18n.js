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
  setText("menu-todo", t("todo"));
  setText("menu-news", t("news"));
  setText("menu-exit", t("exit"));
  setText("menu-about", t("about"));
  setText("menu-github", t("github"));
  setText("menu-telegram", t("telegram"));
  setText("about-title", t("about"));
  setText("about-app-name", t("aboutAppName"));
  setText("about-description", t("aboutDescription"));
  setText("about-github", t("github"));
  setText("about-telegram", t("telegram"));
  setText("title-paint", t("paintTitle"));
  setText("title-media", t("mediaPlayerTitle"));
  setControlTooltip("paint-open-btn", t("paintOpenImage"));
  setControlTooltip("paint-save-btn", t("paintSavePng"));
  setControlTooltip("paint-undo-btn", t("paintUndo"));
  setControlTooltip("paint-redo-btn", t("paintRedo"));
  setControlTooltip("paint-copy-btn", t("paintCopy"));
  setControlTooltip("paint-paste-btn", t("paintPaste"));
  setControlTooltip("paint-clear-btn", t("paintClear"));
  setControlTooltip("paint-fullscreen-btn", t("paintFullscreen"));
  setControlTooltip("paint-panel-filters-btn", t("paintFilters"));
  setControlTooltip("paint-panel-shapes-btn", t("paintShapes"));
  setControlTooltip("paint-select-btn", t("paintSelect"));
  setControlTooltip("paint-panel-zoom-btn", t("paintZoomPanel"));
  setControlTooltip("paint-grid-btn", t("paintGrid"));
  setControlTooltip("paint-panel-draw-btn", t("paint"));
  setControlTooltip("paint-panel-resize-btn", t("paintResize"));
  setControlTooltip("paint-panel-crop-btn", t("paintCrop"));
  setControlTooltip("paint-panel-rotate-btn", t("paintRotate"));
  setControlTooltip("paint-panel-mirror-btn", t("paintMirror"));
  setControlTooltip("paint-tool-brush-btn", t("paintToolBrush"));
  setControlTooltip("paint-tool-eraser-btn", t("paintToolEraser"));
  setControlTooltip("paint-tool-text-btn", t("paintToolText"));
  setControlTooltip("paint-text-fonts-btn", t("paintFonts"));
  setControlTooltip("paint-tool-pipette-btn", t("paintPipette"));
  setControlTooltip("paint-tool-fill-btn", t("paintFill"));
  setControlTooltip("paint-shape-rect-btn", t("paintShapeRect"));
  setControlTooltip("paint-shape-ellipse-btn", t("paintShapeEllipse"));
  setControlTooltip("paint-shape-line-btn", t("paintShapeLine"));
  setControlTooltip("paint-shape-spline-btn", t("paintShapeSpline"));
  setControlTooltip("paint-zoom-in-btn", t("paintZoomIn"));
  setControlTooltip("paint-zoom-out-btn", t("paintZoomOut"));
  setControlTooltip("paint-zoom-reset-btn", t("paintZoomReset"));
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
  setText("media-empty-state", t("mediaEmptyState"));
  setText("media-drop-hint", t("mediaDropHint"));
  setControlTooltip("overflow-menu-btn", t("menu"));
  setControlTooltip("about-close-btn", t("close"));

  queryAll('[data-i18n="back-btn"]').forEach((btn) => {
    btn.innerHTML = `<svg class="icon-svg btn-icon"><use href="#i-arrow-left"></use></svg><span>${t("back")}</span>`;
  });

  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.textContent = currentLang === "ru" ? "RU" : "EN";
    const langLabel = t("languageLabel");
    langBtn.title = langLabel;
    langBtn.setAttribute("aria-label", langLabel);
  }

  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    const themeLabel = t("themeToggleLabel");
    themeBtn.title = themeLabel;
    themeBtn.setAttribute("aria-label", themeLabel);
  }

  translationAppliers.forEach((fn) => fn());
}
