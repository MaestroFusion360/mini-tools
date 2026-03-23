import { beforeEach, describe, expect, it } from "vitest";
import {
  addBudgetEntry,
  clearBudgetEntries,
  initBudget,
  onBudgetTypeChange,
  saveBudgetLimit,
  setBudgetFilter,
} from "../features/budget.js";

function mountBudgetDom() {
  document.body.innerHTML = `
    <span id="menu-budget"></span>
    <h2 id="title-budget"></h2>
    <input id="budget-limit" />
    <select id="budget-currency">
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="RUB">RUB</option>
    </select>
    <button id="budget-save-limit-btn"></button>
    <select id="budget-type">
      <option value="expense">Expense</option>
      <option value="income">Income</option>
    </select>
    <select id="budget-category"></select>
    <input id="budget-amount" />
    <input id="budget-date" />
    <input id="budget-note" />
    <button id="budget-add-btn"></button>
    <button id="budget-reset-form-btn"></button>
    <span id="budget-balance-label"></span>
    <span id="budget-income-label"></span>
    <span id="budget-expense-label"></span>
    <span id="budget-limit-used-label"></span>
    <button id="budget-clear-all-btn"></button>
    <select id="budget-filter">
      <option value="all">All</option>
      <option value="expense">Expense</option>
      <option value="income">Income</option>
    </select>
    <div id="budget-balance"></div>
    <div id="budget-income-total"></div>
    <div id="budget-expense-total"></div>
    <div id="budget-limit-used"></div>
    <div id="budget-status"></div>
    <div id="budget-list"></div>
  `;
}

describe("budget module", () => {
  beforeEach(() => {
    localStorage.clear();
    mountBudgetDom();
    initBudget();
  });

  it("saves limit and renders percentage", () => {
    document.getElementById("budget-limit").value = "1000";
    saveBudgetLimit();

    document.getElementById("budget-type").value = "expense";
    document.getElementById("budget-category").value = "food";
    document.getElementById("budget-amount").value = "250";
    document.getElementById("budget-date").value = "2026-03-23";
    addBudgetEntry();

    expect(document.getElementById("budget-limit-used")?.textContent).toContain(
      "25",
    );
  });

  it("adds entries and filters by type", () => {
    document.getElementById("budget-type").value = "income";
    onBudgetTypeChange();
    document.getElementById("budget-category").value = "salary";
    document.getElementById("budget-amount").value = "1500";
    document.getElementById("budget-date").value = "2026-03-23";
    addBudgetEntry();

    document.getElementById("budget-type").value = "expense";
    onBudgetTypeChange();
    document.getElementById("budget-category").value = "housing";
    document.getElementById("budget-amount").value = "800";
    document.getElementById("budget-date").value = "2026-03-23";
    addBudgetEntry();

    document.getElementById("budget-filter").value = "income";
    setBudgetFilter();
    const text = document.getElementById("budget-list")?.textContent || "";
    expect(text).toContain("budgetCategorySalary");
    expect(text).not.toContain("budgetCategoryHousing");
  });

  it("clears all entries after confirmation", () => {
    document.getElementById("budget-type").value = "expense";
    document.getElementById("budget-category").value = "transport";
    document.getElementById("budget-amount").value = "25";
    document.getElementById("budget-date").value = "2026-03-23";
    addBudgetEntry();

    window.confirm = () => true;
    clearBudgetEntries();
    const text = document.getElementById("budget-list")?.textContent || "";
    expect(text).toContain("budgetEmptyState");
  });

  it("renders note safely without injecting html", () => {
    document.getElementById("budget-type").value = "expense";
    document.getElementById("budget-category").value = "food";
    document.getElementById("budget-amount").value = "10";
    document.getElementById("budget-date").value = "2026-03-23";
    document.getElementById("budget-note").value =
      "<img src=x onerror=alert(1) />";
    addBudgetEntry();

    const list = document.getElementById("budget-list");
    expect(list?.querySelector("img")).toBe(null);
    expect(list?.textContent || "").toContain("<img src=x onerror=alert(1) />");
  });

  it("ignores invalid entries from localStorage on init", () => {
    localStorage.clear();
    localStorage.setItem(
      "budgetTrackerData",
      JSON.stringify({
        limit: 1000,
        currency: "USD",
        items: [
          {
            id: "ok-1",
            type: "expense",
            category: "food",
            amount: 100,
            date: "2026-03-23",
            note: "ok",
          },
          {
            id: "bad-1",
            type: "expense",
            category: "unknown",
            amount: 100,
            date: "2026-03-23",
            note: "bad category",
          },
          {
            id: "bad-2",
            type: "income",
            category: "salary",
            amount: -10,
            date: "2026-03-23",
            note: "negative",
          },
          {
            id: "bad-3",
            type: "income",
            category: "salary",
            amount: 10,
            date: "invalid-date",
            note: "bad date",
          },
        ],
      }),
    );

    mountBudgetDom();
    initBudget();

    const text = document.getElementById("budget-list")?.textContent || "";
    expect(text).toContain("budgetCategoryFood");
    expect(text).not.toContain("unknown");
    expect(document.querySelectorAll(".budget-item").length).toBe(1);
  });
});
