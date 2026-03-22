import { byId, setText } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";
import { getLocale } from "../core/utils.js";

const currencyState = FEATURE_RUNTIME_STATE.currency;
if (!currencyState.ratesSourceText) {
  currencyState.ratesSourceText = t("ratesSourceBuiltIn");
}

function renderRatesSource() {
  const sourceEl = byId("cur-data-source");
  if (!sourceEl) return;
  sourceEl.textContent = `${t("ratesSourceLabel")}: ${currencyState.ratesSourceText}`;
}

export async function loadRates(manual = false) {
  const status = byId("cur-data-status");
  if (manual && status) status.textContent = t("ratesRefreshing");

  try {
    const r = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!r.ok) throw new Error("Rates request failed");
    const d = await r.json();
    if (d && d.rates) currencyState.rates = d.rates;
    currencyState.ratesUsingBuiltIn = false;
    currencyState.ratesSourceText = "api.exchangerate-api.com";
    if (status)
      status.textContent = `${t("ratesUpdated")}: ${new Date().toLocaleTimeString(getLocale(), { hour12: false })}`;
  } catch (e) {
    console.warn("Rates loading failed, fallback to built-in rates:", e);
    currencyState.ratesUsingBuiltIn = true;
    currencyState.ratesSourceText = t("ratesSourceBuiltIn");
    if (status) status.textContent = t("ratesFallback");
  }
  renderRatesSource();
  convertCurrency();
}

export function swapCurrencyUnits() {
  const fromSel = byId("cur-from");
  const toSel = byId("cur-to");
  [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
  convertCurrency();
}

export function convertCurrency() {
  const amt = parseFloat(byId("cur-amount").value) || 0;
  const from = byId("cur-from").value;
  const to = byId("cur-to").value;
  const usd = amt / currencyState.rates[from];
  const res = usd * currencyState.rates[to];
  byId("cur-result").textContent = `= ${res.toFixed(2)} ${to}`;
}

function applyCurrencyTranslations() {
  setText("title-currency", t("currencyTitle"));
  setText("cur-refresh-btn", t("refreshServer"));
  if (currencyState.ratesUsingBuiltIn) {
    currencyState.ratesSourceText = t("ratesSourceBuiltIn");
  }
  renderRatesSource();
}

export function initCurrency() {
  registerTranslationApplier(applyCurrencyTranslations);
  loadRates();
}
