import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  convertCurrency,
  initCurrency,
  loadRates,
  swapCurrencyUnits,
} from "../features/currency.js";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";

function mountCurrencyDom() {
  document.body.innerHTML = `
    <h2 id="title-currency"></h2>
    <button id="cur-refresh-btn"></button>
    <input id="cur-amount" type="text" value="1" />
    <select id="cur-from">
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="RUB" selected>RUB</option>
      <option value="JPY">JPY</option>
    </select>
    <button id="cur-swap-btn"></button>
    <select id="cur-to">
      <option value="USD" selected>USD</option>
      <option value="EUR">EUR</option>
      <option value="RUB">RUB</option>
      <option value="JPY">JPY</option>
    </select>
    <div id="cur-result"></div>
    <div id="cur-data-status"></div>
    <div id="cur-data-source"></div>
  `;
}

function resetCurrencyState() {
  FEATURE_RUNTIME_STATE.currency.rates = {
    USD: 1,
    EUR: 0.92,
    RUB: 92.5,
    GBP: 0.79,
    JPY: 151.5,
  };
  FEATURE_RUNTIME_STATE.currency.ratesSourceText = "";
  FEATURE_RUNTIME_STATE.currency.ratesUsingBuiltIn = true;
}

describe("currency module", () => {
  beforeEach(() => {
    mountCurrencyDom();
    resetCurrencyState();
    vi.unstubAllGlobals();
  });

  it("populates currency selects from loaded rates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          rates: {
            USD: 1,
            EUR: 0.9,
            RUB: 90,
            CHF: 0.87,
            CAD: 1.35,
          },
        }),
      })),
    );

    await loadRates();

    const from = document.getElementById("cur-from");
    const to = document.getElementById("cur-to");
    expect(from?.querySelector('option[value="CHF"]')).toBeTruthy();
    expect(to?.querySelector('option[value="CAD"]')).toBeTruthy();
  });

  it("falls back to built-in rates when API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }),
    );

    await loadRates(true);

    expect(FEATURE_RUNTIME_STATE.currency.ratesUsingBuiltIn).toBe(true);
    expect(FEATURE_RUNTIME_STATE.currency.rates.USD).toBe(1);
    expect(document.getElementById("cur-data-status")?.textContent).toBe(
      "ratesFallback",
    );
  });

  it("shows dash for invalid input instead of coercing to zero", () => {
    document.getElementById("cur-amount").value = "abc";
    convertCurrency();

    expect(document.getElementById("cur-result")?.textContent).toBe("—");
  });

  it("swaps selected currencies safely", () => {
    document.getElementById("cur-from").value = "EUR";
    document.getElementById("cur-to").value = "JPY";

    swapCurrencyUnits();

    expect(document.getElementById("cur-from")?.value).toBe("JPY");
    expect(document.getElementById("cur-to")?.value).toBe("EUR");
  });

  it("init does not crash on repeated call", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ rates: { USD: 1, EUR: 0.9 } }),
      })),
    );

    expect(() => initCurrency()).not.toThrow();
    expect(() => initCurrency()).not.toThrow();
  });
});
