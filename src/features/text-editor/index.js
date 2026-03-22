import { byId, setText } from "../../core/dom.js";
import { registerTranslationApplier, t, getLanguage } from "../../core/i18n.js";
import { textEditorState } from "./state.js";

const TEXT_SAVE_ENCODING_OPTIONS = {
  utf8: { label: "UTF-8" },
  utf8bom: { label: "UTF-8 BOM" },
  cp1251: { label: "ANSI (CP1251)" },
  utf16le: { label: "UTF-16 LE" },
};
const CP1251_EXTRA_CHARS = {
  "\u0402": 0x80,
  "\u0403": 0x81,
  "\u201A": 0x82,
  "\u0453": 0x83,
  "\u201E": 0x84,
  "\u2026": 0x85,
  "\u2020": 0x86,
  "\u2021": 0x87,
  "\u20AC": 0x88,
  "\u2030": 0x89,
  "\u0409": 0x8a,
  "\u2039": 0x8b,
  "\u040A": 0x8c,
  "\u040C": 0x8d,
  "\u040B": 0x8e,
  "\u040F": 0x8f,
  "\u0452": 0x90,
  "\u2018": 0x91,
  "\u2019": 0x92,
  "\u201C": 0x93,
  "\u201D": 0x94,
  "\u2022": 0x95,
  "\u2013": 0x96,
  "\u2014": 0x97,
  "\u2122": 0x99,
  "\u0459": 0x9a,
  "\u203A": 0x9b,
  "\u045A": 0x9c,
  "\u045C": 0x9d,
  "\u045B": 0x9e,
  "\u045F": 0x9f,
  "\u00A0": 0xa0,
  "\u040E": 0xa1,
  "\u045E": 0xa2,
  "\u0408": 0xa3,
  "\u00A4": 0xa4,
  "\u0490": 0xa5,
  "\u00A6": 0xa6,
  "\u00A7": 0xa7,
  "\u0401": 0xa8,
  "\u00A9": 0xa9,
  "\u0404": 0xaa,
  "\u00AB": 0xab,
  "\u00AC": 0xac,
  "\u00AD": 0xad,
  "\u00AE": 0xae,
  "\u0407": 0xaf,
  "\u00B0": 0xb0,
  "\u00B1": 0xb1,
  "\u0406": 0xb2,
  "\u0456": 0xb3,
  "\u0491": 0xb4,
  "\u00B5": 0xb5,
  "\u00B6": 0xb6,
  "\u00B7": 0xb7,
  "\u0451": 0xb8,
  "\u2116": 0xb9,
  "\u0454": 0xba,
  "\u00BB": 0xbb,
  "\u0458": 0xbc,
  "\u0405": 0xbd,
  "\u0455": 0xbe,
  "\u0457": 0xbf,
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

function getSelectedTextSaveEncoding() {
  const selected = byId("text-save-encoding")?.value || "utf8";
  return TEXT_SAVE_ENCODING_OPTIONS[selected] ? selected : "utf8";
}

function getCp1251ByteLength(text) {
  return encodeCp1251Text(text).length;
}

function getUtf16LeByteLength(text) {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    if (typeof code !== "number") continue;
    bytes += code > 0xffff ? 4 : 2;
  }
  return bytes;
}

function getByteLengthForEncoding(text, encoding) {
  switch (encoding) {
    case "utf8bom":
      return new Blob([text]).size + 3;
    case "cp1251":
      return getCp1251ByteLength(text);
    case "utf16le":
      return getUtf16LeByteLength(text);
    case "utf8":
    default:
      return new Blob([text]).size;
  }
}

function encodeCp1251Text(text) {
  const bytes = [];
  for (const char of text) {
    if (Object.prototype.hasOwnProperty.call(CP1251_EXTRA_CHARS, char)) {
      bytes.push(CP1251_EXTRA_CHARS[char]);
      continue;
    }

    const code = char.charCodeAt(0);
    if (typeof code !== "number") continue;
    if (code <= 0x7f) {
      bytes.push(code);
      continue;
    }
    if (code >= 0x410 && code <= 0x42f) {
      bytes.push(0xc0 + (code - 0x410));
      continue;
    }
    if (code >= 0x430 && code <= 0x44f) {
      bytes.push(0xe0 + (code - 0x430));
      continue;
    }
    bytes.push(0x3f);
  }
  return new Uint8Array(bytes);
}

function encodeUtf16LeText(text) {
  const bytes = new Uint8Array(text.length * 2);
  let byteIndex = 0;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    bytes[byteIndex] = code & 0xff;
    bytes[byteIndex + 1] = code >> 8;
    byteIndex += 2;
  }
  return bytes;
}

function getEncodedBytes(text, encoding) {
  const utf8Bytes = new TextEncoder().encode(text);
  switch (encoding) {
    case "utf8bom": {
      const withBom = new Uint8Array(utf8Bytes.length + 3);
      withBom.set([0xef, 0xbb, 0xbf], 0);
      withBom.set(utf8Bytes, 3);
      return withBom;
    }
    case "cp1251":
      return encodeCp1251Text(text);
    case "utf16le":
      return encodeUtf16LeText(text);
    case "utf8":
    default:
      return utf8Bytes;
  }
}

function getTextMetrics(text) {
  const lines = text.split("\n");
  const wordsList = getTextWords(text);
  const words = wordsList.length;
  const wordChars = wordsList.reduce((sum, word) => sum + word.length, 0);
  const avgWordLength = words ? wordChars / words : 0;
  const encoding = getSelectedTextSaveEncoding();
  const paragraphList = text.trim()
    ? text
        .split(/\n\s*\n+/)
        .map((block) => block.trim())
        .filter(Boolean)
    : [];

  return {
    lines: lines.length,
    chars: text.length,
    bytes: getByteLengthForEncoding(text, encoding),
    encodingLabel: TEXT_SAVE_ENCODING_OPTIONS[encoding].label,
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
  if (readMins < 1)
    return getLanguage() === "ru" ? "<1 \u043c\u0438\u043d" : "<1 min";
  const totalMins = Math.ceil(readMins);
  if (totalMins < 60)
    return getLanguage() === "ru"
      ? `${totalMins} \u043c\u0438\u043d`
      : `${totalMins} min`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m
    ? getLanguage() === "ru"
      ? `${h} \u0447 ${m} \u043c\u0438\u043d`
      : `${h} h ${m} min`
    : getLanguage() === "ru"
      ? `${h} \u0447`
      : `${h} h`;
}

function renderTextMetrics(metrics) {
  const kb = (metrics.bytes / 1024).toFixed(2);
  const avg = metrics.avgWordLength.toFixed(2);
  const readTime = formatReadTime(metrics.readMins);
  const ruLines = [
    `\u0421\u0442\u0440\u043e\u043a: ${metrics.lines} | \u0410\u0431\u0437\u0430\u0446\u0435\u0432: ${metrics.paragraphs} | \u0427\u0442\u0435\u043d\u0438\u0435: ${readTime}`,
    `\u0421\u0438\u043c\u0432\u043e\u043b\u043e\u0432: ${metrics.chars} | \u0411\u0435\u0437 \u043f\u0440\u043e\u0431\u0435\u043b\u043e\u0432: ${metrics.charsNoSpaces} | ${metrics.encodingLabel}: ${kb} KB`,
    `\u0421\u043b\u043e\u0432: ${metrics.words} | \u0421\u0440. \u0434\u043b\u0438\u043d\u0430 \u0441\u043b\u043e\u0432\u0430: ${avg} | \u041f\u0440\u043e\u0431\u0435\u043b\u043e\u0432: ${metrics.spaces} | \u041c\u0430\u043a\u0441. \u0441\u0442\u0440\u043e\u043a\u0430: ${metrics.maxLine}`,
  ];
  const enLines = [
    `Lines: ${metrics.lines} | Paragraphs: ${metrics.paragraphs} | Read: ${readTime}`,
    `Characters: ${metrics.chars} | No spaces: ${metrics.charsNoSpaces} | ${metrics.encodingLabel}: ${kb} KB`,
    `Words: ${metrics.words} | Avg word length: ${avg} | Spaces: ${metrics.spaces} | Max line: ${metrics.maxLine}`,
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
  textEditorState.textFindState = {
    query: "",
    sourceText: "",
    optionsKey: "",
    matches: [],
    activeIndex: -1,
  };
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function getFindOptions() {
  return {
    caseSensitive: Boolean(byId("text-find-case")?.checked),
    wholeWord: Boolean(byId("text-find-whole")?.checked),
    wrap: byId("text-find-wrap")?.checked !== false,
  };
}

function getFindOptionsKey(options) {
  return `${options.caseSensitive ? 1 : 0}:${options.wholeWord ? 1 : 0}:${options.wrap ? 1 : 0}`;
}

function findMatchRanges(text, query, options) {
  if (!query) return [];
  if (!options.caseSensitive && !options.wholeWord) {
    const normalizedQuery = query.toLocaleLowerCase();
    return findAllIndices(text.toLocaleLowerCase(), normalizedQuery).map(
      (start) => ({
        start,
        length: query.length,
      }),
    );
  }

  const pattern = options.wholeWord
    ? `(?<![\\p{L}\\p{N}_])${escapeRegExp(query)}(?![\\p{L}\\p{N}_])`
    : escapeRegExp(query);
  const flags = `g${options.caseSensitive ? "" : "i"}u`;
  const regex = new RegExp(pattern, flags);
  const matches = [];
  for (const match of text.matchAll(regex)) {
    const start = match.index;
    if (typeof start !== "number") continue;
    matches.push({ start, length: match[0].length });
  }
  return matches;
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
  const options = getFindOptions();
  const optionsKey = getFindOptionsKey(options);
  if (!normalizedQuery) {
    resetFindState();
    setFindStatus("");
    return;
  }

  const stateChanged =
    textEditorState.textFindState.query !== normalizedQuery ||
    textEditorState.textFindState.sourceText !== text ||
    textEditorState.textFindState.optionsKey !== optionsKey;

  if (stateChanged) {
    textEditorState.textFindState = {
      query: normalizedQuery,
      sourceText: text,
      optionsKey,
      matches: findMatchRanges(text, normalizedQuery, options),
      activeIndex: -1,
    };
  }

  if (!textEditorState.textFindState.matches.length) {
    setFindStatus(t("textNoMatches"));
    return;
  }

  const shouldAdvance =
    next || (!stateChanged && textEditorState.textFindState.activeIndex >= 0);
  if (shouldAdvance) {
    if (
      !options.wrap &&
      textEditorState.textFindState.activeIndex >=
        textEditorState.textFindState.matches.length - 1
    ) {
      setFindStatus(t("textSearchEnd"));
      return;
    }
    textEditorState.textFindState.activeIndex =
      (textEditorState.textFindState.activeIndex + 1) %
      textEditorState.textFindState.matches.length;
  } else if (textEditorState.textFindState.activeIndex < 0) {
    const fromCaret = textEditorState.textFindState.matches.findIndex(
      (match) => match.start >= (input.selectionStart || 0),
    );
    if (fromCaret >= 0) {
      textEditorState.textFindState.activeIndex = fromCaret;
    } else if (options.wrap) {
      textEditorState.textFindState.activeIndex = 0;
    } else {
      setFindStatus(t("textSearchEnd"));
      return;
    }
  }

  const currentIndex = textEditorState.textFindState.activeIndex;
  const currentMatch = textEditorState.textFindState.matches[currentIndex];
  focusFoundRange(currentMatch.start, currentMatch.length);
  setFindStatus(
    formatTemplate(t("textMatchInfo"), {
      current: currentIndex + 1,
      total: textEditorState.textFindState.matches.length,
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

export function replaceInEditor() {
  const input = byId("text-input");
  const findValue = byId("text-find-input")?.value || "";
  const replaceValue = byId("text-replace-input")?.value || "";
  const options = getFindOptions();
  if (!input || !findValue.trim()) {
    setFindStatus(t("textNoMatches"));
    return;
  }

  const matches = findMatchRanges(input.value, findValue.trim(), options);
  if (!matches.length) {
    setFindStatus(t("textNoMatches"));
    return;
  }

  const caret = input.selectionStart || 0;
  const selectedStart = input.selectionStart ?? -1;
  const selectedEnd = input.selectionEnd ?? -1;

  let target = null;
  if (selectedStart >= 0 && selectedEnd > selectedStart) {
    target =
      matches.find(
        (match) =>
          match.start === selectedStart &&
          match.start + match.length === selectedEnd,
      ) || null;
  }

  if (!target) {
    target = matches.find((match) => match.start >= caret) || null;
  }
  if (!target && options.wrap) {
    target = matches[0] || null;
  }
  if (!target) {
    setFindStatus(t("textSearchEnd"));
    return;
  }

  const before = input.value.slice(0, target.start);
  const after = input.value.slice(target.start + target.length);
  input.value = `${before}${replaceValue}${after}`;
  const nextCaret = target.start + replaceValue.length;
  input.focus();
  input.setSelectionRange(nextCaret, nextCaret);

  resetFindState();
  setFindStatus(formatTemplate(t("textReplacedCount"), { count: 1 }));
  analyzeText();
}

export function replaceAllInEditor() {
  const input = byId("text-input");
  const findValue = byId("text-find-input")?.value || "";
  const replaceValue = byId("text-replace-input")?.value || "";
  const options = getFindOptions();
  if (!input || !findValue) {
    setFindStatus(t("textNoMatches"));
    return;
  }
  const matches = findMatchRanges(input.value, findValue.trim(), options);
  const count = matches.length;
  if (!count) {
    setFindStatus(t("textNoMatches"));
    return;
  }
  if (!options.caseSensitive && !options.wholeWord) {
    const normalizedNeedle = findValue.trim().toLocaleLowerCase();
    let cursor = 0;
    let result = "";
    for (const match of matches) {
      const end = match.start + normalizedNeedle.length;
      result += input.value.slice(cursor, match.start) + replaceValue;
      cursor = end;
    }
    result += input.value.slice(cursor);
    input.value = result;
  } else {
    let cursor = 0;
    let result = "";
    for (const match of matches) {
      result += input.value.slice(cursor, match.start) + replaceValue;
      cursor = match.start + match.length;
    }
    result += input.value.slice(cursor);
    input.value = result;
  }
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
  if (textEditorState.textCopyFeedbackTimer) {
    clearTimeout(textEditorState.textCopyFeedbackTimer);
    textEditorState.textCopyFeedbackTimer = null;
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

  textEditorState.textCopyFeedbackTimer = setTimeout(() => {
    button.title = defaultLabel;
    button.setAttribute("aria-label", defaultLabel);
    button.classList.remove("copy-ok", "copy-fail");
    button.dataset.copyFeedback = "";
    textEditorState.textCopyFeedbackTimer = null;
  }, 950);
}

function syncTextInputFullscreenButton() {
  const btn = byId("text-fullscreen-btn");
  const page = byId("page-text");
  if (!btn || !page) return;
  const active = page.classList.contains("text-input-fullscreen");
  btn.classList.toggle("active", active);
  const label = active ? t("textFullscreenExit") : t("textFullscreen");
  btn.title = label;
  btn.setAttribute("aria-label", label);
}

function setTextInputFullscreenUi(active) {
  const page = byId("page-text");
  const input = byId("text-input");
  const wrap = input?.closest(".text-input-wrap");
  if (!page || !input || !wrap) return;
  page.classList.toggle("text-input-fullscreen", active);
  wrap.classList.toggle("text-input-fullscreen", active);
  document.body.classList.toggle("text-immersive-active", active);
}

export async function toggleTextInputFullscreen(force) {
  const page = byId("page-text");
  const input = byId("text-input");
  const wrap = input?.closest(".text-input-wrap");
  if (!page || !input || !wrap) return;
  const current = page.classList.contains("text-input-fullscreen");
  const next = typeof force === "boolean" ? force : !current;
  if (next) {
    let nativeEntered = false;
    if (typeof wrap.requestFullscreen === "function") {
      try {
        await wrap.requestFullscreen();
        nativeEntered =
          document.fullscreenElement === wrap ||
          Boolean(
            document.fullscreenElement &&
            wrap.contains(document.fullscreenElement),
          );
      } catch {}
    }
    textEditorState.textNativeFullscreenActive = nativeEntered;
    setTextInputFullscreenUi(true);
    syncTextInputFullscreenButton();
    input.focus();
    return;
  }

  if (
    document.fullscreenElement &&
    (document.fullscreenElement === wrap ||
      Boolean(wrap.contains(document.fullscreenElement)))
  ) {
    try {
      await document.exitFullscreen();
    } catch {}
  }
  textEditorState.textNativeFullscreenActive = false;
  setTextInputFullscreenUi(false);
  syncTextInputFullscreenButton();
}

export function saveTextToFile() {
  const input = byId("text-input");
  if (!input) return;

  const encoding = getSelectedTextSaveEncoding();
  const bytes = getEncodedBytes(input.value, encoding);
  const mimeByEncoding = {
    utf8: "text/plain;charset=utf-8",
    utf8bom: "text/plain;charset=utf-8",
    cp1251: "text/plain;charset=windows-1251",
    utf16le: "text/plain;charset=utf-16le",
  };
  const blob = new Blob([bytes], {
    type: mimeByEncoding[encoding] || "application/octet-stream",
  });
  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = "editor.txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

function applyTextToolTranslations() {
  setText("title-text", t("textAnalysisTitle"));
  const placeholder = byId("text-input");
  if (placeholder) placeholder.placeholder = t("textPlaceholder");

  const setControlTooltip = (id, label) => {
    const el = byId(id);
    if (!el) return;
    el.title = label;
    el.setAttribute("aria-label", label);
  };

  const textCopyBtn = byId("text-copy-btn");
  if (textCopyBtn) {
    textCopyBtn.title = t("textCopy");
    textCopyBtn.setAttribute("aria-label", t("textCopy"));
  }
  setControlTooltip("text-upper-btn", t("textUpper"));
  setControlTooltip("text-lower-btn", t("textLower"));
  setControlTooltip("text-sentence-btn", t("textSentence"));
  setControlTooltip("text-trim-btn", t("textTrim"));
  setControlTooltip("text-spaces-btn", t("textSpaces"));
  setControlTooltip("text-noempty-btn", t("textNoEmpty"));
  setControlTooltip("text-save-btn", "Save");
  setControlTooltip("text-find-btn", t("textFind"));
  setControlTooltip("text-replace-btn", t("textReplace"));
  setControlTooltip("text-replace-all-btn", t("textReplaceAll"));
  syncTextInputFullscreenButton();
  setControlTooltip("text-tools-summary", "Show or hide editor tools");
  setText("text-find-case-label", t("textFindCaseSensitive"));
  setText("text-find-whole-label", t("textFindWholeWord"));
  setText("text-find-wrap-label", t("textFindWrap"));
  setText("text-tools-summary-label", "Editor tools");

  const encodingSelect = byId("text-save-encoding");
  if (encodingSelect) {
    encodingSelect.title = "Save encoding";
    encodingSelect.setAttribute("aria-label", "Save encoding");
    const options = Array.from(encodingSelect.options);
    for (const option of options) {
      if (option.value === "utf8") option.textContent = "UTF-8 (default)";
      if (option.value === "utf8bom") option.textContent = "UTF-8 BOM";
      if (option.value === "cp1251") option.textContent = "ANSI (CP1251)";
      if (option.value === "utf16le") option.textContent = "UTF-16 LE";
    }
    if (!TEXT_SAVE_ENCODING_OPTIONS[encodingSelect.value]) {
      encodingSelect.value = "utf8";
    }
  }

  const findInput = byId("text-find-input");
  if (findInput) {
    findInput.placeholder = t("textFindPlaceholder");
    findInput.title = t("textFindPlaceholder");
    findInput.setAttribute("aria-label", t("textFindPlaceholder"));
  }
  const replaceInput = byId("text-replace-input");
  if (replaceInput) {
    replaceInput.placeholder = t("textReplacePlaceholder");
    replaceInput.title = t("textReplacePlaceholder");
    replaceInput.setAttribute("aria-label", t("textReplacePlaceholder"));
  }
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

  const encodingSelect = byId("text-save-encoding");
  if (encodingSelect && encodingSelect.dataset.bound !== "1") {
    encodingSelect.dataset.bound = "1";
    encodingSelect.addEventListener("change", () => {
      analyzeText();
    });
  }

  if (document.body.dataset.textFullscreenBound !== "1") {
    document.body.dataset.textFullscreenBound = "1";
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const page = byId("page-text");
      if (!page || !page.classList.contains("text-input-fullscreen")) return;
      event.preventDefault();
      toggleTextInputFullscreen(false);
    });
    document.addEventListener("fullscreenchange", () => {
      const input = byId("text-input");
      const wrap = input?.closest(".text-input-wrap");
      if (!wrap) return;
      const nativeActive =
        document.fullscreenElement === wrap ||
        Boolean(
          document.fullscreenElement &&
          wrap.contains(document.fullscreenElement),
        );
      if (nativeActive) {
        textEditorState.textNativeFullscreenActive = true;
        setTextInputFullscreenUi(true);
      } else if (textEditorState.textNativeFullscreenActive) {
        textEditorState.textNativeFullscreenActive = false;
        setTextInputFullscreenUi(false);
      }
      syncTextInputFullscreenButton();
    });
  }

  registerTranslationApplier(applyTextToolTranslations);
  bindTextDragAndDrop();
  analyzeText();
}
