import { beforeEach, describe, expect, it } from "vitest";
import {
  analyzeText,
  findTextInEditor,
  normalizeSpacesAction,
  replaceAllInEditor,
  toUpperCaseText,
} from "../src/features/text-tools.js";

function mountTextDom() {
  document.body.innerHTML = `
    <textarea id="text-input"></textarea>
    <div id="text-analysis"></div>
    <input id="text-find-input" />
    <input id="text-replace-input" />
    <div id="text-find-status"></div>
    <button id="text-copy-btn"></button>
  `;
}

describe("text tools", () => {
  beforeEach(() => {
    mountTextDom();
  });

  it("updates text stats", () => {
    const input = document.getElementById("text-input");
    input.value = "hello world";
    analyzeText();
    expect(document.getElementById("text-analysis")?.textContent).toContain("Words");
  });

  it("applies uppercase and normalize spaces", () => {
    const input = document.getElementById("text-input");
    input.value = "ab   cd";
    normalizeSpacesAction();
    toUpperCaseText();
    expect(input.value).toBe("AB CD");
  });

  it("finds and replaces text", () => {
    const input = document.getElementById("text-input");
    const findInput = document.getElementById("text-find-input");
    const replaceInput = document.getElementById("text-replace-input");
    input.value = "one two two";
    findInput.value = "two";
    findTextInEditor();
    replaceInput.value = "three";
    replaceAllInEditor();
    expect(input.value).toBe("one three three");
  });
});
