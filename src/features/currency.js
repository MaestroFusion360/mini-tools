import { byId, setText } from "../core/dom.js";
import { getLanguage, registerTranslationApplier, t } from "../core/i18n.js";
import {
  FEATURE_RUNTIME_STATE,
  STORAGE_KEYS,
  getStoredJson,
  setStoredJson,
} from "../core/state.js";
import { getLocale } from "../core/utils.js";
import { CURRENCY_NAMES } from "../data/currency-names.js";

const currencyState = FEATURE_RUNTIME_STATE.currency;
const BUILT_IN_RATES = { ...(currencyState.rates || { USD: 1 }) };
const DEFAULT_FROM_CURRENCY = "USD";
const DEFAULT_TO_CURRENCY = "EUR";
const RATES_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";
const MAX_CURRENCY_FAVORITES = 16;
let currencyFavoritePairs = [];
let currencyInitialized = false;
function ensureCurrencyState() {
  if (!currencyState || typeof currencyState !== "object") return;
  if (!currencyState.rates || typeof currencyState.rates !== "object") {
    currencyState.rates = { ...BUILT_IN_RATES };
  }
  if (!Object.keys(currencyState.rates).length) {
    currencyState.rates = { USD: 1 };
  }
  if (typeof currencyState.ratesUsingBuiltIn !== "boolean") {
    currencyState.ratesUsingBuiltIn = true;
  }
  if (typeof currencyState.ratesSourceText !== "string") {
    currencyState.ratesSourceText = "";
  }
}

function normalizeCurrencyFavoritePair(pair, codesSet = null) {
  if (!pair || typeof pair !== "object") return null;
  const from = safeRateCode(pair.from).toUpperCase();
  const to = safeRateCode(pair.to).toUpperCase();
  if (!from || !to || from === to) return null;
  if (codesSet && (!codesSet.has(from) || !codesSet.has(to))) return null;
  return { from, to };
}

function loadCurrencyFavoritePairs() {
  const parsed = getStoredJson(STORAGE_KEYS.currencyPresets, []);
  if (!Array.isArray(parsed)) {
    currencyFavoritePairs = [];
    return;
  }
  const dedup = [];
  const seen = new Set();
  parsed.forEach((item) => {
    const normalized = normalizeCurrencyFavoritePair(item);
    if (!normalized) return;
    const key = `${normalized.from}->${normalized.to}`;
    if (seen.has(key)) return;
    seen.add(key);
    dedup.push(normalized);
  });
  currencyFavoritePairs = dedup.slice(-MAX_CURRENCY_FAVORITES);
}

function saveCurrencyFavoritePairs() {
  setStoredJson(STORAGE_KEYS.currencyPresets, currencyFavoritePairs);
}

function hasCurrencyFavoritePair(from, to) {
  return currencyFavoritePairs.some(
    (item) => item.from === from && item.to === to,
  );
}

function safeRateCode(code) {
  return typeof code === "string" && code.trim() ? code : DEFAULT_FROM_CURRENCY;
}

function getCurrencyName(code) {
  const normalizedCode = String(code || "")
    .trim()
    .toUpperCase();
  const lang = getLanguage() === "ru" ? "ru" : "en";
  return CURRENCY_NAMES[normalizedCode]?.[lang] || normalizedCode;
}

function buildCurrencyOptionText(code) {
  return `${code} - ${getCurrencyName(code)}`;
}

function pickDefaultTo(codes, fromCode) {
  if (codes.includes(DEFAULT_TO_CURRENCY) && DEFAULT_TO_CURRENCY !== fromCode) {
    return DEFAULT_TO_CURRENCY;
  }
  const firstDifferent = codes.find((code) => code !== fromCode);
  return firstDifferent || fromCode;
}

function populateCurrencySelects() {
  const fromSel = byId("cur-from");
  const toSel = byId("cur-to");
  if (!fromSel || !toSel) return;

  const codes = Object.keys(currencyState.rates || {}).sort();
  if (!codes.length) return;

  const prevFrom = safeRateCode(fromSel.value);
  const prevTo = safeRateCode(toSel.value);

  fromSel.replaceChildren();
  toSel.replaceChildren();
  codes.forEach((code) => {
    const fromOption = document.createElement("option");
    fromOption.value = code;
    fromOption.textContent = buildCurrencyOptionText(code);
    fromSel.append(fromOption);

    const toOption = document.createElement("option");
    toOption.value = code;
    toOption.textContent = buildCurrencyOptionText(code);
    toSel.append(toOption);
  });

  fromSel.value = codes.includes(prevFrom) ? prevFrom : DEFAULT_FROM_CURRENCY;
  if (!codes.includes(fromSel.value)) fromSel.value = codes[0];

  toSel.value = codes.includes(prevTo)
    ? prevTo
    : pickDefaultTo(codes, fromSel.value);
  if (!codes.includes(toSel.value)) {
    toSel.value = pickDefaultTo(codes, fromSel.value);
  }
  renderCurrencyCaptions();
  renderCurrencyFavoriteButton(fromSel.value, toSel.value);
}

function renderCurrencyCaptions() {
  const fromSel = byId("cur-from");
  const toSel = byId("cur-to");
  const fromCaption = byId("cur-from-caption");
  const toCaption = byId("cur-to-caption");
  if (!fromSel || !toSel) return;

  if (fromCaption) {
    const fromCode = safeRateCode(fromSel.value);
    fromCaption.textContent = `${fromCode} - ${getCurrencyName(fromCode)}`;
  }
  if (toCaption) {
    const toCode = safeRateCode(toSel.value);
    toCaption.textContent = `${toCode} - ${getCurrencyName(toCode)}`;
  }
}

function renderCurrencyPresets() {
  const fromSel = byId("cur-from");
  const toSel = byId("cur-to");
  const holder = byId("cur-presets");
  if (!fromSel || !toSel || !holder) return;

  holder.innerHTML = "";
  const codes = new Set(Object.keys(currencyState.rates || {}));

  currencyFavoritePairs.forEach((pair) => {
    const normalized = normalizeCurrencyFavoritePair(pair, codes);
    if (!normalized) return;
    const { from, to } = normalized;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-chip";
    button.textContent = `${from} → ${to}`;
    button.addEventListener("click", () => {
      fromSel.value = from;
      toSel.value = to;
      convertCurrency();
    });
    holder.append(button);
  });
}

function renderCurrencyFavoriteButton(fromCode, toCode) {
  const favoriteBtn = byId("cur-favorite-btn");
  if (!favoriteBtn) return;
  const from = safeRateCode(fromCode).toUpperCase();
  const to = safeRateCode(toCode).toUpperCase();
  const isFavorite = hasCurrencyFavoritePair(from, to);
  favoriteBtn.classList.toggle("active", isFavorite);
  const label = isFavorite ? t("currencyPresetRemove") : t("currencyPresetAdd");
  favoriteBtn.title = label;
  favoriteBtn.setAttribute("aria-label", label);
}

function renderRatesSource() {
  const sourceEl = byId("cur-data-source");
  if (!sourceEl) return;
  const sourceText = currencyState.ratesUsingBuiltIn
    ? t("ratesSourceBuiltIn")
    : currencyState.ratesSourceText;
  sourceEl.textContent = `${t("ratesSourceLabel")}: ${sourceText}`;
}

export async function loadRates(manual = false) {
  ensureCurrencyState();
  const status = byId("cur-data-status");
  if (manual && status) status.textContent = t("ratesRefreshing");

  try {
    const r = await fetch(RATES_API_URL);
    if (!r.ok) throw new Error("Rates request failed");
    const d = await r.json();
    if (
      !d?.rates ||
      typeof d.rates !== "object" ||
      !Object.keys(d.rates).length
    ) {
      throw new Error("Invalid rates payload");
    }
    currencyState.rates = d.rates;
    currencyState.ratesUsingBuiltIn = false;
    currencyState.ratesSourceText = "api.exchangerate-api.com";
    if (status)
      status.textContent = `${t("ratesUpdated")}: ${new Date().toLocaleTimeString(getLocale(), { hour12: false })}`;
  } catch (e) {
    console.warn("Rates loading failed, fallback to built-in rates:", e);
    currencyState.rates = { ...BUILT_IN_RATES };
    currencyState.ratesUsingBuiltIn = true;
    currencyState.ratesSourceText = "";
    if (status) status.textContent = t("ratesFallback");
  }
  const availableCodes = new Set(Object.keys(currencyState.rates || {}));
  currencyFavoritePairs = currencyFavoritePairs
    .map((pair) => normalizeCurrencyFavoritePair(pair, availableCodes))
    .filter((pair) => pair !== null);
  saveCurrencyFavoritePairs();
  populateCurrencySelects();
  renderCurrencyPresets();
  renderCurrencyFavoriteButton(byId("cur-from")?.value, byId("cur-to")?.value);
  renderRatesSource();
  convertCurrency();
}

export function swapCurrencyUnits() {
  const fromSel = byId("cur-from");
  const toSel = byId("cur-to");
  if (!fromSel || !toSel) return;
  [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
  renderCurrencyCaptions();
  convertCurrency();
}

export function convertCurrency() {
  ensureCurrencyState();
  const amountEl = byId("cur-amount");
  const fromEl = byId("cur-from");
  const toEl = byId("cur-to");
  const resultEl = byId("cur-result");
  if (!amountEl || !fromEl || !toEl || !resultEl) return;

  const amt = Number.parseFloat(String(amountEl.value || "").replace(",", "."));
  const from = safeRateCode(fromEl.value);
  const to = safeRateCode(toEl.value);
  const fromRate = Number(currencyState.rates?.[from]);
  const toRate = Number(currencyState.rates?.[to]);

  if (
    !Number.isFinite(amt) ||
    !Number.isFinite(fromRate) ||
    !Number.isFinite(toRate) ||
    fromRate <= 0 ||
    toRate <= 0
  ) {
    resultEl.textContent = "—";
    return;
  }

  const usd = amt / fromRate;
  const res = usd * toRate;
  renderCurrencyCaptions();
  renderCurrencyFavoriteButton(from, to);
  resultEl.textContent = `= ${res.toFixed(2)} ${to}`;
}

export function toggleCurrencyFavoritePreset() {
  const fromSel = byId("cur-from");
  const toSel = byId("cur-to");
  if (!fromSel || !toSel) return;
  const from = safeRateCode(fromSel.value).toUpperCase();
  const to = safeRateCode(toSel.value).toUpperCase();
  if (!from || !to || from === to) return;

  const index = currencyFavoritePairs.findIndex(
    (item) => item.from === from && item.to === to,
  );
  if (index >= 0) {
    currencyFavoritePairs.splice(index, 1);
  } else {
    currencyFavoritePairs.push({ from, to });
    if (currencyFavoritePairs.length > MAX_CURRENCY_FAVORITES) {
      currencyFavoritePairs.splice(
        0,
        currencyFavoritePairs.length - MAX_CURRENCY_FAVORITES,
      );
    }
  }
  saveCurrencyFavoritePairs();
  renderCurrencyPresets();
  renderCurrencyFavoriteButton(from, to);
}

function applyCurrencyTranslations() {
  setText("title-currency", t("currencyTitle"));
  setText("cur-refresh-btn", t("refreshServer"));
  populateCurrencySelects();
  renderCurrencyCaptions();
  renderCurrencyPresets();
  renderCurrencyFavoriteButton(byId("cur-from")?.value, byId("cur-to")?.value);
  renderRatesSource();
}

export function initCurrency() {
  ensureCurrencyState();
  loadCurrencyFavoritePairs();
  if (!currencyInitialized) {
    registerTranslationApplier(applyCurrencyTranslations);
    currencyInitialized = true;
  }
  populateCurrencySelects();
  renderCurrencyPresets();
  loadRates();
}
