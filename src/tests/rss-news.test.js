import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRssFeed,
  exportRssFeeds,
  handleRssImportFile,
  importRssFeeds,
  initRssNews,
  markAllRssRead,
  onRssFeedChange,
  removeRssFeed,
} from "../features/rss-news.js";
import { FEATURE_RUNTIME_STATE, STORAGE_KEYS } from "../core/state.js";

function mountRssDom() {
  document.body.innerHTML = `
    <span id="menu-news"></span>
    <h2 id="title-news"></h2>
    <input id="rss-url" />
    <button id="rss-add-btn"></button>
    <button id="rss-remove-btn"></button>
    <button id="rss-import-btn"></button>
    <button id="rss-export-btn"></button>
    <button id="rss-load-btn"></button>
    <button id="rss-mark-all-btn"></button>
    <input id="rss-import-input" type="file" />
    <select id="rss-view-mode">
      <option value="all">All</option>
      <option value="today">Today</option>
      <option value="yesterday">Yesterday</option>
      <option value="week">Week</option>
      <option value="readLater">Read Later</option>
    </select>
    <select id="rss-feeds"></select>
    <div id="rss-status"></div>
    <div id="rss-items"></div>
  `;
}

function installRssFetchMock() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        status: "ok",
        feed: { title: "Demo Feed" },
        items: [
          {
            title: "News 1",
            link: "https://example.com/1",
            pubDate: "2026-03-20 10:00:00",
          },
          {
            title: "News 2",
            link: "https://example.com/2",
            pubDate: "2026-03-20 11:00:00",
          },
        ],
      }),
    })),
  );
}

function resetRssRuntimeState() {
  FEATURE_RUNTIME_STATE.rssNews.feeds = [];
  FEATURE_RUNTIME_STATE.rssNews.activeFeed = "";
  FEATURE_RUNTIME_STATE.rssNews.lastItems = [];
  FEATURE_RUNTIME_STATE.rssNews.readKeys = [];
  FEATURE_RUNTIME_STATE.rssNews.readLaterKeys = [];
  FEATURE_RUNTIME_STATE.rssNews.itemsByKey = {};
  FEATURE_RUNTIME_STATE.rssNews.feedItemKeys = {};
  FEATURE_RUNTIME_STATE.rssNews.initialized = false;
}

describe("rss news module", () => {
  beforeEach(() => {
    localStorage.clear();
    resetRssRuntimeState();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:rss"),
      revokeObjectURL: vi.fn(),
    });
    mountRssDom();
    installRssFetchMock();
    initRssNews();
  });

  it("adds feed and loads items", async () => {
    document.getElementById("rss-url").value = "https://example.com/feed.xml";
    await addRssFeed();

    expect(
      document.getElementById("rss-feeds")?.options.length,
    ).toBeGreaterThanOrEqual(2);
    const itemsText = document.getElementById("rss-items")?.textContent || "";
    expect(itemsText).toContain("News 1");
    expect(itemsText).toContain("News 2");
    expect(document.querySelectorAll(".rss-news-card").length).toBeGreaterThan(
      0,
    );
  });

  it("changes/removes feed and supports import/export", async () => {
    document.getElementById("rss-url").value = "https://example.com/feed.xml";
    await addRssFeed();

    await onRssFeedChange();
    expect(document.getElementById("rss-status")?.textContent).toContain(
      "rssLoaded",
    );

    await removeRssFeed();
    expect(document.getElementById("rss-feeds")?.disabled).toBe(false);
    expect(document.getElementById("rss-url")?.value).toContain("ria.ru");

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    expect(() => exportRssFeeds()).not.toThrow();
    clickSpy.mockRestore();

    const input = document.getElementById("rss-import-input");
    const file = {
      text: async () =>
        JSON.stringify({
          feeds: ["https://ria.ru/export/rss2/archive/index.xml"],
          activeFeed: "https://ria.ru/export/rss2/archive/index.xml",
        }),
    };
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [file],
    });
    await handleRssImportFile({ target: input });
    expect(FEATURE_RUNTIME_STATE.rssNews.feeds.length).toBeGreaterThanOrEqual(
      1,
    );
    expect(FEATURE_RUNTIME_STATE.rssNews.activeFeed).toBe(
      "https://ria.ru/export/rss2/archive/index.xml",
    );
    expect(document.getElementById("rss-items")?.textContent || "").toContain(
      "News 1",
    );

    const importSpy = vi.spyOn(input, "click");
    importRssFeeds();
    expect(importSpy).toHaveBeenCalledOnce();
  });

  it("toggles mark-all read/unread button behavior", async () => {
    document.getElementById("rss-url").value = "https://example.com/feed.xml";
    await addRssFeed();

    const markAllBtn = document.getElementById("rss-mark-all-btn");
    expect(markAllBtn?.textContent).toBe("rssMarkAllRead");

    markAllRssRead();
    expect(markAllBtn?.textContent).toBe("rssMarkAllUnread");
    expect(FEATURE_RUNTIME_STATE.rssNews.readKeys.length).toBeGreaterThan(0);

    markAllRssRead();
    expect(markAllBtn?.textContent).toBe("rssMarkAllRead");
    expect(FEATURE_RUNTIME_STATE.rssNews.readKeys.length).toBe(0);
  });

  it("stores feed cache maps in localStorage", async () => {
    document.getElementById("rss-url").value = "https://example.com/feed.xml";
    await addRssFeed();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.rssNewsData));
    expect(stored?.itemsByKey).toBeTruthy();
    expect(stored?.feedItemKeys).toBeTruthy();
    expect(
      Array.isArray(stored.feedItemKeys["https://example.com/feed.xml"]),
    ).toBe(true);
    expect(stored.feedItemKeys["https://example.com/feed.xml"].length).toBe(2);
  });

  it("purges expired cached items older than 7 days on init", () => {
    localStorage.clear();
    resetRssRuntimeState();
    mountRssDom();
    installRssFetchMock();

    const oldTs = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      STORAGE_KEYS.rssNewsData,
      JSON.stringify({
        feeds: [{ url: "https://example.com/feed.xml", title: "Old Feed" }],
        activeFeed: "https://example.com/feed.xml",
        readKeys: [],
        readLaterKeys: [],
        viewMode: "all",
        itemsByKey: {
          "https://old.example.com/1": {
            key: "https://old.example.com/1",
            feedUrl: "https://example.com/feed.xml",
            title: "Old Item",
            link: "https://old.example.com/1",
            description: "Old",
            pubDate: "2020-01-01 00:00:00",
            fetchedAt: oldTs,
          },
        },
        feedItemKeys: {
          "https://example.com/feed.xml": ["https://old.example.com/1"],
        },
      }),
    );

    initRssNews();
    expect(
      FEATURE_RUNTIME_STATE.rssNews.itemsByKey["https://old.example.com/1"],
    ).toBeUndefined();
    expect(
      FEATURE_RUNTIME_STATE.rssNews.feedItemKeys["https://example.com/feed.xml"]
        ?.length || 0,
    ).toBe(0);
  });

  it("clears removed feed cache entries", async () => {
    document.getElementById("rss-url").value = "https://example.com/feed.xml";
    await addRssFeed();

    expect(
      FEATURE_RUNTIME_STATE.rssNews.itemsByKey["https://example.com/1"],
    ).toBeTruthy();

    await removeRssFeed();

    expect(
      FEATURE_RUNTIME_STATE.rssNews.feedItemKeys[
        "https://example.com/feed.xml"
      ],
    ).toBeUndefined();
    expect(
      FEATURE_RUNTIME_STATE.rssNews.itemsByKey["https://example.com/1"]
        ?.feedUrl,
    ).not.toBe("https://example.com/feed.xml");
  });
});
