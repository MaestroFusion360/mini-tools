import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearEmojiSearch,
  filterEmojiCatalog,
  initEmojiCatalog,
} from "../features/emoji-catalog.js";

function mountEmojiDom() {
  document.body.innerHTML = `
    <span id="menu-emoji"></span>
    <h2 id="title-emoji"></h2>
    <input id="emoji-search" />
    <select id="emoji-category">
      <option value="all">All</option>
      <option value="food">Food</option>
    </select>
    <button id="emoji-clear-btn"></button>
    <div id="emoji-status"></div>
    <div id="emoji-grid"></div>
  `;
}

function waitForEmojiRender() {
  return new Promise((resolve) => setTimeout(resolve, 170));
}

describe("emoji catalog module", () => {
  let previousFetch;

  beforeEach(async () => {
    previousFetch = global.fetch;
    mountEmojiDom();
    global.fetch = async () => ({
      ok: true,
      async json() {
        return [
          {
            emoji: "😀",
            name: "grinning face",
            category: "smileys",
            tags: ["smile"],
          },
          { emoji: "🍕", name: "pizza", category: "food", tags: ["food"] },
          { emoji: "🚗", name: "car", category: "travel", tags: ["transport"] },
          {
            emoji: "💻",
            name: "laptop",
            category: "objects",
            tags: ["computer"],
          },
          {
            emoji: "⚽",
            name: "soccer ball",
            category: "activity",
            tags: ["sport"],
          },
          {
            emoji: "❤️",
            name: "red heart",
            category: "symbols",
            tags: ["love"],
          },
          { emoji: "🇺🇸", name: "flag us", category: "flags", tags: ["usa"] },
          { emoji: "🐶", name: "dog", category: "animals", tags: ["pet"] },
          { emoji: "👩", name: "woman", category: "people", tags: ["person"] },
          {
            emoji: "😂",
            name: "face with tears",
            category: "smileys",
            tags: ["laugh"],
          },
          { emoji: "🥑", name: "avocado", category: "food", tags: ["healthy"] },
          {
            emoji: "🔒",
            name: "invalid category sample",
            category: "weird",
            tags: [],
          },
        ];
      },
    });
    await initEmojiCatalog();
  });

  afterEach(() => {
    global.fetch = previousFetch;
  });

  it("renders emoji list on init", () => {
    const items = document.querySelectorAll("#emoji-grid .emoji-item");
    expect(items.length).toBeGreaterThan(10);
  });

  it("filters by query text", async () => {
    document.getElementById("emoji-search").value = "pizza";
    filterEmojiCatalog();
    await waitForEmojiRender();
    const text = document.getElementById("emoji-grid")?.textContent || "";
    expect(text.toLowerCase()).toContain("pizza");
  });

  it("resets search and category", async () => {
    document.getElementById("emoji-search").value = "car";
    document.getElementById("emoji-category").value = "food";
    filterEmojiCatalog();
    clearEmojiSearch();
    await waitForEmojiRender();
    expect(document.getElementById("emoji-search").value).toBe("");
    expect(document.getElementById("emoji-category").value).toBe("all");
  });

  it("normalizes unknown categories to objects", async () => {
    document.getElementById("emoji-search").value = "invalid category sample";
    filterEmojiCatalog();
    await waitForEmojiRender();
    const foodOption = document.getElementById("emoji-category");
    foodOption.value = "food";
    filterEmojiCatalog();
    await waitForEmojiRender();
    const textInFood = document.getElementById("emoji-grid")?.textContent || "";
    expect(textInFood).not.toContain("invalid category sample");

    foodOption.value = "all";
    filterEmojiCatalog();
    await waitForEmojiRender();
    const textInAll = document.getElementById("emoji-grid")?.textContent || "";
    expect(textInAll).toContain("invalid category sample");
  });
});
