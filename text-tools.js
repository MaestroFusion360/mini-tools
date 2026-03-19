import { byId, setText } from "./dom.js";
import { registerTranslationApplier, t, getLanguage } from "./i18n.js";

let textCopyFeedbackTimer = null;
let textFindState = {
  query: "",
  sourceText: "",
  indices: [],
  activeIndex: -1,
};

async function readDroppedFileAsText(file) {
  if (!file) return "";
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () =>
      reject(reader.error || new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

function bindTextDragAndDrop() {
  const wrap = byId("text-input")?.closest(".text-input-wrap");
  const input = byId("text-input");
  if (!wrap || !input || wrap.dataset.dndBound === "1") return;
  wrap.dataset.dndBound = "1";

  let dragDepth = 0;
  const setActive = (active) => wrap.classList.toggle("drag-over", active);

  wrap.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dragDepth += 1;
    setActive(true);
  });

  wrap.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    setActive(true);
  });

  wrap.addEventListener("dragleave", (event) => {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) setActive(false);
  });

  wrap.addEventListener("drop", async (event) => {
    event.preventDefault();
    dragDepth = 0;
    setActive(false);

    const dt = event.dataTransfer;
    if (!dt) return;

    const file = dt.files?.[0];
    if (file) {
      try {
        input.value = await readDroppedFileAsText(file);
        analyzeText();
      } catch {}
      return;
    }

    const plain = dt.getData("text/plain");
    if (plain) {
      input.value = plain;
      analyzeText();
    }
  });
}

function getTextWords(text) {
  return text.match(/[A-Za-z\u0400-\u04FF0-9_]+/g) || [];
}

function getTextMetrics(text) {
  const lines = text.split("\n");
  const wordsList = getTextWords(text);
  const words = wordsList.length;
  const wordChars = wordsList.reduce((sum, word) => sum + word.length, 0);
  const avgWordLength = words ? wordChars / words : 0;
  const paragraphList = text.trim()
    ? text
        .split(/\n\s*\n+/)
        .map((block) => block.trim())
        .filter(Boolean)
    : [];

  return {
    lines: lines.length,
    chars: text.length,
    bytes: new Blob([text]).size,
    words,
    spaces: (text.match(/ /g) || []).length,
    maxLine: Math.max(...lines.map((line) => line.length), 0),
    charsNoSpaces: (text.match(/\S/g) || []).length,
    paragraphs: paragraphList.length,
    avgWordLength,
    readMins: words / 200,
  };
}

function formatReadTime(readMins) {
  if (readMins < 1) return getLanguage() === "ru" ? "<1 мин" : "<1 min";
  const totalMins = Math.ceil(readMins);
  if (totalMins < 60)
    return getLanguage() === "ru" ? `${totalMins} мин` : `${totalMins} min`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m
    ? getLanguage() === "ru"
      ? `${h} ч ${m} мин`
      : `${h} h ${m} min`
    : getLanguage() === "ru"
      ? `${h} ч`
      : `${h} h`;
}

function renderTextMetrics(metrics) {
  const kb = (metrics.bytes / 1024).toFixed(2);
  const avg = metrics.avgWordLength.toFixed(2);
  const readTime = formatReadTime(metrics.readMins);
  const ruLines = [
    `Строк: ${metrics.lines} · Абзацев: ${metrics.paragraphs} · Чтение: ${readTime}`,
    `Символов: ${metrics.chars} · Без пробелов: ${metrics.charsNoSpaces} · UTF-8: ${kb} KB`,
    `Слов: ${metrics.words} · Ср. длина слова: ${avg} · Пробелов: ${metrics.spaces} · Макс. строка: ${metrics.maxLine}`,
  ];
  const enLines = [
    `Lines: ${metrics.lines} · Paragraphs: ${metrics.paragraphs} · Read: ${readTime}`,
    `Characters: ${metrics.chars} · No spaces: ${metrics.charsNoSpaces} · UTF-8: ${kb} KB`,
    `Words: ${metrics.words} · Avg word length: ${avg} · Spaces: ${metrics.spaces} · Max line: ${metrics.maxLine}`,
  ];

  const el = byId("text-analysis");
  if (el)
    el.innerHTML = (getLanguage() === "ru" ? ruLines : enLines).join("<br>");
}

export function analyzeText() {
  const input = byId("text-input");
  if (!input) return;
  renderTextMetrics(getTextMetrics(input.value));
}

function resetFindState() {
  textFindState = { query: "", sourceText: "", indices: [], activeIndex: -1 };
}

function findAllIndices(text, needle) {
  if (!needle) return [];
  const indices = [];
  let start = 0;
  while (true) {
    const idx = text.indexOf(needle, start);
    if (idx < 0) break;
    indices.push(idx);
    start = idx + needle.length;
  }
  return indices;
}

function setFindStatus(message = "") {
  const status = byId("text-find-status");
  if (status) status.textContent = message;
}

function formatTemplate(template, params) {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function focusFoundRange(startIndex, length) {
  const input = byId("text-input");
  if (!input) return;
  input.focus();
  input.setSelectionRange(startIndex, startIndex + length);
}

function runFind(query, next = false) {
  const input = byId("text-input");
  if (!input) return;
  const text = input.value;
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    resetFindState();
    setFindStatus("");
    return;
  }

  if (
    textFindState.query !== normalizedQuery ||
    textFindState.sourceText !== text
  ) {
    textFindState = {
      query: normalizedQuery,
      sourceText: text,
      indices: findAllIndices(text, normalizedQuery),
      activeIndex: -1,
    };
  }

  if (!textFindState.indices.length) {
    setFindStatus(t("textNoMatches"));
    return;
  }

  if (next) {
    textFindState.activeIndex =
      (textFindState.activeIndex + 1) % textFindState.indices.length;
  } else if (textFindState.activeIndex < 0) {
    const fromCaret = textFindState.indices.findIndex(
      (idx) => idx >= (input.selectionStart || 0),
    );
    textFindState.activeIndex = fromCaret >= 0 ? fromCaret : 0;
  }

  const currentIndex = textFindState.activeIndex;
  const start = textFindState.indices[currentIndex];
  focusFoundRange(start, normalizedQuery.length);
  setFindStatus(
    formatTemplate(t("textMatchInfo"), {
      current: currentIndex + 1,
      total: textFindState.indices.length,
    }),
  );
}

function applyTextTransform(transformFn) {
  const input = byId("text-input");
  if (!input) return;
  input.value = transformFn(input.value);
  resetFindState();
  setFindStatus("");
  analyzeText();
}

export function toUpperCaseText() {
  applyTextTransform((text) => text.toUpperCase());
}

export function toLowerCaseText() {
  applyTextTransform((text) => text.toLowerCase());
}

export function toTitleCaseText() {
  applyTextTransform((text) =>
    text
      .toLowerCase()
      .replace(
        /(^|[\s([{"'\-])([A-Za-z\u0400-\u04FF])/g,
        (_, p1, p2) => `${p1}${p2.toUpperCase()}`,
      ),
  );
}

export function toSentenceCaseText() {
  applyTextTransform((text) =>
    text
      .toLowerCase()
      .replace(
        /(^\s*[A-Za-z\u0400-\u04FF])|([.!?]\s+[A-Za-z\u0400-\u04FF])/g,
        (match) => match.toUpperCase(),
      ),
  );
}

export function trimTextAction() {
  applyTextTransform((text) => text.trim());
}

export function normalizeSpacesAction() {
  applyTextTransform((text) =>
    text
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " "))
      .join("\n"),
  );
}

export function removeEmptyLinesAction() {
  applyTextTransform((text) =>
    text
      .split("\n")
      .filter((line) => line.trim() !== "")
      .join("\n"),
  );
}

export function findTextInEditor() {
  const query = byId("text-find-input")?.value || "";
  runFind(query, false);
}

export function findNextInEditor() {
  const query = byId("text-find-input")?.value || "";
  runFind(query, true);
}

export function replaceAllInEditor() {
  const input = byId("text-input");
  const findValue = byId("text-find-input")?.value || "";
  const replaceValue = byId("text-replace-input")?.value || "";
  if (!input || !findValue) {
    setFindStatus(t("textNoMatches"));
    return;
  }
  const count = findAllIndices(input.value, findValue).length;
  if (!count) {
    setFindStatus(t("textNoMatches"));
    return;
  }
  input.value = input.value.split(findValue).join(replaceValue);
  resetFindState();
  setFindStatus(formatTemplate(t("textReplacedCount"), { count }));
  analyzeText();
}

export async function copyTextTool() {
  const input = byId("text-input");
  const button = byId("text-copy-btn");
  if (!input || !button) return;

  const defaultLabel = t("textCopy");
  const successLabel = t("textCopied");
  const failLabel = t("textCopyFailed");
  if (textCopyFeedbackTimer) {
    clearTimeout(textCopyFeedbackTimer);
    textCopyFeedbackTimer = null;
  }
  button.classList.remove("copy-ok", "copy-fail");
  button.dataset.copyFeedback = "";

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(input.value);
    } else {
      input.focus();
      input.select();
      const copied = document.execCommand("copy");
      if (!copied) throw new Error("execCommand failed");
      input.setSelectionRange(input.value.length, input.value.length);
    }
    button.title = successLabel;
    button.setAttribute("aria-label", successLabel);
    button.dataset.copyFeedback = successLabel;
    button.classList.add("copy-ok");
  } catch {
    button.title = failLabel;
    button.setAttribute("aria-label", failLabel);
    button.dataset.copyFeedback = failLabel;
    button.classList.add("copy-fail");
  }

  textCopyFeedbackTimer = setTimeout(() => {
    button.title = defaultLabel;
    button.setAttribute("aria-label", defaultLabel);
    button.classList.remove("copy-ok", "copy-fail");
    button.dataset.copyFeedback = "";
    textCopyFeedbackTimer = null;
  }, 950);
}

function applyTextToolTranslations() {
  setText("title-text", t("textAnalysisTitle"));
  const placeholder = byId("text-input");
  if (placeholder) placeholder.placeholder = t("textPlaceholder");

  const textCopyBtn = byId("text-copy-btn");
  if (textCopyBtn) {
    textCopyBtn.title = t("textCopy");
    textCopyBtn.setAttribute("aria-label", t("textCopy"));
  }
  setText("text-upper-btn", t("textUpper"));
  setText("text-lower-btn", t("textLower"));
  setText("text-title-btn", t("textTitle"));
  setText("text-sentence-btn", t("textSentence"));
  setText("text-trim-btn", t("textTrim"));
  setText("text-spaces-btn", t("textSpaces"));
  setText("text-noempty-btn", t("textNoEmpty"));
  setText("text-find-btn", t("textFind"));
  setText("text-find-next-btn", t("textFindNext"));
  setText("text-replace-all-btn", t("textReplaceAll"));

  const findInput = byId("text-find-input");
  if (findInput) findInput.placeholder = t("textFindPlaceholder");
  const replaceInput = byId("text-replace-input");
  if (replaceInput) replaceInput.placeholder = t("textReplacePlaceholder");
  analyzeText();
}

export function initTextTools() {
  const findInput = byId("text-find-input");
  if (findInput && findInput.dataset.bound !== "1") {
    findInput.dataset.bound = "1";
    findInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (event.shiftKey) findNextInEditor();
        else findTextInEditor();
      }
    });
  }

  registerTranslationApplier(applyTextToolTranslations);
  bindTextDragAndDrop();
  analyzeText();
}
