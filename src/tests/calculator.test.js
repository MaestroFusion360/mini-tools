import { beforeEach, describe, expect, it } from "vitest";
import {
  calcBackspace,
  calcClear,
  calcEquals,
  calcFunction,
  calcInput,
  calcMemoryAdd,
  calcMemoryClear,
  calcMemoryRecall,
  calcMemorySubtract,
  toggleCalcMode,
  initCalculator,
} from "../features/calculator.js";

function mountCalculatorDom() {
  document.body.innerHTML = `
    <div id="calc-display"></div>
    <div id="calc-expression-preview"></div>
    <div id="calc-history"></div>
    <div id="calc-memory-value"></div>
    <button id="calc-backspace-btn"></button>
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
    expect(document.getElementById("calc-display")?.textContent).toBe("0");
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

  it("resets result on malformed expression", () => {
    calcInput("(");
    calcInput("2");
    calcInput("+");
    calcInput("2");
    calcEquals();
    expect(document.getElementById("calc-display")?.textContent).toBe("0");
  });

  it("backspace falls back to zero for single char", () => {
    calcInput("9");
    calcBackspace();
    expect(document.getElementById("calc-display")?.textContent).toBe("0");
  });
});

