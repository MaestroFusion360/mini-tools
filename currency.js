import { byId, setText } from './dom.js';
import { registerTranslationApplier, t } from './i18n.js';
import { getLocale } from './utils.js';

let rates = { USD: 1, EUR: 0.92, RUB: 92.5, GBP: 0.79, JPY: 151.5 };

export async function loadRates(manual = false) {
    const status = byId('cur-data-status');
    if (manual && status) status.textContent = t('ratesRefreshing');

    try {
        const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!r.ok) throw new Error('Rates request failed');
        const d = await r.json();
        if (d && d.rates) rates = d.rates;
        if (status) status.textContent = `${t('ratesUpdated')}: ${new Date().toLocaleTimeString(getLocale(), { hour12: false })}`;
    } catch (e) {
        console.warn('Rates loading failed, fallback to built-in rates:', e);
        if (status) status.textContent = t('ratesFallback');
    }
    convertCurrency();
}

export function swapCurrencyUnits() {
    const fromSel = byId('cur-from');
    const toSel = byId('cur-to');
    [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
    convertCurrency();
}

export function convertCurrency() {
    const amt = parseFloat(byId('cur-amount').value) || 0;
    const from = byId('cur-from').value;
    const to = byId('cur-to').value;
    const usd = amt / rates[from];
    const res = usd * rates[to];
    byId('cur-result').textContent = `= ${res.toFixed(2)} ${to}`;
}

function applyCurrencyTranslations() {
    setText('title-currency', t('currencyTitle'));
    setText('cur-refresh-btn', t('refreshServer'));
}

export function initCurrency() {
    registerTranslationApplier(applyCurrencyTranslations);
    loadRates();
}
