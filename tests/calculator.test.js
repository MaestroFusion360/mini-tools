import { beforeEach, describe, expect, it } from "vitest";
import {
  calcClear,
  calcEquals,
  calcInput,
  initCalculator,
} from "../src/features/calculator.js";

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
});
