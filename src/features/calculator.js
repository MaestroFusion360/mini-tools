import { byId, setText } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";

const calcState = FEATURE_RUNTIME_STATE.calculator;
const CALC_ERROR_TOKEN = "__CALC_ERROR__";
const calcAllowed = /^[\d+\-*/().,%\s]*$/;

function isErrorState() {
  return calcState.calcVal === CALC_ERROR_TOKEN;
}

function setCalcError() {
  calcState.calcVal = CALC_ERROR_TOKEN;
}

function resetErrorToZero() {
  if (isErrorState()) calcState.calcVal = "0";
}

function formatCalcTextForDisplay(text) {
  if (text === CALC_ERROR_TOKEN) {
    const label = t("calcError");
    return label && label !== "calcError" ? label : "Error";
  }
  return String(text).replaceAll("**", "^").replaceAll("*", "x");
}

function renderCalcDisplay() {
  const display = byId("calc-display");
  const preview = byId("calc-expression-preview");
  if (display) display.textContent = formatCalcTextForDisplay(calcState.calcVal);
  if (preview) {
    preview.textContent = `${t("calcExpression")}: ${formatCalcTextForDisplay(calcState.calcVal)}`;
  }
}

function createHistoryRemoveButton(actualIndex) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "calc-history-remove-btn";
  const removeText = t("removeHistoryItem");
  button.setAttribute("aria-label", removeText);
  button.title = removeText;
  button.innerHTML = '<svg class="icon-svg btn-icon"><use href="#i-x"></use></svg>';
  button.addEventListener("click", () => {
    calcRemoveHistoryAt(actualIndex);
  });
  return button;
}

function renderCalcHistory() {
  const el = byId("calc-history");
  if (!el) return;
  if (!calcState.calcHistory.length) {
    el.textContent = t("calcEmptyHistory");
    return;
  }
  el.textContent = "";
  const recentItems = calcState.calcHistory.slice(-10).reverse();
  recentItems.forEach((item, visibleIndex) => {
    const actualIndex = calcState.calcHistory.length - 1 - visibleIndex;
    const row = document.createElement("div");
    row.className = "calc-history-item";

    const entry = document.createElement("span");
    entry.className = "calc-history-entry";
    entry.textContent = formatCalcTextForDisplay(item);

    row.append(entry, createHistoryRemoveButton(actualIndex));
    el.append(row);
  });
}

function renderCalcMemory() {
  const el = byId("calc-memory-value");
  if (!el) return;
  const valueText = Number.isFinite(calcState.calcMemoryValue)
    ? calcState.calcMemoryValue.toString()
    : "0";
  el.textContent = `${t("calcMemoryValue")}: ${valueText}`;
}

function hasBalancedBrackets(expr) {
  const openBrackets = (expr.match(/\(/g) || []).length;
  const closeBrackets = (expr.match(/\)/g) || []).length;
  return openBrackets === closeBrackets;
}

function applyPercentSemantics(expr) {
  let next = expr;
  const plusMinusPercent = /(-?\d+(?:\.\d+)?)([+\-])(\d+(?:\.\d+)?)%/;
  while (plusMinusPercent.test(next)) {
    next = next.replace(plusMinusPercent, "($1$2($1*$3/100))");
  }
  return next.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
}

function evaluateExpression(rawValue) {
  if (rawValue === CALC_ERROR_TOKEN) {
    throw new Error("Error state");
  }
  let expr = String(rawValue || "0").replace(/\s+/g, "");
  expr = expr.replaceAll("Math.PI", `(${Math.PI})`).replaceAll("Math.E", `(${Math.E})`);
  if (!expr || !calcAllowed.test(expr)) throw new Error("Invalid input");
  expr = applyPercentSemantics(expr);
  if (!hasBalancedBrackets(expr)) throw new Error("Unbalanced brackets");
  const result = Function(`\"use strict\"; return (${expr})`)();
  if (!Number.isFinite(result)) throw new Error("Non-finite result");
  return result;
}

function getCalcCurrentNumber() {
  try {
    return evaluateExpression(calcState.calcVal);
  } catch {
    return null;
  }
}

function isOperatorToken(token) {
  return ["+", "-", "*", "/", "%", "**"].includes(token);
}

function canAppendToken(current, token) {
  const cur = String(current || "");
  if (!token) return false;

  if (token === ".") {
    const lastNumberChunk = (cur.match(/(?:^|[^\d.])(\d*\.?\d*)$/)?.[1] || "");
    return !lastNumberChunk.includes(".");
  }

  if (token === "(") {
    return !/[\d.)%]$/.test(cur);
  }

  if (token === ")") {
    if (/[+\-*/%(]$/.test(cur)) return false;
    const openCount = (cur.match(/\(/g) || []).length;
    const closeCount = (cur.match(/\)/g) || []).length;
    return openCount > closeCount;
  }

  if (token === "%") {
    return /[\d)]$/.test(cur);
  }

  if (isOperatorToken(token)) {
    if (token === "-") return !cur.endsWith("**");
    return !/[+\-*/(]$/.test(cur) && !cur.endsWith("**");
  }

  return true;
}

function toggleSignForExpression(expr) {
  const normalized = String(expr || "").trim();
  if (!normalized || normalized === "0") return "0";

  const wrappedNegativeTail = normalized.match(/^(.*)\(-([\d.]+)\)$/);
  if (wrappedNegativeTail) {
    return `${wrappedNegativeTail[1]}${wrappedNegativeTail[2]}` || wrappedNegativeTail[2];
  }

  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    const current = Number(normalized);
    return current === 0 ? "0" : (-current).toString();
  }

  const tail = normalized.match(/(\d+(?:\.\d+)?)$/);
  if (!tail || typeof tail.index !== "number") return normalized;

  const start = tail.index;
  const numberPart = tail[1];
  const before = normalized.slice(0, start);

  if (before.endsWith("-") && (before.length === 1 || /[+\-*/%(]$/.test(before.slice(0, -1)))) {
    return `${before.slice(0, -1)}${numberPart}`;
  }

  return `${before}(-${numberPart})`;
}

function isCalculatorPageActive() {
  const page = byId("page-calc");
  if (!page) return true;
  return page.classList.contains("active");
}

export function toggleCalcMode(toggle = true) {
  if (toggle) calcState.calcScientificMode = !calcState.calcScientificMode;
  byId("calc-mode-btn").textContent = calcState.calcScientificMode
    ? t("calcModeScientific")
    : t("calcModeBasic");
  document
    .querySelector(".calc-buttons")
    .classList.toggle("calc-scientific", calcState.calcScientificMode);
}

export function calcInput(ch) {
  resetErrorToZero();
  const token = String(ch || "");
  if (!token) return;

  if (calcState.calcVal === "0") {
    if (["+", "*", "/", "%", "**", ")"].includes(token)) return;
    if (![".", "**", "%"].includes(token)) calcState.calcVal = token;
    else calcState.calcVal += token;
    renderCalcDisplay();
    return;
  }

  if (!canAppendToken(calcState.calcVal, token)) return;
  calcState.calcVal += token;
  renderCalcDisplay();
}

export function calcBackspace() {
  if (isErrorState()) {
    calcState.calcVal = "0";
  } else {
    calcState.calcVal = calcState.calcVal.length > 1 ? calcState.calcVal.slice(0, -1) : "0";
  }
  renderCalcDisplay();
}

export function calcClear() {
  calcState.calcVal = "0";
  renderCalcDisplay();
}

export function calcToggleSign() {
  resetErrorToZero();
  calcState.calcVal = toggleSignForExpression(calcState.calcVal);
  renderCalcDisplay();
}

export function calcMemoryClear() {
  calcState.calcMemoryValue = 0;
  renderCalcMemory();
}

export function calcMemoryRecall() {
  calcState.calcVal = Number.isFinite(calcState.calcMemoryValue) ? calcState.calcMemoryValue.toString() : "0";
  renderCalcDisplay();
}

export function calcMemoryAdd() {
  const current = getCalcCurrentNumber();
  if (current === null) return;
  calcState.calcMemoryValue += current;
  renderCalcMemory();
}

export function calcMemorySubtract() {
  const current = getCalcCurrentNumber();
  if (current === null) return;
  calcState.calcMemoryValue -= current;
  renderCalcMemory();
}

export function calcRemoveHistoryAt(index) {
  if (!Number.isInteger(index)) return;
  if (index < 0 || index >= calcState.calcHistory.length) return;
  calcState.calcHistory.splice(index, 1);
  renderCalcHistory();
}

export function calcClearHistory() {
  calcState.calcHistory.length = 0;
  renderCalcHistory();
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) {
    throw new Error("Factorial range");
  }
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

const calcFunctionHandlers = {
  sin: (value) => Math.sin((value * Math.PI) / 180),
  cos: (value) => Math.cos((value * Math.PI) / 180),
  tan: (value) => Math.tan((value * Math.PI) / 180),
  sqrt: (value) => Math.sqrt(value),
  ln: (value) => Math.log(value),
  log: (value) => Math.log10(value),
  fact: (value) => factorial(value),
};

export function calcFunction(fn) {
  try {
    const current = getCalcCurrentNumber();
    if (current === null) throw new Error("Invalid expression");
    const handler = calcFunctionHandlers[fn];
    if (!handler) throw new Error("Unknown function");
    const result = handler(current);
    if (!Number.isFinite(result)) throw new Error("Non-finite result");
    const exprLabel = `${fn}(${current})`;
    calcState.calcVal = result.toString();
    calcState.calcHistory.push(`${exprLabel} = ${calcState.calcVal}`);
    renderCalcHistory();
  } catch {
    setCalcError();
  }
  renderCalcDisplay();
}

export function calcEquals(returnOnly = false) {
  try {
    const result = evaluateExpression(calcState.calcVal);
    const resultText = result.toString();
    if (!returnOnly) {
      calcState.calcHistory.push(`${calcState.calcVal} = ${resultText}`);
      calcState.calcVal = resultText;
      renderCalcHistory();
      renderCalcDisplay();
    }
    return resultText;
  } catch {
    if (!returnOnly) {
      setCalcError();
      renderCalcDisplay();
    }
    return "NaN";
  }
}

function shouldIgnoreCalculatorHotkeys(target) {
  if (!target || !(target instanceof Element)) return false;
  return !!target.closest('input, textarea, select, [contenteditable="true"]');
}

function handleCalculatorKeyboard(event) {
  if (!isCalculatorPageActive()) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (shouldIgnoreCalculatorHotkeys(event.target)) return;

  const key = event.key;
  let handled = true;

  if (/^[0-9]$/.test(key)) calcInput(key);
  else if (key === ".") calcInput(".");
  else if (["+", "-", "*", "/", "%", "(", ")"].includes(key)) calcInput(key);
  else if (key === "^") calcInput("**");
  else if (key === "Enter" || key === "=") calcEquals();
  else if (key === "Backspace") calcBackspace();
  else if (key === "Delete" || key === "Escape") calcClear();
  else handled = false;

  if (handled) event.preventDefault();
}

function applyCalculatorTranslations() {
  setText("title-calc", t("calculatorTitle"));
  setText("calc-mc-btn", t("calcMemoryClear"));
  setText("calc-mr-btn", t("calcMemoryRecall"));
  setText("calc-mplus-btn", t("calcMemoryAdd"));
  setText("calc-mminus-btn", t("calcMemorySubtract"));
  setText(
    "calc-mode-btn",
    calcState.calcScientificMode ? t("calcModeScientific") : t("calcModeBasic"),
  );
  const historyTitle = document.querySelector(".calc-history-title");
  if (historyTitle) historyTitle.textContent = t("calcHistoryTitle");
  renderCalcDisplay();
  renderCalcHistory();
  renderCalcMemory();
}

export function initCalculator() {
  renderCalcDisplay();
  renderCalcHistory();
  renderCalcMemory();

  if (!calcState.calcInitialized) {
    registerTranslationApplier(applyCalculatorTranslations);
    window.addEventListener("keydown", handleCalculatorKeyboard);
    calcState.calcInitialized = true;
  }
}

