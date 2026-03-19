import { getLanguage } from "./i18n.js";

export function getLocale() {
  return getLanguage() === "ru" ? "ru-RU" : "en-US";
}

export function formatDateTime(date, options = {}) {
  return date
    .toLocaleString(getLocale(), { hour12: false, ...options })
    .replace(",", "");
}

export function formatNumber(value, options = {}) {
  return value.toLocaleString(getLocale(), options);
}

export function clampNumber(value, min, max, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}
