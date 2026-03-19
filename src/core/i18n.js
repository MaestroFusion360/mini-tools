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
  setText("menu-exit", t("exit"));

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
