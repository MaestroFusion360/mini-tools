import { byId, setText } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";
import { getLocale } from "../core/utils.js";

const currencyState = FEATURE_RUNTIME_STATE.currency;
const BUILT_IN_RATES = { ...(currencyState.rates || { USD: 1 }) };
const DEFAULT_FROM_CURRENCY = "USD";
const DEFAULT_TO_CURRENCY = "EUR";
const RATES_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";
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

function safeRateCode(code) {
  return typeof code === "string" && code.trim() ? code : DEFAULT_FROM_CURRENCY;
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

  const optionsHtml = codes
    .map((code) => `<option value="${code}">${code}</option>`)
    .join("");
  fromSel.innerHTML = optionsHtml;
  toSel.innerHTML = optionsHtml;

  fromSel.value = codes.includes(prevFrom) ? prevFrom : DEFAULT_FROM_CURRENCY;
  if (!codes.includes(fromSel.value)) fromSel.value = codes[0];

  toSel.value = codes.includes(prevTo)
    ? prevTo
    : pickDefaultTo(codes, fromSel.value);
  if (!codes.includes(toSel.value)) {
    toSel.value = pickDefaultTo(codes, fromSel.value);
  }
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
    if (!d?.rates || typeof d.rates !== "object" || !Object.keys(d.rates).length) {
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
  populateCurrencySelects();
  renderRatesSource();
  convertCurrency();
}

export function swapCurrencyUnits() {
  const fromSel = byId("cur-from");
  const toSel = byId("cur-to");
  if (!fromSel || !toSel) return;
  [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
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
  resultEl.textContent = `= ${res.toFixed(2)} ${to}`;
}

function applyCurrencyTranslations() {
  setText("title-currency", t("currencyTitle"));
  setText("cur-refresh-btn", t("refreshServer"));
  renderRatesSource();
}

export function initCurrency() {
  ensureCurrencyState();
  if (!currencyInitialized) {
    registerTranslationApplier(applyCurrencyTranslations);
    currencyInitialized = true;
  }
  populateCurrencySelects();
  loadRates();
}
