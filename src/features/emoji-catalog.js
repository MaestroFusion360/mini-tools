import { byId, showAppToast } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";

const emojiState = {
  initialized: false,
  loadingPromise: null,
  loaded: false,
  copyBound: false,
  filterTimer: null,
  query: "",
  category: "smileys",
  items: [],
  renderFrameId: null,
  renderToken: 0,
};

const EMOJI_DATA_URL = "./src/data/emoji-catalog.json";
const TWEMOJI_BASE_URL =
  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg";
const EMOJI_FILTER_DEBOUNCE_MS = 120;
const EMOJI_RENDER_BATCH_SIZE = 120;
const EMOJI_CATEGORIES = new Set([
  "smileys",
  "people",
  "animals",
  "food",
  "travel",
  "activity",
  "objects",
  "symbols",
  "flags",
]);

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const temp = document.createElement("textarea");
  temp.value = text;
  temp.setAttribute("readonly", "true");
  temp.className = "visually-hidden";
  document.body.append(temp);
  temp.select();
  const ok = document.execCommand("copy");
  temp.remove();
  if (!ok) return Promise.reject(new Error("Copy command failed"));
  return Promise.resolve();
}

function normalizeEmojiCategory(value) {
  const category = String(value || "").trim();
  return EMOJI_CATEGORIES.has(category) ? category : "objects";
}

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}

function setEmojiGridMessage(message) {
  const grid = byId("emoji-grid");
  if (!grid) return;
  const text = document.createElement("div");
  text.className = "small-text";
  text.textContent = message;
  grid.replaceChildren(text);
}

function scheduleEmojiGridRender() {
  if (emojiState.filterTimer !== null) {
    clearTimeout(emojiState.filterTimer);
  }
  emojiState.filterTimer = window.setTimeout(() => {
    emojiState.filterTimer = null;
    renderEmojiGrid();
  }, EMOJI_FILTER_DEBOUNCE_MS);
}

function clearEmojiRenderFrame() {
  if (emojiState.renderFrameId !== null) {
    if (typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(emojiState.renderFrameId);
    } else {
      clearTimeout(emojiState.renderFrameId);
    }
    emojiState.renderFrameId = null;
  }
}

function toTwemojiCodepoint(emojiChar) {
  return Array.from(String(emojiChar || ""))
    .map((symbol) => symbol.codePointAt(0).toString(16))
    .filter((hex) => hex !== "fe0f")
    .join("-");
}

function toTwemojiUrl(emojiChar) {
  const codepoint = toTwemojiCodepoint(emojiChar);
  return codepoint ? `${TWEMOJI_BASE_URL}/${codepoint}.svg` : "";
}

function getFilteredEmoji() {
  const query = normalizeSearchValue(emojiState.query.trim());
  return emojiState.items.filter((item) => {
    if (
      emojiState.category !== "all" &&
      item.category !== emojiState.category
    ) {
      return false;
    }
    if (!query) return true;
    const haystack = `${item.name} ${item.category} ${(item.tags || []).join(" ")} ${item.emoji}`;
    const normalizedHaystack = normalizeSearchValue(haystack);
    return normalizedHaystack.includes(query);
  });
}

function renderEmojiStatusMessage(message, force = false) {
  const status = byId("emoji-status");
  if (!status) return;
  if (!force && !emojiState.loaded && emojiState.items.length === 0) return;
  status.textContent = message;
}

function renderEmojiStatus(count) {
  const message =
    count > 0
      ? t("emojiStatusFound").replace("{count}", String(count))
      : t("emojiStatusEmpty");
  renderEmojiStatusMessage(message, true);
}

function syncEmojiSearchClearButton() {
  const clearBtn = byId("emoji-search-clear-btn");
  if (!clearBtn) return;
  const hasQuery = Boolean(String(emojiState.query || "").trim());
  clearBtn.classList.toggle("is-hidden", !hasQuery);
}

function renderEmojiGrid() {
  const grid = byId("emoji-grid");
  if (!grid) return;
  clearEmojiRenderFrame();
  emojiState.renderToken += 1;
  const token = emojiState.renderToken;

  if (!emojiState.loaded && !emojiState.items.length) {
    setEmojiGridMessage(t("emojiLoading"));
    renderEmojiStatusMessage(t("emojiLoading"), true);
    return;
  }

  const items = getFilteredEmoji();
  renderEmojiStatus(items.length);
  if (!items.length) {
    setEmojiGridMessage(t("emojiStatusEmpty"));
    return;
  }

  const createEmojiButton = (item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "emoji-item";
    button.title = `${item.name} (${t("emojiCopyHint")})`;
    button.setAttribute("aria-label", `${item.name}. ${t("emojiCopyHint")}`);

    const iconWrap = document.createElement("span");
    iconWrap.className = "emoji-char";

    const iconImg = document.createElement("img");
    iconImg.className = "emoji-char-img";
    const twemojiUrl = toTwemojiUrl(item.emoji);
    if (twemojiUrl) iconImg.src = twemojiUrl;
    iconImg.alt = item.emoji;
    iconImg.loading = "lazy";
    iconImg.decoding = "async";

    const fallback = document.createElement("span");
    fallback.className = "emoji-char-fallback is-hidden";
    fallback.textContent = item.emoji;

    iconImg.addEventListener("error", () => {
      iconImg.classList.add("is-hidden");
      fallback.classList.remove("is-hidden");
    });
    if (!twemojiUrl) {
      iconImg.classList.add("is-hidden");
      fallback.classList.remove("is-hidden");
    }

    const name = document.createElement("span");
    name.className = "emoji-name";
    name.textContent = item.name;

    iconWrap.append(iconImg, fallback);
    button.append(iconWrap, name);
    button.dataset.emoji = item.emoji;
    return button;
  };

  grid.replaceChildren();
  let index = 0;

  const appendBatch = () => {
    if (token !== emojiState.renderToken) return;
    const fragment = document.createDocumentFragment();
    const end = Math.min(index + EMOJI_RENDER_BATCH_SIZE, items.length);
    while (index < end) {
      fragment.append(createEmojiButton(items[index]));
      index += 1;
    }
    grid.append(fragment);
    if (index < items.length) {
      if (typeof window.requestAnimationFrame === "function") {
        emojiState.renderFrameId = window.requestAnimationFrame(appendBatch);
      } else {
        emojiState.renderFrameId = window.setTimeout(appendBatch, 16);
      }
      return;
    }
    emojiState.renderFrameId = null;
  };

  appendBatch();
}

function bindEmojiGridCopyHandler() {
  const grid = byId("emoji-grid");
  if (!grid || emojiState.copyBound) return;

  grid.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest(".emoji-item");
    if (!(button instanceof HTMLElement)) return;
    const emojiValue = String(button.dataset.emoji || "").trim();
    if (!emojiValue) return;
    copyText(emojiValue)
      .then(() => {
        showAppToast(t("emojiCopied"));
      })
      .catch(() => {
        showAppToast(t("emojiCopyFailed"));
      });
  });

  emojiState.copyBound = true;
}

async function ensureEmojiCatalogLoaded() {
  if (emojiState.loaded) return;
  if (emojiState.loadingPromise) return emojiState.loadingPromise;

  emojiState.loadingPromise = fetch(EMOJI_DATA_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load emoji catalog: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data))
        throw new Error("Emoji catalog must be an array");
      emojiState.items = data
        .map((item) => ({
          emoji: String(item?.emoji || ""),
          name: String(item?.name || "").trim(),
          category: normalizeEmojiCategory(item?.category),
          tags: Array.isArray(item?.tags)
            ? item.tags.map((tag) => String(tag))
            : [],
        }))
        .filter((item) => item.emoji && item.name);
      emojiState.loaded = true;
    })
    .catch((error) => {
      console.error(error);
      emojiState.loaded = false;
      emojiState.items = [];
      renderEmojiStatusMessage(t("emojiLoadError"), true);
      setEmojiGridMessage(t("emojiLoadError"));
    })
    .finally(() => {
      emojiState.loadingPromise = null;
    });

  return emojiState.loadingPromise;
}

export function filterEmojiCatalog() {
  const input = byId("emoji-search");
  const categorySelect = byId("emoji-category");
  emojiState.query = input ? String(input.value || "") : "";
  emojiState.category = categorySelect
    ? String(categorySelect.value || "smileys")
    : "smileys";
  syncEmojiSearchClearButton();
  scheduleEmojiGridRender();
}

export function clearEmojiSearch() {
  const input = byId("emoji-search");
  const categorySelect = byId("emoji-category");
  if (input) input.value = "";
  if (categorySelect) categorySelect.value = "smileys";
  emojiState.query = "";
  emojiState.category = "smileys";
  syncEmojiSearchClearButton();
  scheduleEmojiGridRender();
  if (input) input.focus();
}

function applyEmojiTranslations() {
  const staticText = [
    ["menu-emoji", "emojiCatalog"],
    ["title-emoji", "emojiCatalogTitle"],
  ];
  staticText.forEach(([id, key]) => {
    const el = byId(id);
    if (el) el.textContent = t(key);
  });

  const search = byId("emoji-search");
  if (search) search.placeholder = t("emojiSearchPlaceholder");
  const searchClearBtn = byId("emoji-search-clear-btn");
  if (searchClearBtn) {
    const label = t("todoSearchClear");
    searchClearBtn.title = label;
    searchClearBtn.setAttribute("aria-label", label);
  }

  const category = byId("emoji-category");
  if (category) {
    const labels = {
      all: t("emojiCategoryAll"),
      smileys: t("emojiCategorySmileys"),
      people: t("emojiCategoryPeople"),
      animals: t("emojiCategoryAnimals"),
      food: t("emojiCategoryFood"),
      travel: t("emojiCategoryTravel"),
      activity: t("emojiCategoryActivity"),
      objects: t("emojiCategoryObjects"),
      symbols: t("emojiCategorySymbols"),
      flags: t("emojiCategoryFlags"),
    };
    Array.from(category.options).forEach((option) => {
      option.textContent = labels[option.value] || option.textContent;
    });
  }

  if (emojiState.loaded || emojiState.items.length) {
    renderEmojiStatus(getFilteredEmoji().length);
  }
  syncEmojiSearchClearButton();
}

export async function initEmojiCatalog() {
  if (!emojiState.initialized) {
    registerTranslationApplier(applyEmojiTranslations);
    emojiState.initialized = true;
  }
  bindEmojiGridCopyHandler();
  renderEmojiGrid();
  await ensureEmojiCatalogLoaded();
  renderEmojiGrid();
}
