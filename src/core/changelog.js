import { byId } from "./dom.js";
import { getLanguage, registerTranslationApplier } from "./i18n.js";
import { getAppMeta } from "./app-meta.js";

const CHANGELOG_URL = "./src/data/changelog.json";

const changelogState = {
  initialized: false,
  loaded: false,
  loadingPromise: null,
  entries: [],
};

function getLocalizedEntry(entry) {
  const lang = getLanguage() === "ru" ? "ru" : "en";
  return String(entry?.[lang] || entry?.en || "").trim();
}

function renderChangelog() {
  const title = byId("overflow-changelog-title");
  const list = byId("overflow-changelog-list");
  if (!title || !list) return;

  const versionText = String(getAppMeta()?.version || "").trim();
  title.textContent = versionText ? `CHANGELOG v${versionText}` : "CHANGELOG";

  if (
    !Array.isArray(changelogState.entries) ||
    changelogState.entries.length === 0
  ) {
    list.innerHTML = "";
    return;
  }

  const fragment = document.createDocumentFragment();
  changelogState.entries.forEach((entry) => {
    const text = getLocalizedEntry(entry);
    if (!text) return;
    const li = document.createElement("li");
    li.textContent = text;
    fragment.append(li);
  });
  list.replaceChildren(fragment);
}

async function loadChangelog() {
  if (changelogState.loaded) return;
  if (changelogState.loadingPromise) return changelogState.loadingPromise;

  changelogState.loadingPromise = fetch(CHANGELOG_URL, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load changelog: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      changelogState.entries = Array.isArray(data?.entries) ? data.entries : [];
      changelogState.loaded = true;
    })
    .catch((error) => {
      console.error(error);
      changelogState.entries = [];
      changelogState.loaded = true;
    })
    .finally(() => {
      changelogState.loadingPromise = null;
    });

  return changelogState.loadingPromise;
}

export async function initChangelog() {
  if (!changelogState.initialized) {
    registerTranslationApplier(renderChangelog);
    changelogState.initialized = true;
  }
  await loadChangelog();
  renderChangelog();
}
