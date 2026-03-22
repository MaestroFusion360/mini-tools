import { byId, setText } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { getLocale } from "../core/utils.js";
import {
  FEATURE_RUNTIME_STATE,
  STORAGE_KEYS,
  getStoredJson,
  setStoredJson,
} from "../core/state.js";

const rssState = FEATURE_RUNTIME_STATE.rssNews;
const RSS_JSON_API = "https://api.rss2json.com/v1/api.json?rss_url=";
let rssRequestSeq = 0;
const RSS_SWIPE_READ_PX = 56;
const RSS_SWIPE_MAX_Y_DRIFT_PX = 42;

function ensureRssState() {
  if (!Array.isArray(rssState.feeds)) rssState.feeds = [];
  if (typeof rssState.activeFeed !== "string") rssState.activeFeed = "";
  if (!Array.isArray(rssState.lastItems)) rssState.lastItems = [];
  if (!Array.isArray(rssState.readKeys)) rssState.readKeys = [];
  if (typeof rssState.initialized !== "boolean") rssState.initialized = false;
}

function saveRssData() {
  setStoredJson(STORAGE_KEYS.rssNewsData, {
    feeds: rssState.feeds,
    activeFeed: rssState.activeFeed,
    readKeys: rssState.readKeys,
  });
}

function loadRssData() {
  ensureRssState();
  const data = getStoredJson(STORAGE_KEYS.rssNewsData, null);
  if (!data || typeof data !== "object") return;
  if (Array.isArray(data.feeds)) {
    rssState.feeds = data.feeds
      .map((x) => normalizeFeedUrl(x))
      .filter((x) => x);
  }
  if (typeof data.activeFeed === "string") {
    rssState.activeFeed = normalizeFeedUrl(data.activeFeed);
  }
  if (Array.isArray(data.readKeys)) {
    rssState.readKeys = data.readKeys
      .map((x) => String(x || ""))
      .filter((x) => x);
  }
}

function setRssStatus(text) {
  const status = byId("rss-status");
  if (status) status.textContent = text;
}

function normalizeFeedUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function mergeRssFeeds(urls = []) {
  ensureRssState();
  const normalized = urls.map((x) => normalizeFeedUrl(x)).filter((x) => x);
  const set = new Set(rssState.feeds);
  normalized.forEach((x) => set.add(x));
  rssState.feeds = Array.from(set);
}

function renderRssFeeds() {
  const select = byId("rss-feeds");
  if (!select) return;
  select.innerHTML = "";
  if (!rssState.feeds.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("rssNoFeeds");
    select.append(option);
    select.disabled = true;
    return;
  }
  rssState.feeds.forEach((feed) => {
    const option = document.createElement("option");
    option.value = feed;
    option.textContent = feed;
    select.append(option);
  });
  select.disabled = false;
  if (rssState.activeFeed && rssState.feeds.includes(rssState.activeFeed)) {
    select.value = rssState.activeFeed;
  } else {
    rssState.activeFeed = rssState.feeds[0];
    select.value = rssState.activeFeed;
  }
}

function formatRssDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(getLocale());
}

function renderRssItems(items = rssState.lastItems) {
  const holder = byId("rss-items");
  if (!holder) return;
  if (!Array.isArray(items) || !items.length) {
    holder.textContent = t("rssNoItems");
    return;
  }
  const rows = items.slice(0, 25).map((item) => {
    const card = document.createElement("article");
    card.className = "rss-news-card";
    const itemKey = getRssItemKey(item);
    if (isRssItemRead(item)) {
      card.classList.add("is-read");
    }

    const title = document.createElement("a");
    title.href = String(item.link || "#");
    title.target = "_blank";
    title.rel = "noopener noreferrer";
    title.textContent = String(item.title || t("rssUntitled"));
    title.className = "rss-news-title";

    const meta = document.createElement("div");
    meta.className = "small-text";
    meta.textContent = formatRssDate(item.pubDate);

    const description = document.createElement("div");
    description.className = "small-text";
    description.textContent = String(item.description || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220);

    installRssSwipeRead(card, itemKey);
    card.append(title, meta, description);
    return card;
  });
  holder.replaceChildren(...rows);
}

function getRssItemKey(item) {
  const link = String(item?.link || "").trim();
  if (link) return link;
  return `${String(item?.title || "").trim()}::${String(item?.pubDate || "").trim()}`;
}

function isRssItemRead(item) {
  const key = getRssItemKey(item);
  if (!key) return false;
  return rssState.readKeys.includes(key);
}

function markRssItemReadByKey(key) {
  const normalized = String(key || "").trim();
  if (!normalized) return;
  if (rssState.readKeys.includes(normalized)) return;
  rssState.readKeys.push(normalized);
  if (rssState.readKeys.length > 1000) {
    rssState.readKeys.splice(0, rssState.readKeys.length - 1000);
  }
  saveRssData();
}

function installRssSwipeRead(card, key) {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startX = event.clientX;
    startY = event.clientY;
    tracking = true;
  };
  const onPointerUp = (event) => {
    if (!tracking) return;
    tracking = false;
    const dx = event.clientX - startX;
    const dy = Math.abs(event.clientY - startY);
    if (dx < RSS_SWIPE_READ_PX || dy > RSS_SWIPE_MAX_Y_DRIFT_PX) return;
    markRssItemReadByKey(key);
    card.classList.add("is-read");
  };
  const onPointerCancel = () => {
    tracking = false;
  };

  card.addEventListener("pointerdown", onPointerDown, { passive: true });
  card.addEventListener("pointerup", onPointerUp, { passive: true });
  card.addEventListener("pointercancel", onPointerCancel, { passive: true });
}

async function fetchRssFeed(url) {
  const response = await fetch(`${RSS_JSON_API}${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error("RSS request failed");
  const payload = await response.json();
  if (payload.status !== "ok" || !Array.isArray(payload.items)) {
    throw new Error("Invalid RSS payload");
  }
  return payload;
}

export async function loadRssFeed(url = "") {
  ensureRssState();
  const requestId = ++rssRequestSeq;
  const feedUrl = normalizeFeedUrl(
    url || rssState.activeFeed || byId("rss-url")?.value,
  );
  if (!feedUrl) {
    setRssStatus(t("rssInvalidUrl"));
    return;
  }
  rssState.activeFeed = feedUrl;
  const input = byId("rss-url");
  if (input) input.value = feedUrl;
  setRssStatus(t("rssLoading"));
  try {
    const payload = await fetchRssFeed(feedUrl);
    if (requestId !== rssRequestSeq) return;
    rssState.lastItems = payload.items;
    renderRssItems(payload.items);
    setRssStatus(`${t("rssLoaded")}: ${payload.feed?.title || feedUrl}`);
  } catch {
    if (requestId !== rssRequestSeq) return;
    rssState.lastItems = [];
    renderRssItems([]);
    setRssStatus(t("rssLoadFailed"));
  }
}

export async function addRssFeed() {
  ensureRssState();
  const input = byId("rss-url");
  const url = normalizeFeedUrl(input?.value || "");
  if (!url) {
    setRssStatus(t("rssInvalidUrl"));
    return;
  }
  mergeRssFeeds([url]);
  rssState.activeFeed = url;
  saveRssData();
  renderRssFeeds();
  await loadRssFeed(url);
}

export async function removeRssFeed() {
  ensureRssState();
  if (!rssState.activeFeed) return;
  rssState.feeds = rssState.feeds.filter((x) => x !== rssState.activeFeed);
  rssState.activeFeed = rssState.feeds[0] || "";
  saveRssData();
  renderRssFeeds();
  if (rssState.activeFeed) {
    await loadRssFeed(rssState.activeFeed);
  } else {
    const input = byId("rss-url");
    if (input) input.value = "";
    rssState.lastItems = [];
    renderRssItems([]);
    setRssStatus(t("rssNoFeeds"));
  }
}

export async function onRssFeedChange() {
  const select = byId("rss-feeds");
  if (!select) return;
  rssState.activeFeed = select.value || "";
  saveRssData();
  await loadRssFeed(rssState.activeFeed);
}

export function exportRssFeeds() {
  ensureRssState();
  const payload = JSON.stringify(
    { feeds: rssState.feeds, activeFeed: rssState.activeFeed },
    null,
    2,
  );
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "rss-feeds.json";
  link.click();
  URL.revokeObjectURL(url);
}

export function importRssFeeds() {
  byId("rss-import-input")?.click();
}

export async function handleRssImportFile(event) {
  const input = event?.target;
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const importedFeeds = Array.isArray(parsed) ? parsed : parsed?.feeds;
    if (!Array.isArray(importedFeeds)) {
      setRssStatus(t("rssImportInvalid"));
      return;
    }
    const importedActiveFeed =
      !Array.isArray(parsed) && typeof parsed?.activeFeed === "string"
        ? normalizeFeedUrl(parsed.activeFeed)
        : "";

    mergeRssFeeds(importedFeeds);
    if (importedActiveFeed && rssState.feeds.includes(importedActiveFeed)) {
      rssState.activeFeed = importedActiveFeed;
    } else if (!rssState.activeFeed && rssState.feeds.length) {
      rssState.activeFeed = rssState.feeds[0];
    }
    saveRssData();
    renderRssFeeds();
    setRssStatus(`${t("rssImportDone")}: ${rssState.feeds.length}`);
    if (rssState.activeFeed) {
      await loadRssFeed(rssState.activeFeed);
    }
  } catch {
    setRssStatus(t("rssImportInvalid"));
  } finally {
    if (input) input.value = "";
  }
}

function applyRssTranslations() {
  setText("menu-news", t("news"));
  setText("title-news", t("newsTitle"));
  setText("rss-add-btn", t("rssAddFeed"));
  setText("rss-remove-btn", t("rssRemoveFeed"));
  setText("rss-load-btn", t("rssLoad"));
  setText("rss-export-btn", t("rssExport"));
  setText("rss-import-btn", t("rssImport"));
  const input = byId("rss-url");
  if (input) input.placeholder = t("rssUrlPlaceholder");
  renderRssFeeds();
  renderRssItems();
  if (!byId("rss-status")?.textContent) {
    setRssStatus(t("rssReady"));
  }
}

export function initRssNews() {
  ensureRssState();
  loadRssData();
  renderRssFeeds();
  renderRssItems();
  if (!rssState.initialized) {
    registerTranslationApplier(applyRssTranslations);
    rssState.initialized = true;
  }
  if (rssState.activeFeed) {
    void loadRssFeed(rssState.activeFeed);
  } else {
    setRssStatus(t("rssReady"));
  }
}
