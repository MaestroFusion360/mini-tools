import { byId, showAppToast } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { formatNumber, getLocale } from "../core/utils.js";

const STORAGE_KEY = "budgetTrackerData";
const MAX_BUDGET_ITEMS = 500;
const MAX_NOTE_LENGTH = 300;
const BUDGET_CURRENCIES = ["USD", "EUR", "RUB"];
const BUDGET_CATEGORIES = {
  expense: [
    { value: "food", labelKey: "budgetCategoryFood" },
    { value: "transport", labelKey: "budgetCategoryTransport" },
    { value: "housing", labelKey: "budgetCategoryHousing" },
    { value: "bills", labelKey: "budgetCategoryBills" },
    { value: "health", labelKey: "budgetCategoryHealth" },
    { value: "education", labelKey: "budgetCategoryEducation" },
    { value: "shopping", labelKey: "budgetCategoryShopping" },
    { value: "entertainment", labelKey: "budgetCategoryEntertainment" },
    { value: "travel", labelKey: "budgetCategoryTravel" },
    { value: "other", labelKey: "budgetCategoryOther" },
  ],
  income: [
    { value: "salary", labelKey: "budgetCategorySalary" },
    { value: "freelance", labelKey: "budgetCategoryFreelance" },
    { value: "business", labelKey: "budgetCategoryBusiness" },
    { value: "investment", labelKey: "budgetCategoryInvestment" },
    { value: "gift", labelKey: "budgetCategoryGift" },
    { value: "refund", labelKey: "budgetCategoryRefund" },
    { value: "other", labelKey: "budgetCategoryOther" },
  ],
};

const budgetState = {
  initialized: false,
  filter: "all",
  limit: 0,
  currency: "USD",
  items: [],
};
const currencyFormatterCache = new Map();

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeMoney(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

function normalizeLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

function normalizeNote(value) {
  return String(value || "")
    .trim()
    .slice(0, MAX_NOTE_LENGTH);
}

function isValidDateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

function isValidBudgetCategory(type, category) {
  return (BUDGET_CATEGORIES[type] || []).some(
    (item) => item.value === category,
  );
}

function createBudgetItemId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeBudgetItem(item) {
  const type = item?.type === "income" ? "income" : "expense";
  const category = String(item?.category || "").trim();
  const amount = normalizeMoney(item?.amount);
  const date = String(item?.date || "").trim();
  const id = String(item?.id || "").trim();
  const createdAt = Number(item?.createdAt);
  if (
    !id ||
    !amount ||
    !isValidDateValue(date) ||
    !isValidBudgetCategory(type, category)
  ) {
    return null;
  }
  return {
    id,
    type,
    category,
    amount,
    date,
    note: normalizeNote(item?.note),
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
  };
}

function loadBudgetState() {
  budgetState.filter = "all";
  budgetState.limit = 0;
  budgetState.currency = "USD";
  budgetState.items = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    const parsedLimit = normalizeLimit(parsed.limit);
    if (parsedLimit !== null) {
      budgetState.limit = parsedLimit;
    }
    if (BUDGET_CURRENCIES.includes(parsed.currency)) {
      budgetState.currency = parsed.currency;
    }
    if (Array.isArray(parsed.items)) {
      budgetState.items = parsed.items
        .map((item) => normalizeBudgetItem(item))
        .filter((item) => item !== null);
    }
  } catch {
    // Ignore invalid localStorage payload and keep defaults.
  }
}

function saveBudgetState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        limit: budgetState.limit,
        currency: budgetState.currency,
        items: budgetState.items,
      }),
    );
  } catch {}
}

function currencyFormat(value) {
  const valueNumber = Number(value);
  if (!Number.isFinite(valueNumber)) return "0.00";
  const locale = getLocale();
  const cacheKey = `${locale}|${budgetState.currency}`;
  if (!currencyFormatterCache.has(cacheKey)) {
    currencyFormatterCache.set(
      cacheKey,
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: budgetState.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
  }
  return currencyFormatterCache.get(cacheKey).format(valueNumber);
}

function getCategoryMeta(type, categoryValue) {
  const list = BUDGET_CATEGORIES[type] || [];
  return list.find((item) => item.value === categoryValue) || null;
}

function getCategoryLabel(type, categoryValue) {
  const meta = getCategoryMeta(type, categoryValue);
  if (!meta) return categoryValue;
  return t(meta.labelKey);
}

function getFilteredBudgetItems() {
  if (budgetState.filter === "all") return budgetState.items;
  return budgetState.items.filter((item) => item.type === budgetState.filter);
}

function calcBudgetSummary() {
  const income = budgetState.items
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expense = budgetState.items
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expense;
  const limitUsedPercent =
    budgetState.limit > 0
      ? Math.min((expense / budgetState.limit) * 100, 999)
      : 0;
  return { income, expense, balance, limitUsedPercent };
}

function removeBudgetItem(id) {
  const next = budgetState.items.filter((item) => item.id !== id);
  if (next.length === budgetState.items.length) return;
  budgetState.items = next;
  saveBudgetState();
  renderBudgetUi();
}

function renderBudgetSummary() {
  const summary = calcBudgetSummary();
  const map = [
    ["budget-balance", currencyFormat(summary.balance)],
    ["budget-income-total", currencyFormat(summary.income)],
    ["budget-expense-total", currencyFormat(summary.expense)],
    [
      "budget-limit-used",
      `${formatNumber(summary.limitUsedPercent, { maximumFractionDigits: 1 })}%`,
    ],
  ];
  map.forEach(([id, value]) => {
    const el = byId(id);
    if (el) el.textContent = value;
  });
}

function renderBudgetStatus() {
  const status = byId("budget-status");
  if (!status) return;
  const count = getFilteredBudgetItems().length;
  status.textContent = t("budgetStatusCount").replace("{count}", String(count));
}

function renderBudgetList() {
  const holder = byId("budget-list");
  if (!holder) return;
  const items = getFilteredBudgetItems()
    .slice()
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      if (a.createdAt !== b.createdAt) return b.createdAt - a.createdAt;
      return a.id < b.id ? 1 : -1;
    });
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "small-text";
    empty.textContent = t("budgetEmptyState");
    holder.replaceChildren(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "budget-item";

    const main = document.createElement("div");
    main.className = "budget-item-main";
    const categoryLabel = getCategoryLabel(item.type, item.category);
    const title = document.createElement("div");
    title.className = "budget-item-title";
    title.textContent = categoryLabel;
    const note = document.createElement("div");
    note.className = "small-text";
    note.textContent = item.note || "-";
    main.append(title, note);

    const meta = document.createElement("div");
    meta.className = "budget-item-meta";
    const amountPrefix = item.type === "income" ? "+" : "-";
    const amount = document.createElement("strong");
    amount.className =
      item.type === "income" ? "budget-income" : "budget-expense";
    amount.textContent = `${amountPrefix}${currencyFormat(item.amount)}`;
    const date = document.createElement("span");
    date.className = "small-text";
    date.textContent = item.date;
    meta.append(amount, date);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "text-action-btn budget-remove-btn todo-remove-btn";
    removeBtn.innerHTML =
      '<svg class="icon-svg btn-icon" aria-hidden="true"><use href="#i-x"></use></svg>';
    removeBtn.title = t("budgetRemove");
    removeBtn.setAttribute("aria-label", t("budgetRemove"));
    removeBtn.addEventListener("click", () => removeBudgetItem(item.id));

    row.append(main, meta, removeBtn);
    fragment.append(row);
  });
  holder.replaceChildren(fragment);
}

function renderBudgetUi() {
  const limitInput = byId("budget-limit");
  const dateInput = byId("budget-date");
  const filter = byId("budget-filter");
  const currencySelect = byId("budget-currency");
  const typeSelect = byId("budget-type");
  if (limitInput && document.activeElement !== limitInput) {
    limitInput.value = budgetState.limit > 0 ? String(budgetState.limit) : "";
  }
  if (currencySelect) currencySelect.value = budgetState.currency;
  if (typeSelect && !["expense", "income"].includes(typeSelect.value)) {
    typeSelect.value = "expense";
  }
  if (dateInput && !dateInput.value) dateInput.value = getTodayDateValue();
  if (filter) filter.value = budgetState.filter;
  renderBudgetCategoryOptions();
  renderBudgetSummary();
  renderBudgetStatus();
  renderBudgetList();
}

function renderBudgetCategoryOptions() {
  const typeSelect = byId("budget-type");
  const categorySelect = byId("budget-category");
  if (!typeSelect || !categorySelect) return;
  const type = typeSelect.value === "income" ? "income" : "expense";
  const categories = BUDGET_CATEGORIES[type] || [];
  const previousValue = categorySelect.value;
  categorySelect.innerHTML = "";
  categories.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = t(item.labelKey);
    categorySelect.append(option);
  });
  const hasPrevious = categories.some((item) => item.value === previousValue);
  categorySelect.value = hasPrevious
    ? previousValue
    : categories[0]?.value || "";
}

export function onBudgetTypeChange() {
  renderBudgetCategoryOptions();
}

export function setBudgetCurrency() {
  const currencySelect = byId("budget-currency");
  if (!currencySelect) return;
  const nextCurrency = String(currencySelect.value || "USD");
  if (!BUDGET_CURRENCIES.includes(nextCurrency)) return;
  budgetState.currency = nextCurrency;
  saveBudgetState();
  renderBudgetUi();
}

export function saveBudgetLimit() {
  const limitInput = byId("budget-limit");
  if (!limitInput) return;
  const rawValue = String(limitInput.value || "").trim();
  if (!rawValue) {
    budgetState.limit = 0;
    saveBudgetState();
    renderBudgetUi();
    showAppToast(t("budgetLimitSaved"));
    return;
  }
  const value = normalizeLimit(rawValue);
  if (value === null) {
    showAppToast(t("budgetInvalidLimit"));
    return;
  }
  budgetState.limit = value;
  saveBudgetState();
  renderBudgetUi();
  showAppToast(t("budgetLimitSaved"));
}

export function clearBudgetForm() {
  const type = byId("budget-type");
  const category = byId("budget-category");
  const amount = byId("budget-amount");
  const date = byId("budget-date");
  const note = byId("budget-note");
  if (type) type.value = "expense";
  renderBudgetCategoryOptions();
  if (category && !category.value) {
    const firstOption = category.querySelector("option");
    if (firstOption) category.value = firstOption.value;
  }
  if (amount) amount.value = "";
  if (date) date.value = getTodayDateValue();
  if (note) note.value = "";
}

export function addBudgetEntry() {
  const type = byId("budget-type");
  const category = byId("budget-category");
  const amount = byId("budget-amount");
  const date = byId("budget-date");
  const note = byId("budget-note");
  if (!type || !category || !amount || !date || !note) return;

  const parsedAmount = normalizeMoney(amount.value);
  const parsedCategory = String(category.value || "").trim();
  const parsedType = type.value === "income" ? "income" : "expense";
  const parsedDate = String(date.value || getTodayDateValue());
  if (
    !parsedCategory ||
    parsedAmount === null ||
    !isValidDateValue(parsedDate) ||
    !isValidBudgetCategory(parsedType, parsedCategory)
  ) {
    showAppToast(t("budgetInvalidEntry"));
    return;
  }

  const nextItem = {
    id: createBudgetItemId(),
    type: parsedType,
    category: parsedCategory,
    amount: parsedAmount,
    date: parsedDate,
    note: normalizeNote(note.value),
    createdAt: Date.now(),
  };
  budgetState.items.push(nextItem);
  if (budgetState.items.length > MAX_BUDGET_ITEMS) {
    budgetState.items.splice(0, budgetState.items.length - MAX_BUDGET_ITEMS);
  }
  saveBudgetState();
  clearBudgetForm();
  renderBudgetUi();
}

export function setBudgetFilter() {
  const filter = byId("budget-filter");
  if (!filter) return;
  const value = String(filter.value || "all");
  if (!["all", "expense", "income"].includes(value)) return;
  budgetState.filter = value;
  renderBudgetUi();
}

export function clearBudgetEntries() {
  if (!confirm(t("budgetClearConfirm"))) return;
  budgetState.items = [];
  saveBudgetState();
  renderBudgetUi();
}

function applyBudgetTranslations() {
  const staticText = [
    ["menu-budget", "budget"],
    ["title-budget", "budgetTitle"],
    ["budget-save-limit-btn", "budgetSaveLimit"],
    ["budget-add-btn", "budgetAddEntry"],
    ["budget-reset-form-btn", "budgetResetForm"],
    ["budget-balance-label", "budgetBalance"],
    ["budget-income-label", "budgetIncome"],
    ["budget-expense-label", "budgetExpense"],
    ["budget-limit-used-label", "budgetLimitUsed"],
    ["budget-clear-all-btn", "budgetClearAll"],
  ];
  staticText.forEach(([id, key]) => {
    const el = byId(id);
    if (el) el.textContent = t(key);
  });

  const limitInput = byId("budget-limit");
  const amountInput = byId("budget-amount");
  const noteInput = byId("budget-note");
  if (limitInput) limitInput.placeholder = t("budgetLimitPlaceholder");
  if (amountInput) amountInput.placeholder = t("budgetAmountPlaceholder");
  if (noteInput) noteInput.placeholder = t("budgetNotePlaceholder");

  const typeSelect = byId("budget-type");
  if (typeSelect) {
    const labels = {
      income: t("budgetIncome"),
      expense: t("budgetExpense"),
    };
    Array.from(typeSelect.options).forEach((option) => {
      option.textContent = labels[option.value] || option.textContent;
    });
  }

  const filter = byId("budget-filter");
  if (filter) {
    const labels = {
      all: t("budgetFilterAll"),
      expense: t("budgetExpense"),
      income: t("budgetIncome"),
    };
    Array.from(filter.options).forEach((option) => {
      option.textContent = labels[option.value] || option.textContent;
    });
  }

  renderBudgetUi();
}

export function initBudget() {
  loadBudgetState();
  if (!budgetState.initialized) {
    registerTranslationApplier(applyBudgetTranslations);
    budgetState.initialized = true;
  }
  if (!budgetState.filter) budgetState.filter = "all";
  renderBudgetUi();
}
