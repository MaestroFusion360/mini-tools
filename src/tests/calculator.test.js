import { beforeEach, describe, expect, it } from "vitest";
import {
  calcBackspace,
  calcClear,
  calcClearHistory,
  calcEquals,
  calcFunction,
  calcInput,
  calcMemoryAdd,
  calcMemoryClear,
  calcMemoryRecall,
  calcMemorySubtract,
  calcRemoveHistoryAt,
  calcToggleSign,
  toggleCalcMode,
  initCalculator,
} from "../features/calculator.js";

function mountCalculatorDom() {
  document.body.innerHTML = `
    <div id="calc-display"></div>
    <div id="calc-expression-preview"></div>
    <div id="calc-history"></div>
    <div id="calc-memory-value"></div>
    <button id="calc-mc-btn"></button>
    <button id="calc-mr-btn"></button>
    <button id="calc-mplus-btn"></button>
    <button id="calc-mminus-btn"></button>
    <button id="calc-mode-btn"></button>
    <div class="calc-history-title"></div>
    <div class="calc-buttons"></div>
  `;
}

describe("calculator basics", () => {
  beforeEach(() => {
    mountCalculatorDom();
    initCalculator();
    calcClearHistory();
    calcClear();
  });

  it("evaluates a simple expression", () => {
    calcInput("2");
    calcInput("+");
    calcInput("2");
    calcEquals();
    expect(document.getElementById("calc-display")?.textContent).toBe("4");
  });

  it("writes to history after evaluation", () => {
    calcInput("9");
    calcInput("/");
    calcInput("3");
    calcEquals();
    const history = document.getElementById("calc-history")?.textContent || "";
    expect(history).toContain("9/3 = 3");
  });

  it("shows lowercase x instead of * in display and history", () => {
    calcInput("2");
    calcInput("*");
    calcInput("3");
    expect(
      document.getElementById("calc-expression-preview")?.textContent,
    ).toContain("2x3");
    calcEquals();
    const history = document.getElementById("calc-history")?.textContent || "";
    expect(history).toContain("2x3 = 6");
  });

  it("toggles basic/scientific mode class", () => {
    const buttons = document.querySelector(".calc-buttons");
    expect(buttons?.classList.contains("calc-scientific")).toBe(false);
    toggleCalcMode();
    expect(buttons?.classList.contains("calc-scientific")).toBe(true);
    toggleCalcMode();
    expect(buttons?.classList.contains("calc-scientific")).toBe(false);
  });

  it("supports calculator memory operations", () => {
    calcInput("7");
    calcMemoryAdd();
    calcClear();
    calcInput("2");
    calcMemorySubtract();
    calcMemoryRecall();
    expect(document.getElementById("calc-display")?.textContent).toBe("5");
    calcMemoryClear();
    calcMemoryRecall();
    expect(document.getElementById("calc-display")?.textContent).toBe("0");
  });

  it("handles scientific functions and invalid ranges", () => {
    calcInput("5");
    calcFunction("fact");
    expect(document.getElementById("calc-display")?.textContent).toBe("120");

    calcClear();
    calcInput("171");
    calcFunction("fact");
    expect(document.getElementById("calc-display")?.textContent).toBe("Error");
  });

  it("supports percent and bracketed expressions", () => {
    calcInput("(");
    calcInput("1");
    calcInput("0");
    calcInput("0");
    calcInput("%");
    calcInput("+");
    calcInput("1");
    calcInput(")");
    calcInput("*");
    calcInput("5");
    calcEquals();
    expect(document.getElementById("calc-display")?.textContent).toBe("10");
  });

  it("uses calculator-style percent for addition", () => {
    calcInput("2");
    calcInput("0");
    calcInput("0");
    calcInput("+");
    calcInput("1");
    calcInput("0");
    calcInput("%");
    calcEquals();
    expect(document.getElementById("calc-display")?.textContent).toBe("220");
  });

  it("supports Math constants from scientific keypad", () => {
    calcInput("Math.PI");
    calcInput("+");
    calcInput("Math.E");
    calcEquals();

    const result = Number(document.getElementById("calc-display")?.textContent);
    expect(Number.isFinite(result)).toBe(true);
    expect(Math.abs(result - (Math.PI + Math.E))).toBeLessThan(1e-12);
  });

  it("shows Error on malformed expression", () => {
    calcInput("(");
    calcInput("2");
    calcInput("+");
    calcInput("2");
    calcEquals();
    expect(document.getElementById("calc-display")?.textContent).toBe("Error");
  });

  it("treats unary minus lower than exponentiation for -2**2", () => {
    calcInput("-");
    calcInput("2");
    calcInput("**");
    calcInput("2");
    calcEquals();
    expect(document.getElementById("calc-display")?.textContent).toBe("-4");
  });

  it("allows entering negative exponent: 2**-3", () => {
    calcInput("2");
    calcInput("**");
    calcInput("-");
    calcInput("3");
    calcEquals();
    expect(document.getElementById("calc-display")?.textContent).toBe("0.125");
  });

  it("toggle sign works with percent tail", () => {
    calcInput("5");
    calcInput("0");
    calcInput("%");
    calcToggleSign();
    calcEquals();
    expect(document.getElementById("calc-display")?.textContent).toBe("-0.5");
  });

  it("toggle sign works with grouped tail", () => {
    calcInput("2");
    calcInput("*");
    calcInput("(");
    calcInput("3");
    calcInput("+");
    calcInput("4");
    calcInput(")");
    calcToggleSign();
    calcEquals();
    expect(document.getElementById("calc-display")?.textContent).toBe("-14");
  });

  it("toggle sign applies to the last operand", () => {
    calcInput("2");
    calcInput("+");
    calcInput("3");
    calcToggleSign();
    calcEquals();
    expect(document.getElementById("calc-display")?.textContent).toBe("-1");
  });

  it("backspace falls back to zero for single char", () => {
    calcInput("9");
    calcBackspace();
    expect(document.getElementById("calc-display")?.textContent).toBe("0");
  });

  it("removes a specific history entry", () => {
    calcInput("2");
    calcInput("+");
    calcInput("2");
    calcEquals();

    calcClear();
    calcInput("3");
    calcInput("+");
    calcInput("3");
    calcEquals();

    calcRemoveHistoryAt(0);

    const history = document.getElementById("calc-history")?.textContent || "";
    expect(history).not.toContain("2+2 = 4");
    expect(history).toContain("3+3 = 6");
  });
});
