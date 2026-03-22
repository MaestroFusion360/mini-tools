import { byId, setText } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";

const calcState = FEATURE_RUNTIME_STATE.calculator;
const MAX_HISTORY_ITEMS = 200;

const OPERATORS = {
  "+": { precedence: 1, associativity: "L" },
  "-": { precedence: 1, associativity: "L" },
  "*": { precedence: 2, associativity: "L" },
  "/": { precedence: 2, associativity: "L" },
  "**": { precedence: 4, associativity: "R" },
  "u-": { precedence: 4, associativity: "R" },
  "%": { precedence: 5, associativity: "L" },
};

function ensureCalculatorState() {
  if (!Array.isArray(calcState.calcHistory)) calcState.calcHistory = [];
  if (typeof calcState.calcVal !== "string") calcState.calcVal = "0";
  if (typeof calcState.calcHasError !== "boolean")
    calcState.calcHasError = false;
  if (typeof calcState.calcInitialized !== "boolean")
    calcState.calcInitialized = false;
  if (
    typeof calcState.calcMemoryValue !== "number" ||
    !Number.isFinite(calcState.calcMemoryValue)
  ) {
    calcState.calcMemoryValue = 0;
  }
  if (typeof calcState.calcScientificMode !== "boolean") {
    calcState.calcScientificMode = false;
  }
}

function getCalcErrorLabel() {
  const label = t("calcError");
  return label && label !== "calcError" ? label : "Error";
}

function isErrorState() {
  return Boolean(calcState.calcHasError);
}

function setCalcError() {
  calcState.calcHasError = true;
}

function clearCalcError() {
  calcState.calcHasError = false;
}

function getExpression() {
  return String(calcState.calcVal || "0");
}

function setExpression(next) {
  calcState.calcVal = String(next || "0");
}

function resetErrorToZero() {
  if (!isErrorState()) return;
  clearCalcError();
  setExpression("0");
}

function formatCalcTextForDisplay(text) {
  return String(text).replaceAll("**", "^").replaceAll("*", "x");
}

function renderCalcDisplay() {
  const display = byId("calc-display");
  const preview = byId("calc-expression-preview");
  const expressionText = formatCalcTextForDisplay(getExpression());
  const displayText = isErrorState() ? getCalcErrorLabel() : expressionText;
  if (display) display.textContent = displayText;
  if (preview)
    preview.textContent = `${t("calcExpression")}: ${expressionText}`;
}

function normalizeHistoryEntry(entry) {
  if (entry && typeof entry === "object") {
    const expression = String(entry.expression ?? "");
    const result = String(entry.result ?? "");
    if (expression || result) return { expression, result };
  }
  if (typeof entry === "string") {
    const separator = " = ";
    const at = entry.lastIndexOf(separator);
    if (at >= 0) {
      return {
        expression: entry.slice(0, at),
        result: entry.slice(at + separator.length),
      };
    }
    return { expression: entry, result: "" };
  }
  return { expression: "", result: "" };
}

function createHistoryRemoveButton(actualIndex) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "calc-history-remove-btn";
  const removeText = t("removeHistoryItem");
  button.setAttribute("aria-label", removeText);
  button.title = removeText;
  button.innerHTML =
    '<svg class="icon-svg btn-icon"><use href="#i-x"></use></svg>';
  button.addEventListener("click", () => {
    calcRemoveHistoryAt(actualIndex);
  });
  return button;
}

function renderCalcHistory() {
  const historyEl = byId("calc-history");
  if (!historyEl) return;
  if (!calcState.calcHistory.length) {
    historyEl.textContent = t("calcEmptyHistory");
    return;
  }

  historyEl.textContent = "";
  const recentItems = calcState.calcHistory.slice(-10).reverse();
  recentItems.forEach((entry, visibleIndex) => {
    const actualIndex = calcState.calcHistory.length - 1 - visibleIndex;
    const row = document.createElement("div");
    row.className = "calc-history-item";

    const normalized = normalizeHistoryEntry(entry);
    const expressionText = formatCalcTextForDisplay(normalized.expression);
    const resultText = formatCalcTextForDisplay(normalized.result);
    const displayText = normalized.result
      ? `${expressionText} = ${resultText}`
      : expressionText;

    const text = document.createElement("span");
    text.className = "calc-history-entry";
    text.textContent = displayText;

    row.append(text, createHistoryRemoveButton(actualIndex));
    historyEl.append(row);
  });
}

function renderCalcMemory() {
  const memoryEl = byId("calc-memory-value");
  if (!memoryEl) return;
  const valueText = Number.isFinite(calcState.calcMemoryValue)
    ? calcState.calcMemoryValue.toString()
    : "0";
  memoryEl.textContent = `${t("calcMemoryValue")}: ${valueText}`;
}

function pushHistoryEntry(expression, result) {
  calcState.calcHistory.push({
    expression: String(expression),
    result: String(result),
  });
  if (calcState.calcHistory.length > MAX_HISTORY_ITEMS) {
    calcState.calcHistory.splice(
      0,
      calcState.calcHistory.length - MAX_HISTORY_ITEMS,
    );
  }
}

function isOperatorToken(token) {
  return (
    Object.prototype.hasOwnProperty.call(OPERATORS, token) && token !== "u-"
  );
}

function canAppendToken(current, token) {
  const cur = String(current || "");
  if (!token) return false;

  if (token === ".") {
    const lastNumberChunk = cur.match(/(?:^|[^\d.])(\d*\.?\d*)$/)?.[1] || "";
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
    if (token === "-") return true;
    return !/[+\-*/(]$/.test(cur) && !cur.endsWith("**");
  }

  return true;
}

function toggleSignForExpression(expr) {
  const normalized = String(expr || "").trim();
  if (!normalized || normalized === "0") return "0";
  let tokens;
  try {
    tokens = tokenizeExpression(normalized);
  } catch {
    return normalized;
  }
  if (!tokens.length) return normalized;

  let endIndex = tokens.length - 1;
  while (
    endIndex >= 0 &&
    tokens[endIndex].type === "operator" &&
    tokens[endIndex].value === "%"
  ) {
    endIndex -= 1;
  }
  if (endIndex < 0) return normalized;

  let startIndex = endIndex;
  if (tokens[endIndex].type === "paren" && tokens[endIndex].value === ")") {
    let depth = 0;
    for (let i = endIndex; i >= 0; i -= 1) {
      const token = tokens[i];
      if (token.type === "paren" && token.value === ")") depth += 1;
      if (token.type === "paren" && token.value === "(") {
        depth -= 1;
        if (depth === 0) {
          startIndex = i;
          break;
        }
      }
    }
    if (depth !== 0) return normalized;
  } else if (tokens[endIndex].type !== "number") {
    return normalized;
  }

  const suffixEnd = tokens[tokens.length - 1].end;
  const coreStart = tokens[startIndex].start;
  const coreEnd = tokens[endIndex].end;
  const suffixText = normalized.slice(coreEnd, suffixEnd);
  const coreText = normalized.slice(coreStart, coreEnd);

  const unaryMinusIndex = startIndex - 1;
  if (isUnaryMinusToken(tokens, unaryMinusIndex)) {
    const minus = tokens[unaryMinusIndex];
    return (
      normalized.slice(0, minus.start) +
      normalized.slice(coreStart, suffixEnd) +
      normalized.slice(suffixEnd)
    );
  }

  const wrapped = unwrapWrappedNegativeCore(coreText);
  if (wrapped !== null) {
    return (
      normalized.slice(0, coreStart) +
      wrapped +
      suffixText +
      normalized.slice(suffixEnd)
    );
  }

  return (
    normalized.slice(0, coreStart) +
    `(-${coreText})` +
    suffixText +
    normalized.slice(suffixEnd)
  );
}

function tokenizeExpression(rawExpression) {
  const expression = String(rawExpression || "").replace(/\s+/g, "");
  if (!expression) throw new Error("Empty expression");

  const tokens = [];
  let i = 0;
  while (i < expression.length) {
    const rest = expression.slice(i);

    if (rest.startsWith("Math.PI")) {
      tokens.push({
        type: "number",
        value: Math.PI,
        start: i,
        end: i + "Math.PI".length,
      });
      i += "Math.PI".length;
      continue;
    }
    if (rest.startsWith("Math.E")) {
      tokens.push({
        type: "number",
        value: Math.E,
        start: i,
        end: i + "Math.E".length,
      });
      i += "Math.E".length;
      continue;
    }
    if (rest.startsWith("**")) {
      tokens.push({ type: "operator", value: "**", start: i, end: i + 2 });
      i += 2;
      continue;
    }

    const ch = expression[i];
    if (/\d|\./.test(ch)) {
      let end = i + 1;
      let dotCount = ch === "." ? 1 : 0;
      while (end < expression.length) {
        const next = expression[end];
        if (next === ".") {
          dotCount += 1;
          if (dotCount > 1) throw new Error("Invalid number");
          end += 1;
          continue;
        }
        if (/\d/.test(next)) {
          end += 1;
          continue;
        }
        break;
      }
      const numberText = expression.slice(i, end);
      if (numberText === ".") throw new Error("Invalid number");
      const parsed = Number(numberText);
      if (!Number.isFinite(parsed)) throw new Error("Invalid number");
      tokens.push({ type: "number", value: parsed, start: i, end });
      i = end;
      continue;
    }

    if ("+-*/()%".includes(ch)) {
      if (ch === "(" || ch === ")") {
        tokens.push({ type: "paren", value: ch, start: i, end: i + 1 });
      } else {
        tokens.push({ type: "operator", value: ch, start: i, end: i + 1 });
      }
      i += 1;
      continue;
    }

    throw new Error("Unsupported token");
  }
  return tokens;
}

function toRpn(tokens) {
  const output = [];
  const operators = [];
  let previousType = "start";

  for (const token of tokens) {
    if (token.type === "number") {
      output.push(token);
      previousType = "number";
      continue;
    }

    if (token.type === "paren") {
      if (token.value === "(") {
        operators.push(token);
        previousType = "leftParen";
      } else {
        let foundLeftParen = false;
        while (operators.length > 0) {
          const top = operators.pop();
          if (top.type === "paren" && top.value === "(") {
            foundLeftParen = true;
            break;
          }
          output.push(top);
        }
        if (!foundLeftParen) throw new Error("Unbalanced brackets");
        previousType = "rightParen";
      }
      continue;
    }

    let op = token.value;
    if (
      op === "-" &&
      ["start", "operator", "leftParen"].includes(previousType)
    ) {
      op = "u-";
    }
    if (op === "%" && !["number", "rightParen"].includes(previousType)) {
      throw new Error("Invalid percent placement");
    }

    const current = { type: "operator", value: op };
    const currentMeta = OPERATORS[op];
    if (!currentMeta) throw new Error("Unknown operator");

    while (operators.length > 0) {
      const top = operators[operators.length - 1];
      if (!(top.type === "operator")) break;
      const topMeta = OPERATORS[top.value];
      if (!topMeta) break;
      const shouldPop =
        (currentMeta.associativity === "L" &&
          currentMeta.precedence <= topMeta.precedence) ||
        (currentMeta.associativity === "R" &&
          currentMeta.precedence < topMeta.precedence);
      if (!shouldPop) break;
      output.push(operators.pop());
    }

    operators.push(current);
    previousType = "operator";
  }

  while (operators.length > 0) {
    const top = operators.pop();
    if (top.type === "paren") throw new Error("Unbalanced brackets");
    output.push(top);
  }
  return output;
}

function evaluateRpn(rpn) {
  const stack = [];
  const popNumber = () => {
    if (!stack.length) throw new Error("Invalid expression");
    return stack.pop();
  };

  for (const token of rpn) {
    if (token.type === "number") {
      stack.push({ value: token.value, percentTag: false });
      continue;
    }

    const op = token.value;
    if (op === "u-") {
      const a = popNumber();
      stack.push({ value: -a.value, percentTag: false });
      continue;
    }
    if (op === "%") {
      const a = popNumber();
      stack.push({ value: a.value / 100, percentTag: true });
      continue;
    }

    const right = popNumber();
    const left = popNumber();
    // Calculator-style percent behavior:
    // for +/-, X% means "X percent of left operand" (e.g. 200 + 10% = 220).
    // for */ and others, percent keeps standard fraction meaning (10% = 0.1).
    const rightValue =
      (op === "+" || op === "-") && right.percentTag
        ? left.value * right.value
        : right.value;

    let result;
    if (op === "+") result = left.value + rightValue;
    else if (op === "-") result = left.value - rightValue;
    else if (op === "*") result = left.value * rightValue;
    else if (op === "/") result = left.value / rightValue;
    else if (op === "**") result = left.value ** rightValue;
    else throw new Error("Unknown operator");

    if (!Number.isFinite(result)) throw new Error("Non-finite result");
    stack.push({ value: result, percentTag: false });
  }

  if (stack.length !== 1) throw new Error("Invalid expression");
  return stack[0].value;
}

function evaluateExpression(rawExpression) {
  const tokens = tokenizeExpression(rawExpression);
  const rpn = toRpn(tokens);
  return evaluateRpn(rpn);
}

function isUnaryMinusToken(tokens, index) {
  if (!Number.isInteger(index) || index < 0 || index >= tokens.length)
    return false;
  const token = tokens[index];
  if (!token || token.type !== "operator" || token.value !== "-") return false;
  if (index === 0) return true;
  const prev = tokens[index - 1];
  if (!prev) return true;
  if (prev.type === "paren" && prev.value === "(") return true;
  if (prev.type === "operator" && prev.value !== "%") return true;
  return false;
}

function unwrapWrappedNegativeCore(coreText) {
  if (!coreText.startsWith("(-") || !coreText.endsWith(")")) return null;
  const inner = coreText.slice(2, -1);
  if (!inner) return null;
  return inner;
}

function evaluateCurrentExpressionOrNull() {
  if (isErrorState()) return null;
  try {
    return evaluateExpression(getExpression());
  } catch {
    return null;
  }
}

function isCalculatorPageActive() {
  const page = byId("page-calc");
  if (!page) return true;
  return page.classList.contains("active");
}

export function toggleCalcMode(toggle = true) {
  if (toggle) calcState.calcScientificMode = !calcState.calcScientificMode;

  const modeButton = byId("calc-mode-btn");
  if (modeButton) {
    modeButton.textContent = calcState.calcScientificMode
      ? t("calcModeScientific")
      : t("calcModeBasic");
  }

  const buttonsWrap = document.querySelector(".calc-buttons");
  if (buttonsWrap) {
    buttonsWrap.classList.toggle(
      "calc-scientific",
      calcState.calcScientificMode,
    );
  }
}

export function calcInput(ch) {
  resetErrorToZero();
  const token = String(ch || "");
  if (!token) return;

  const current = getExpression();
  if (current === "0") {
    if (["+", "*", "/", "%", "**", ")"].includes(token)) return;
    if (token === ".") setExpression("0.");
    else setExpression(token);
    renderCalcDisplay();
    return;
  }

  if (!canAppendToken(current, token)) return;
  setExpression(current + token);
  renderCalcDisplay();
}

export function calcBackspace() {
  if (isErrorState()) {
    clearCalcError();
    setExpression("0");
  } else {
    const current = getExpression();
    if (current.endsWith("**")) {
      const next = current.slice(0, -2);
      setExpression(next || "0");
    } else {
      setExpression(current.length > 1 ? current.slice(0, -1) : "0");
    }
  }
  renderCalcDisplay();
}

export function calcClear() {
  clearCalcError();
  setExpression("0");
  renderCalcDisplay();
}

export function calcToggleSign() {
  resetErrorToZero();
  setExpression(toggleSignForExpression(getExpression()));
  renderCalcDisplay();
}

export function calcMemoryClear() {
  calcState.calcMemoryValue = 0;
  renderCalcMemory();
}

export function calcMemoryRecall() {
  clearCalcError();
  setExpression(
    Number.isFinite(calcState.calcMemoryValue)
      ? calcState.calcMemoryValue.toString()
      : "0",
  );
  renderCalcDisplay();
}

export function calcMemoryAdd() {
  const current = evaluateCurrentExpressionOrNull();
  if (current === null) return;
  calcState.calcMemoryValue += current;
  renderCalcMemory();
}

export function calcMemorySubtract() {
  const current = evaluateCurrentExpressionOrNull();
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
  let result = 1;
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
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
    const sourceExpression = getExpression();
    const current = evaluateCurrentExpressionOrNull();
    if (current === null) throw new Error("Invalid expression");
    const handler = calcFunctionHandlers[fn];
    if (!handler) throw new Error("Unknown function");

    const result = handler(current);
    const resultText = formatResultNumber(result);
    const expressionLabel = `${fn}(${sourceExpression})`;
    clearCalcError();
    setExpression(resultText);
    pushHistoryEntry(expressionLabel, resultText);
    renderCalcHistory();
  } catch {
    setCalcError();
  }
  renderCalcDisplay();
}

function computeEqualsResult() {
  const result = evaluateExpression(getExpression());
  return formatResultNumber(result);
}

function formatResultNumber(value) {
  if (!Number.isFinite(value)) throw new Error("Non-finite result");
  return Number.parseFloat(value.toFixed(12)).toString();
}

export function calcEquals(returnOnly = false) {
  try {
    const beforeExpression = getExpression();
    const resultText = computeEqualsResult();
    if (returnOnly) return resultText;

    clearCalcError();
    pushHistoryEntry(beforeExpression, resultText);
    setExpression(resultText);
    renderCalcHistory();
    renderCalcDisplay();
    return resultText;
  } catch {
    if (returnOnly) return null;
    setCalcError();
    renderCalcDisplay();
    return null;
  }
}

function shouldIgnoreCalculatorHotkeys(target) {
  if (!target || !(target instanceof Element)) return false;
  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]'),
  );
}

const KEY_ACTIONS = {
  ".": () => calcInput("."),
  "+": () => calcInput("+"),
  "-": () => calcInput("-"),
  "*": () => calcInput("*"),
  "/": () => calcInput("/"),
  "%": () => calcInput("%"),
  "(": () => calcInput("("),
  ")": () => calcInput(")"),
  "^": () => calcInput("**"),
  Enter: () => calcEquals(),
  "=": () => calcEquals(),
  Backspace: () => calcBackspace(),
  Delete: () => calcClear(),
  Escape: () => calcClear(),
};

function handleCalculatorKeyboard(event) {
  if (!isCalculatorPageActive()) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (shouldIgnoreCalculatorHotkeys(event.target)) return;

  const key = event.key;
  let handled = false;

  if (/^[0-9]$/.test(key)) {
    calcInput(key);
    handled = true;
  } else if (Object.prototype.hasOwnProperty.call(KEY_ACTIONS, key)) {
    KEY_ACTIONS[key]();
    handled = true;
  }

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
  ensureCalculatorState();
  renderCalcDisplay();
  renderCalcHistory();
  renderCalcMemory();

  if (!calcState.calcInitialized) {
    registerTranslationApplier(applyCalculatorTranslations);
    window.addEventListener("keydown", handleCalculatorKeyboard);
    calcState.calcInitialized = true;
  }
}
