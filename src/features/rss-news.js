import { byId, setIcon, setSelectOptionText, setText } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { getLocale } from "../core/utils.js";
import { DEFAULT_RSS_FEEDS } from "../data/rss-feeds.js";
import {
  FEATURE_RUNTIME_STATE,
  STORAGE_KEYS,
  getStoredJson,
  setStoredJson,
} from "../core/state.js";

const rssState = FEATURE_RUNTIME_STATE.rssNews;
const RSS_JSON_API = "https://api.rss2json.com/v1/api.json?rss_url=";
const RSS_VIEW_MODES = ["all", "today", "yesterday", "week", "readLater"];
let rssRequestSeq = 0;
const RSS_SWIPE_READ_PX = 96;
const RSS_SWIPE_MAX_PX = 180;
const RSS_SWIPE_MAX_Y_DRIFT_PX = 42;
const RSS_CACHE_DAYS = 7;
const RSS_MAX_ITEMS_PER_FEED = 500;
const RSS_MAX_TOTAL_ITEMS = 3000;
const RSS_RENDER_LIMIT = 100;

function ensureRssState() {
  if (!Array.isArray(rssState.feeds)) rssState.feeds = [];
  if (typeof rssState.activeFeed !== "string") rssState.activeFeed = "";
  if (!Array.isArray(rssState.lastItems)) rssState.lastItems = [];
  if (!Array.isArray(rssState.readKeys)) rssState.readKeys = [];
  if (!Array.isArray(rssState.readLaterKeys)) rssState.readLaterKeys = [];
  if (!RSS_VIEW_MODES.includes(rssState.viewMode)) rssState.viewMode = "all";
  if (typeof rssState.initialized !== "boolean") rssState.initialized = false;
  if (!rssState.itemsByKey || typeof rssState.itemsByKey !== "object") {
    rssState.itemsByKey = {};
  }
  if (!rssState.feedItemKeys || typeof rssState.feedItemKeys !== "object") {
    rssState.feedItemKeys = {};
  }
}

function normalizeFeedEntry(entry) {
  if (typeof entry === "string") {
    const url = normalizeFeedUrl(entry);
    return url ? { url, title: "" } : null;
  }
  if (!entry || typeof entry !== "object") return null;
  const url = normalizeFeedUrl(entry.url || entry.link || "");
  if (!url) return null;
  const title = String(entry.title || "").trim();
  return { url, title };
}

function getFeedUrls() {
  return rssState.feeds.map((feed) => feed.url);
}

function hasFeedUrl(url) {
  return getFeedUrls().includes(url);
}

function upsertFeed(entry) {
  const normalized = normalizeFeedEntry(entry);
  if (!normalized) return;
  const index = rssState.feeds.findIndex((feed) => feed.url === normalized.url);
  if (index === -1) {
    rssState.feeds.push(normalized);
    return;
  }
  if (normalized.title && normalized.title !== rssState.feeds[index].title) {
    rssState.feeds[index] = {
      ...rssState.feeds[index],
      title: normalized.title,
    };
  }
}

function applyDefaultFeedTitles() {
  const defaultTitles = new Map(
    DEFAULT_RSS_FEEDS.map((feed) => [
      normalizeFeedUrl(feed.url),
      String(feed.title || "").trim(),
    ]),
  );
  rssState.feeds = rssState.feeds.map((feed) => {
    const defaultTitle = defaultTitles.get(feed.url);
    if (!defaultTitle) return feed;
    return {
      ...feed,
      title: feed.title || defaultTitle,
    };
  });
}

function saveRssData() {
  setStoredJson(STORAGE_KEYS.rssNewsData, {
    feeds: rssState.feeds,
    activeFeed: rssState.activeFeed,
    readKeys: rssState.readKeys,
    readLaterKeys: rssState.readLaterKeys,
    viewMode: rssState.viewMode,
    itemsByKey: rssState.itemsByKey,
    feedItemKeys: rssState.feedItemKeys,
  });
}

function loadRssData() {
  ensureRssState();
  const data = getStoredJson(STORAGE_KEYS.rssNewsData, null);
  if (!data || typeof data !== "object") return;
  if (Array.isArray(data.feeds)) {
    rssState.feeds = data.feeds
      .map((x) => normalizeFeedEntry(x))
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
  if (Array.isArray(data.readLaterKeys)) {
    rssState.readLaterKeys = data.readLaterKeys
      .map((x) => String(x || ""))
      .filter((x) => x);
  }
  if (
    typeof data.viewMode === "string" &&
    RSS_VIEW_MODES.includes(data.viewMode)
  ) {
    rssState.viewMode = data.viewMode;
  }
  if (data.itemsByKey && typeof data.itemsByKey === "object") {
    rssState.itemsByKey = data.itemsByKey;
  }
  if (data.feedItemKeys && typeof data.feedItemKeys === "object") {
    rssState.feedItemKeys = data.feedItemKeys;
  }
  purgeExpiredRssCache();
  rssState.lastItems = getCachedItemsForFeed(rssState.activeFeed);
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
  urls.forEach((x) => upsertFeed(x));
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
    option.value = feed.url;
    option.textContent = feed.title || feed.url;
    select.append(option);
  });
  select.disabled = false;
  if (rssState.activeFeed && hasFeedUrl(rssState.activeFeed)) {
    select.value = rssState.activeFeed;
  } else {
    rssState.activeFeed = rssState.feeds[0]?.url || "";
    select.value = rssState.activeFeed;
  }
}

function renderRssViewMode() {
  const select = byId("rss-view-mode");
  if (!select) return;
  select.value = RSS_VIEW_MODES.includes(rssState.viewMode)
    ? rssState.viewMode
    : "all";
}

function formatRssDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(getLocale());
}

function parseRssDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getStartOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getItemAgeDays(itemDate, nowDate) {
  if (!(itemDate instanceof Date)) return null;
  const nowStart = getStartOfDay(nowDate);
  const itemStart = getStartOfDay(itemDate);
  const diffMs = nowStart.getTime() - itemStart.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / 86400000);
}

function getItemGroup(itemDate, nowDate) {
  const ageDays = getItemAgeDays(itemDate, nowDate);
  if (ageDays === null) return "older";
  if (ageDays === 0) return "today";
  if (ageDays === 1) return "yesterday";
  if (ageDays <= 7) return "week";
  return "older";
}

function groupLabelForKey(key) {
  if (key === "today") return t("rssGroupToday");
  if (key === "yesterday") return t("rssGroupYesterday");
  if (key === "week") return t("rssGroupWeek");
  return t("rssGroupOlder");
}

function getRssItemKey(item) {
  const link = String(item?.link || "").trim();
  if (link) return link;
  return `${String(item?.title || "").trim()}::${String(item?.pubDate || "").trim()}`;
}

function getNowTs() {
  return Date.now();
}

function getRssCacheTtlMs() {
  return RSS_CACHE_DAYS * 24 * 60 * 60 * 1000;
}

function isExpiredRssCachedItem(entry, nowTs = getNowTs()) {
  const fetchedAt = Number(entry?.fetchedAt || 0);
  if (!fetchedAt) return true;
  return nowTs - fetchedAt > getRssCacheTtlMs();
}

function normalizeCachedRssItem(item, feedUrl) {
  const key = getRssItemKey(item);
  if (!key) return null;

  return {
    key,
    feedUrl: String(feedUrl || "").trim(),
    title: String(item?.title || "").trim(),
    link: String(item?.link || "").trim(),
    description: String(item?.description || "")
      .trim()
      .slice(0, 500),
    pubDate: String(item?.pubDate || "").trim(),
    fetchedAt: getNowTs(),
  };
}

function purgeExpiredRssCache() {
  ensureRssState();
  const nowTs = getNowTs();
  const validKeys = new Set();

  Object.entries(rssState.feedItemKeys).forEach(([feedUrl, keys]) => {
    if (!Array.isArray(keys)) {
      rssState.feedItemKeys[feedUrl] = [];
      return;
    }

    const filtered = keys.filter((key) => {
      const normalizedKey = String(key || "").trim();
      if (!normalizedKey) return false;
      const entry = rssState.itemsByKey[normalizedKey];
      if (!entry) return false;
      if (isExpiredRssCachedItem(entry, nowTs)) return false;
      validKeys.add(normalizedKey);
      return true;
    });

    rssState.feedItemKeys[feedUrl] = filtered.slice(0, RSS_MAX_ITEMS_PER_FEED);
  });

  Object.keys(rssState.itemsByKey).forEach((key) => {
    if (!validKeys.has(key)) {
      delete rssState.itemsByKey[key];
    }
  });

  const allEntries = Object.values(rssState.itemsByKey).sort(
    (a, b) => Number(b?.fetchedAt || 0) - Number(a?.fetchedAt || 0),
  );

  const overflow = allEntries.slice(RSS_MAX_TOTAL_ITEMS);
  if (overflow.length) {
    const overflowKeys = new Set(overflow.map((x) => x.key));
    overflow.forEach((x) => {
      delete rssState.itemsByKey[x.key];
    });

    Object.keys(rssState.feedItemKeys).forEach((feedUrl) => {
      rssState.feedItemKeys[feedUrl] = (
        rssState.feedItemKeys[feedUrl] || []
      ).filter((key) => !overflowKeys.has(key));
    });
  }

  purgeOrphanedReadState();
}

function purgeOrphanedReadState() {
  const validKeys = new Set(Object.keys(rssState.itemsByKey));
  rssState.readKeys = rssState.readKeys.filter((key) => validKeys.has(key));
  rssState.readLaterKeys = rssState.readLaterKeys.filter((key) =>
    validKeys.has(key),
  );
}

function getCachedItemsForFeed(feedUrl) {
  const normalizedFeedUrl = normalizeFeedUrl(feedUrl);
  if (!normalizedFeedUrl) return [];

  purgeExpiredRssCache();
  const keys = Array.isArray(rssState.feedItemKeys[normalizedFeedUrl])
    ? rssState.feedItemKeys[normalizedFeedUrl]
    : [];

  return keys
    .map((key) => rssState.itemsByKey[key])
    .filter((entry) => entry && !isExpiredRssCachedItem(entry))
    .sort((a, b) => {
      const dateA = parseRssDate(a.pubDate)?.getTime() || 0;
      const dateB = parseRssDate(b.pubDate)?.getTime() || 0;
      if (dateB !== dateA) return dateB - dateA;
      return Number(b.fetchedAt || 0) - Number(a.fetchedAt || 0);
    })
    .map((entry) => ({
      title: entry.title,
      link: entry.link,
      description: entry.description,
      pubDate: entry.pubDate,
    }));
}

function mergeItemsIntoRssCache(feedUrl, items = []) {
  ensureRssState();
  const normalizedFeedUrl = normalizeFeedUrl(feedUrl);
  if (!normalizedFeedUrl) return [];

  const previousKeys = Array.isArray(rssState.feedItemKeys[normalizedFeedUrl])
    ? rssState.feedItemKeys[normalizedFeedUrl]
    : [];
  const nextKeys = new Set(previousKeys);

  items.forEach((item) => {
    const entry = normalizeCachedRssItem(item, normalizedFeedUrl);
    if (!entry) return;

    const existing = rssState.itemsByKey[entry.key];
    rssState.itemsByKey[entry.key] = existing
      ? {
          ...existing,
          ...entry,
          fetchedAt: existing.fetchedAt || entry.fetchedAt,
        }
      : entry;

    nextKeys.add(entry.key);
  });

  const sortedKeys = Array.from(nextKeys)
    .map((key) => rssState.itemsByKey[key])
    .filter((x) => x && !isExpiredRssCachedItem(x))
    .sort((a, b) => {
      const dateA = parseRssDate(a.pubDate)?.getTime() || 0;
      const dateB = parseRssDate(b.pubDate)?.getTime() || 0;
      if (dateB !== dateA) return dateB - dateA;
      return Number(b.fetchedAt || 0) - Number(a.fetchedAt || 0);
    })
    .slice(0, RSS_MAX_ITEMS_PER_FEED)
    .map((x) => x.key);

  rssState.feedItemKeys[normalizedFeedUrl] = sortedKeys;
  purgeExpiredRssCache();
  saveRssData();
  return getCachedItemsForFeed(normalizedFeedUrl);
}

function isRssItemRead(item) {
  const key = getRssItemKey(item);
  if (!key) return false;
  return rssState.readKeys.includes(key);
}

function isRssItemReadLater(item) {
  const key = getRssItemKey(item);
  if (!key) return false;
  return rssState.readLaterKeys.includes(key);
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

function toggleRssItemReadLaterByKey(key) {
  const normalized = String(key || "").trim();
  if (!normalized) return;
  const index = rssState.readLaterKeys.indexOf(normalized);
  if (index >= 0) {
    rssState.readLaterKeys.splice(index, 1);
  } else {
    rssState.readLaterKeys.push(normalized);
    if (rssState.readLaterKeys.length > 1000) {
      rssState.readLaterKeys.splice(0, rssState.readLaterKeys.length - 1000);
    }
  }
  saveRssData();
}

function purgeRssItemKeys(keys = []) {
  if (!Array.isArray(keys) || !keys.length) return;
  const keySet = new Set(
    keys.map((x) => String(x || "").trim()).filter((x) => x),
  );
  if (!keySet.size) return;
  rssState.readKeys = rssState.readKeys.filter((x) => !keySet.has(x));
  rssState.readLaterKeys = rssState.readLaterKeys.filter((x) => !keySet.has(x));
}

function buildItemCard(item, key) {
  const card = document.createElement("article");
  card.className = "rss-news-card";

  const swipeAction = document.createElement("div");
  swipeAction.className = "rss-swipe-action";
  swipeAction.innerHTML = `<svg class="icon-svg btn-icon" aria-hidden="true"><use href="#i-check"></use></svg><span>${t("rssMarkReadSwipe")}</span>`;

  const content = document.createElement("div");
  content.className = "rss-news-content";

  if (isRssItemRead(item)) {
    card.classList.add("is-read");
  }

  const titleRow = document.createElement("div");
  titleRow.className = "rss-news-title-row";

  const title = document.createElement("a");
  title.href = String(item.link || "#");
  title.target = "_blank";
  title.rel = "noopener noreferrer";
  title.textContent = String(item.title || t("rssUntitled"));
  title.className = "rss-news-title";

  const readLaterBtn = document.createElement("button");
  readLaterBtn.type = "button";
  readLaterBtn.className =
    "text-action-btn toolbar-icon-btn rss-read-later-btn";
  const isSaved = isRssItemReadLater(item);
  if (isSaved) readLaterBtn.classList.add("is-active");
  readLaterBtn.title = isSaved ? t("rssReadLaterRemove") : t("rssReadLaterAdd");
  readLaterBtn.setAttribute("aria-label", readLaterBtn.title);
  readLaterBtn.setAttribute("aria-pressed", isSaved ? "true" : "false");
  readLaterBtn.innerHTML =
    '<svg class="icon-svg btn-icon"><use href="#i-bookmark"></use></svg>';
  readLaterBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const itemKey = key || getRssItemKey(item);
    if (!itemKey) return;
    toggleRssItemReadLaterByKey(itemKey);

    const savedNow = rssState.readLaterKeys.includes(itemKey);
    readLaterBtn.classList.toggle("is-active", savedNow);
    readLaterBtn.setAttribute("aria-pressed", savedNow ? "true" : "false");
    readLaterBtn.title = savedNow
      ? t("rssReadLaterRemove")
      : t("rssReadLaterAdd");
    readLaterBtn.setAttribute("aria-label", readLaterBtn.title);

    // In Read Later mode, immediately re-render so the card appears/disappears.
    if (rssState.viewMode === "readLater") {
      renderRssItems(rssState.lastItems);
      return;
    }
    renderMarkAllButton(rssState.lastItems);
  });

  titleRow.append(title, readLaterBtn);

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

  installRssSwipeRead(card, key);
  content.append(titleRow, meta, description);
  card.append(swipeAction, content);
  return card;
}

function shouldIncludeItemByViewMode(item, itemGroup) {
  const mode = rssState.viewMode;
  if (mode === "readLater") return isRssItemReadLater(item);
  if (mode === "today") return itemGroup === "today";
  if (mode === "yesterday") return itemGroup === "yesterday";
  if (mode === "week") {
    return (
      itemGroup === "today" || itemGroup === "yesterday" || itemGroup === "week"
    );
  }
  return true;
}

function getVisibleRssItemKeys(items = rssState.lastItems) {
  if (!Array.isArray(items) || !items.length) return [];
  const now = new Date();
  return items
    .slice(0, RSS_RENDER_LIMIT)
    .filter((item) => {
      const itemDate = parseRssDate(item?.pubDate);
      const group = getItemGroup(itemDate, now);
      return shouldIncludeItemByViewMode(item, group);
    })
    .map((item) => getRssItemKey(item))
    .filter((key) => key);
}

function areAllVisibleRssItemsRead(items = rssState.lastItems) {
  const keys = getVisibleRssItemKeys(items);
  if (!keys.length) return false;
  return keys.every((key) => rssState.readKeys.includes(key));
}

function renderMarkAllButton(items = rssState.lastItems) {
  const button = byId("rss-mark-all-btn");
  if (!button) return;
  const hasVisibleItems = getVisibleRssItemKeys(items).length > 0;
  const allRead = areAllVisibleRssItemsRead(items);
  const label = allRead ? t("rssMarkAllUnread") : t("rssMarkAllRead");
  button.textContent = label;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.disabled = !hasVisibleItems;
}

function renderRssItems(items = rssState.lastItems) {
  const holder = byId("rss-items");
  if (!holder) {
    renderMarkAllButton(items);
    return;
  }
  if (!Array.isArray(items) || !items.length) {
    holder.textContent = t("rssNoItems");
    renderMarkAllButton(items);
    return;
  }

  const now = new Date();
  const grouped = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  };

  items.slice(0, RSS_RENDER_LIMIT).forEach((item) => {
    const key = getRssItemKey(item);
    if (!key) return;
    const itemDate = parseRssDate(item?.pubDate);
    const group = getItemGroup(itemDate, now);
    if (!shouldIncludeItemByViewMode(item, group)) return;
    grouped[group].push({ item, key });
  });

  const sections = [];
  ["today", "yesterday", "week", "older"].forEach((groupKey) => {
    const rows = grouped[groupKey];
    if (!rows.length) return;

    const section = document.createElement("section");
    section.className = "rss-group";

    const title = document.createElement("h3");
    title.className = "rss-group-title";
    title.textContent = groupLabelForKey(groupKey);

    const cards = document.createElement("div");
    cards.className = "rss-group-cards";
    rows.forEach(({ item, key }) => {
      cards.append(buildItemCard(item, key));
    });

    section.append(title, cards);
    sections.push(section);
  });

  if (!sections.length) {
    holder.textContent = t("rssNoItems");
    renderMarkAllButton(items);
    return;
  }

  holder.replaceChildren(...sections);
  renderMarkAllButton(items);
}

function installRssSwipeRead(card, key) {
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let tracking = false;
  let committed = false;

  const isInteractiveTarget = (target) => {
    const element = target instanceof Element ? target : null;
    if (!element) return false;
    return Boolean(
      element.closest(
        "button, a, input, select, textarea, [contenteditable='true']",
      ),
    );
  };

  const setSwipeX = (value) => {
    const clamped = Math.max(0, Math.min(value, RSS_SWIPE_MAX_PX));
    currentX = clamped;
    card.style.setProperty("--rss-swipe-x", `${clamped}px`);
    card.style.setProperty(
      "--rss-swipe-progress",
      String(Math.min(clamped / RSS_SWIPE_READ_PX, 1)),
    );
    card.classList.toggle("is-swipe-ready", clamped >= RSS_SWIPE_READ_PX);
  };

  const resetSwipe = () => {
    card.classList.remove("is-swiping");
    card.classList.remove("is-swipe-ready");
    setSwipeX(0);
  };

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (card.classList.contains("is-read")) return;
    if (isInteractiveTarget(event.target)) return;
    startX = event.clientX;
    startY = event.clientY;
    committed = false;
    tracking = true;
    card.classList.add("is-swiping");
    card.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!tracking) return;
    const dx = event.clientX - startX;
    const dy = Math.abs(event.clientY - startY);
    if (dy > RSS_SWIPE_MAX_Y_DRIFT_PX && Math.abs(dy) > Math.abs(dx)) {
      tracking = false;
      resetSwipe();
      return;
    }
    if (dx <= 0) {
      setSwipeX(0);
      return;
    }
    setSwipeX(dx);
    event.preventDefault();
  };

  const onPointerUp = (event) => {
    if (!tracking) return;
    tracking = false;
    if (currentX < RSS_SWIPE_READ_PX) {
      resetSwipe();
      return;
    }
    committed = true;
    card.classList.add("is-swipe-commit");
    card.classList.add("is-swipe-done");
    setSwipeX(RSS_SWIPE_MAX_PX);
    markRssItemReadByKey(key);
    card.classList.add("is-read");
    window.setTimeout(() => {
      card.classList.remove("is-swipe-done");
      card.classList.remove("is-swipe-commit");
      resetSwipe();
    }, 320);
    card.releasePointerCapture?.(event.pointerId);
  };

  const onPointerCancel = () => {
    tracking = false;
    if (!committed) resetSwipe();
  };

  card.addEventListener("pointerdown", onPointerDown, { passive: true });
  card.addEventListener("pointermove", onPointerMove, { passive: false });
  card.addEventListener("pointerup", onPointerUp, { passive: true });
  card.addEventListener("pointercancel", onPointerCancel, { passive: true });
  card.addEventListener("lostpointercapture", onPointerCancel, {
    passive: true,
  });
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

  const cachedItems = getCachedItemsForFeed(feedUrl);
  if (cachedItems.length) {
    rssState.lastItems = cachedItems;
    renderRssItems(cachedItems);
    setRssStatus(`${t("rssLoaded")}: ${feedUrl}`);
  } else {
    setRssStatus(t("rssLoading"));
  }

  try {
    const payload = await fetchRssFeed(feedUrl);
    if (requestId !== rssRequestSeq) return;

    const mergedItems = mergeItemsIntoRssCache(feedUrl, payload.items);
    rssState.lastItems = mergedItems;

    upsertFeed({
      url: feedUrl,
      title: String(payload.feed?.title || "").trim(),
    });

    saveRssData();
    renderRssFeeds();
    renderRssItems(mergedItems);
    setRssStatus(`${t("rssLoaded")}: ${payload.feed?.title || feedUrl}`);
  } catch {
    if (requestId !== rssRequestSeq) return;

    const fallbackItems = getCachedItemsForFeed(feedUrl);
    rssState.lastItems = fallbackItems;
    renderRssItems(fallbackItems);
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

  const feedUrl = rssState.activeFeed;
  const keysToPurge = Array.isArray(rssState.feedItemKeys[feedUrl])
    ? rssState.feedItemKeys[feedUrl]
    : [];

  purgeRssItemKeys(keysToPurge);

  delete rssState.feedItemKeys[feedUrl];
  keysToPurge.forEach((key) => {
    delete rssState.itemsByKey[key];
  });

  rssState.feeds = rssState.feeds.filter((x) => x.url !== feedUrl);
  rssState.activeFeed = rssState.feeds[0]?.url || "";

  purgeExpiredRssCache();
  saveRssData();
  renderRssFeeds();

  if (rssState.activeFeed) {
    rssState.lastItems = getCachedItemsForFeed(rssState.activeFeed);
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

export function onRssViewModeChange() {
  const select = byId("rss-view-mode");
  if (!select) return;
  const mode = String(select.value || "all");
  rssState.viewMode = RSS_VIEW_MODES.includes(mode) ? mode : "all";
  saveRssData();
  renderRssItems();
}

export function markAllRssRead() {
  ensureRssState();
  const keys = getVisibleRssItemKeys(rssState.lastItems);
  if (!keys.length) return;
  if (keys.every((key) => rssState.readKeys.includes(key))) {
    const keySet = new Set(keys);
    rssState.readKeys = rssState.readKeys.filter((key) => !keySet.has(key));
    saveRssData();
  } else {
    keys.forEach((key) => {
      markRssItemReadByKey(key);
    });
  }
  renderRssItems();
}

export function exportRssFeeds() {
  ensureRssState();
  purgeExpiredRssCache();
  const payload = JSON.stringify(
    {
      feeds: rssState.feeds,
      activeFeed: rssState.activeFeed,
      readKeys: rssState.readKeys,
      readLaterKeys: rssState.readLaterKeys,
      viewMode: rssState.viewMode,
      itemsByKey: rssState.itemsByKey,
      feedItemKeys: rssState.feedItemKeys,
    },
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
    const importedReadLater =
      !Array.isArray(parsed) && Array.isArray(parsed?.readLaterKeys)
        ? parsed.readLaterKeys.map((x) => String(x || "")).filter((x) => x)
        : [];
    const importedReadKeys =
      !Array.isArray(parsed) && Array.isArray(parsed?.readKeys)
        ? parsed.readKeys.map((x) => String(x || "")).filter((x) => x)
        : [];
    const importedViewMode =
      !Array.isArray(parsed) && typeof parsed?.viewMode === "string"
        ? parsed.viewMode
        : "all";
    const importedItemsByKey =
      !Array.isArray(parsed) &&
      parsed?.itemsByKey &&
      typeof parsed.itemsByKey === "object"
        ? parsed.itemsByKey
        : {};
    const importedFeedItemKeys =
      !Array.isArray(parsed) &&
      parsed?.feedItemKeys &&
      typeof parsed.feedItemKeys === "object"
        ? parsed.feedItemKeys
        : {};

    mergeRssFeeds(importedFeeds);
    if (importedActiveFeed && hasFeedUrl(importedActiveFeed)) {
      rssState.activeFeed = importedActiveFeed;
    } else if (!rssState.activeFeed && rssState.feeds.length) {
      rssState.activeFeed = rssState.feeds[0].url;
    }

    if (importedReadLater.length) {
      const set = new Set(rssState.readLaterKeys);
      importedReadLater.forEach((x) => set.add(x));
      rssState.readLaterKeys = Array.from(set).slice(-1000);
    }
    if (importedReadKeys.length) {
      const set = new Set(rssState.readKeys);
      importedReadKeys.forEach((x) => set.add(x));
      rssState.readKeys = Array.from(set).slice(-1000);
    }

    Object.entries(importedItemsByKey).forEach(([key, value]) => {
      const normalizedKey = String(key || "").trim();
      if (!normalizedKey || !value || typeof value !== "object") return;
      rssState.itemsByKey[normalizedKey] = {
        ...value,
        key: normalizedKey,
      };
    });

    Object.entries(importedFeedItemKeys).forEach(([feedUrl, keys]) => {
      const normalizedFeedUrl = normalizeFeedUrl(feedUrl);
      if (!normalizedFeedUrl || !Array.isArray(keys)) return;
      const prev = Array.isArray(rssState.feedItemKeys[normalizedFeedUrl])
        ? rssState.feedItemKeys[normalizedFeedUrl]
        : [];
      const merged = new Set(prev);
      keys
        .map((x) => String(x || "").trim())
        .filter((x) => x)
        .forEach((x) => merged.add(x));
      rssState.feedItemKeys[normalizedFeedUrl] = Array.from(merged)
        .map((key) => rssState.itemsByKey[key])
        .filter((x) => x && !isExpiredRssCachedItem(x))
        .sort((a, b) => {
          const dateA = parseRssDate(a.pubDate)?.getTime() || 0;
          const dateB = parseRssDate(b.pubDate)?.getTime() || 0;
          if (dateB !== dateA) return dateB - dateA;
          return Number(b.fetchedAt || 0) - Number(a.fetchedAt || 0);
        })
        .slice(0, RSS_MAX_ITEMS_PER_FEED)
        .map((x) => x.key);
    });

    purgeExpiredRssCache();
    if (RSS_VIEW_MODES.includes(importedViewMode)) {
      rssState.viewMode = importedViewMode;
    }

    saveRssData();
    renderRssFeeds();
    renderRssViewMode();
    rssState.lastItems = getCachedItemsForFeed(rssState.activeFeed);
    renderRssItems();
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
  const addLabel = t("rssAddFeed");
  const removeLabel = t("rssRemoveFeed");
  const loadLabel = t("rssLoad");
  const exportLabel = t("rssExport");
  const importLabel = t("rssImport");
  const markAllLabel = t("rssMarkAllRead");

  setIcon("rss-load-btn", "i-download");
  setIcon("rss-add-btn", "i-folder-plus");
  setIcon("rss-remove-btn", "i-folder-minus");
  setIcon("rss-import-btn", "i-file-up");
  setIcon("rss-export-btn", "i-file-down");

  const loadBtn = byId("rss-load-btn");
  if (loadBtn) {
    loadBtn.title = loadLabel;
    loadBtn.setAttribute("aria-label", loadLabel);
  }
  const addBtn = byId("rss-add-btn");
  if (addBtn) {
    addBtn.title = addLabel;
    addBtn.setAttribute("aria-label", addLabel);
  }
  const removeBtn = byId("rss-remove-btn");
  if (removeBtn) {
    removeBtn.title = removeLabel;
    removeBtn.setAttribute("aria-label", removeLabel);
  }
  const importBtn = byId("rss-import-btn");
  if (importBtn) {
    importBtn.title = importLabel;
    importBtn.setAttribute("aria-label", importLabel);
  }
  const exportBtn = byId("rss-export-btn");
  if (exportBtn) {
    exportBtn.title = exportLabel;
    exportBtn.setAttribute("aria-label", exportLabel);
  }
  const markAllBtn = byId("rss-mark-all-btn");
  if (markAllBtn) {
    markAllBtn.textContent = markAllLabel;
    markAllBtn.title = markAllLabel;
    markAllBtn.setAttribute("aria-label", markAllLabel);
  }

  setSelectOptionText("rss-view-mode", "all", t("rssViewAll"));
  setSelectOptionText("rss-view-mode", "today", t("rssGroupToday"));
  setSelectOptionText("rss-view-mode", "yesterday", t("rssGroupYesterday"));
  setSelectOptionText("rss-view-mode", "week", t("rssGroupWeek"));
  setSelectOptionText("rss-view-mode", "readLater", t("rssReadLater"));

  const input = byId("rss-url");
  if (input) input.placeholder = t("rssUrlPlaceholder");
  renderRssFeeds();
  renderRssViewMode();
  renderRssItems();
  renderMarkAllButton();
  if (!byId("rss-status")?.textContent) {
    setRssStatus(t("rssReady"));
  }
}

export function initRssNews() {
  ensureRssState();
  loadRssData();
  const feedsBeforeMerge = rssState.feeds.length;
  mergeRssFeeds(DEFAULT_RSS_FEEDS);
  applyDefaultFeedTitles();
  if (!rssState.activeFeed && rssState.feeds.length) {
    rssState.activeFeed = rssState.feeds[0].url;
  }
  if (rssState.feeds.length !== feedsBeforeMerge) {
    saveRssData();
  }
  renderRssFeeds();
  renderRssViewMode();
  rssState.lastItems = getCachedItemsForFeed(rssState.activeFeed);
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
