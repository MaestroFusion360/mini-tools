import { byId, setIcon, setText } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";

let calcVal = "0";
let calcScientificMode = false;
let calcMemoryValue = 0;
const calcAllowed = /^[\d+\-*/().,%\s]*$/;
const calcHistory = [];

function renderCalcDisplay() {
  byId("calc-display").textContent = calcVal;
  byId("calc-expression-preview").textContent =
    `${t("calcExpression")}: ${calcVal}`;
}

function renderCalcHistory() {
  const el = byId("calc-history");
  if (!calcHistory.length) {
    el.textContent = t("calcEmptyHistory");
    return;
  }
  el.innerHTML = calcHistory
    .slice(-10)
    .reverse()
    .map((item) => `<div class="calc-history-item">${item}</div>`)
    .join("");
}

function getCalcCurrentNumber() {
  const value = Number(calcEquals(true));
  return Number.isFinite(value) ? value : null;
}

function renderCalcMemory() {
  const el = byId("calc-memory-value");
  if (!el) return;
  const valueText = Number.isFinite(calcMemoryValue)
    ? calcMemoryValue.toString()
    : "0";
  el.textContent = `${t("calcMemoryValue")}: ${valueText}`;
}

export function toggleCalcMode(toggle = true) {
  if (toggle) calcScientificMode = !calcScientificMode;
  byId("calc-mode-btn").textContent = calcScientificMode
    ? t("calcModeScientific")
    : t("calcModeBasic");
  document
    .querySelector(".calc-buttons")
    .classList.toggle("calc-scientific", calcScientificMode);
}

export function calcInput(ch) {
  if (calcVal === "0" && ![".", "**", "%"].includes(ch)) calcVal = ch;
  else calcVal += ch;
  renderCalcDisplay();
}

export function calcBackspace() {
  calcVal = calcVal.length > 1 ? calcVal.slice(0, -1) : "0";
  renderCalcDisplay();
}

export function calcClear() {
  calcVal = "0";
  renderCalcDisplay();
}

export function calcToggleSign() {
  const current = getCalcCurrentNumber();
  if (current === null) return;
  calcVal = current === 0 ? "0" : (-current).toString();
  renderCalcDisplay();
}

export function calcMemoryClear() {
  calcMemoryValue = 0;
  renderCalcMemory();
}

export function calcMemoryRecall() {
  calcVal = Number.isFinite(calcMemoryValue) ? calcMemoryValue.toString() : "0";
  renderCalcDisplay();
}

export function calcMemoryAdd() {
  const current = getCalcCurrentNumber();
  if (current === null) return;
  calcMemoryValue += current;
  renderCalcMemory();
}

export function calcMemorySubtract() {
  const current = getCalcCurrentNumber();
  if (current === null) return;
  calcMemoryValue -= current;
  renderCalcMemory();
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170)
    throw new Error("Factorial range");
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
    const current = Number(calcEquals(true));
    const handler = calcFunctionHandlers[fn];
    if (!handler) throw new Error("Unknown function");
    const result = handler(current);
    if (!Number.isFinite(result)) throw new Error("Non-finite result");
    const exprLabel = `${fn}(${current})`;
    calcVal = result.toString();
    calcHistory.push(`${exprLabel} = ${calcVal}`);
    renderCalcHistory();
  } catch {
    calcVal = "0";
  }
  renderCalcDisplay();
}

export function calcEquals(returnOnly = false) {
  let resultText = "0";
  try {
    let expr = calcVal.replace(/\s+/g, "");
    if (!expr || !calcAllowed.test(expr)) throw new Error("Invalid input");
    expr = expr.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
    const openBrackets = (expr.match(/\(/g) || []).length;
    const closeBrackets = (expr.match(/\)/g) || []).length;
    if (openBrackets !== closeBrackets) throw new Error("Unbalanced brackets");
    const result = Function(`"use strict"; return (${expr})`)();
    if (!Number.isFinite(result)) throw new Error("Non-finite result");
    resultText = result.toString();
    if (!returnOnly) {
      calcHistory.push(`${calcVal} = ${resultText}`);
      calcVal = resultText;
      renderCalcHistory();
    }
  } catch {
    if (!returnOnly) calcVal = "0";
  }
  if (!returnOnly) renderCalcDisplay();
  return resultText;
}

function shouldIgnoreCalculatorHotkeys(target) {
  if (!target || !(target instanceof Element)) return false;
  return !!target.closest('input, textarea, select, [contenteditable="true"]');
}

function handleCalculatorKeyboard(event) {
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
  setIcon("calc-backspace-btn", "i-delete");
  setText("calc-mc-btn", t("calcMemoryClear"));
  setText("calc-mr-btn", t("calcMemoryRecall"));
  setText("calc-mplus-btn", t("calcMemoryAdd"));
  setText("calc-mminus-btn", t("calcMemorySubtract"));
  setText(
    "calc-mode-btn",
    calcScientificMode ? t("calcModeScientific") : t("calcModeBasic"),
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
  registerTranslationApplier(applyCalculatorTranslations);
  window.addEventListener("keydown", handleCalculatorKeyboard);
}
