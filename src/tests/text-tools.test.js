import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  analyzeText,
  copyTextTool,
  findTextInEditor,
  findNextInEditor,
  normalizeSpacesAction,
  removeEmptyLinesAction,
  replaceAllInEditor,
  toSentenceCaseText,
  toTitleCaseText,
  trimTextAction,
  toUpperCaseText,
} from "../features/text-tools.js";

function mountTextDom() {
  document.body.innerHTML = `
    <textarea id="text-input"></textarea>
    <div id="text-analysis"></div>
    <input id="text-find-input" />
    <input id="text-replace-input" />
    <input id="text-find-case" type="checkbox" />
    <input id="text-find-whole" type="checkbox" />
    <input id="text-find-wrap" type="checkbox" checked />
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
    expect(document.getElementById("text-analysis")?.textContent).toContain(
      "Words",
    );
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

  it("supports title/sentence transforms and removing empty lines", () => {
    const input = document.getElementById("text-input");
    input.value = "hello world.\n\nnext line here";

    toTitleCaseText();
    expect(input.value).toContain("Hello World.");

    toSentenceCaseText();
    expect(input.value).toContain("Hello world.");

    removeEmptyLinesAction();
    expect(input.value.includes("\n\n")).toBe(false);
  });

  it("respects whole-word and no-wrap search mode", () => {
    const input = document.getElementById("text-input");
    const findInput = document.getElementById("text-find-input");
    const whole = document.getElementById("text-find-whole");
    const wrap = document.getElementById("text-find-wrap");
    const status = document.getElementById("text-find-status");

    input.value = "one stone one";
    findInput.value = "one";
    whole.checked = true;
    wrap.checked = false;

    findTextInEditor();
    findNextInEditor();
    findNextInEditor();
    findNextInEditor();
    expect(status?.textContent).toBe("textSearchEnd");
  });

  it("returns no-matches status for missing replace query", () => {
    const input = document.getElementById("text-input");
    const findInput = document.getElementById("text-find-input");
    const status = document.getElementById("text-find-status");
    input.value = "abc";
    findInput.value = "zzz";
    replaceAllInEditor();
    expect(status?.textContent).toBe("textNoMatches");
  });

  it("trims text and supports clipboard copy feedback", async () => {
    vi.useFakeTimers();
    const input = document.getElementById("text-input");
    const copyBtn = document.getElementById("text-copy-btn");
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...window.navigator,
      clipboard: { writeText },
    });

    input.value = "  padded text  ";
    trimTextAction();
    expect(input.value).toBe("padded text");

    await copyTextTool();
    expect(writeText).toHaveBeenCalledWith("padded text");
    expect(copyBtn.dataset.copyFeedback).toBe("textCopied");

    vi.advanceTimersByTime(1000);
    expect(copyBtn.dataset.copyFeedback).toBe("");
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});

