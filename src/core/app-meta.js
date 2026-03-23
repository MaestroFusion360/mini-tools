import { byId } from "./dom.js";
import { getLanguage, registerTranslationApplier } from "./i18n.js";

const APP_META_URL = "./src/data/app-meta.json";

const appMetaState = {
  initialized: false,
  loaded: false,
  loadingPromise: null,
  data: null,
};

export function getLocalizedMetaValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  const lang = getLanguage() === "ru" ? "ru" : "en";
  return String(value?.[lang] || value?.en || "").trim();
}

export function getAppMeta() {
  return appMetaState.data || {};
}

function renderAppMeta() {
  const data = getAppMeta();
  const appName = getLocalizedMetaValue(data?.appName) || "Mini tools";
  const shortName = getLocalizedMetaValue(data?.shortName) || appName;
  const icon = String(data?.icon || "assets/icon.svg").trim();

  const overflowTitle = byId("overflow-menu-title");
  if (overflowTitle) overflowTitle.textContent = shortName;

  const overflowIcon = byId("overflow-menu-title-icon");
  if (overflowIcon && icon) {
    overflowIcon.setAttribute("src", icon);
    overflowIcon.setAttribute("alt", "");
    overflowIcon.setAttribute("aria-hidden", "true");
  }

  if (typeof document !== "undefined") {
    document.title = appName;
  }

  const footer = byId("app-footer-text");
  if (footer) {
    const footerData = data?.footer || {};
    const year = Number.isFinite(Number(footerData?.year))
      ? Number(footerData.year)
      : new Date().getFullYear();
    const owner = String(
      footerData?.owner || data?.author?.name || "MaestroFusion360",
    );
    const version = String(data?.version || "").trim();
    footer.textContent = `© ${year} ${owner}${version ? ` · v${version}` : ""}`;
  }
}

async function loadAppMeta() {
  if (appMetaState.loaded) return;
  if (appMetaState.loadingPromise) return appMetaState.loadingPromise;

  appMetaState.loadingPromise = fetch(APP_META_URL, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load app meta: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      appMetaState.data = data && typeof data === "object" ? data : {};
      appMetaState.loaded = true;
    })
    .catch((error) => {
      console.error(error);
      appMetaState.data = {};
      appMetaState.loaded = true;
    })
    .finally(() => {
      appMetaState.loadingPromise = null;
    });

  return appMetaState.loadingPromise;
}

export async function initAppMeta() {
  if (!appMetaState.initialized) {
    registerTranslationApplier(renderAppMeta);
    appMetaState.initialized = true;
  }
  await loadAppMeta();
  renderAppMeta();
}
