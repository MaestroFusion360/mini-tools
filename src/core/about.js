import { byId } from "./dom.js";
import { registerTranslationApplier } from "./i18n.js";
import { getAppMeta, getLocalizedMetaValue } from "./app-meta.js";

const aboutState = {
  initialized: false,
};

function renderAbout() {
  const appIcon = byId("about-app-icon");
  const appName = byId("about-app-name");
  const description = byId("about-description");
  const author = byId("about-author");
  const linksRow = byId("about-links-row");
  if (!appName || !description || !author || !linksRow) return;

  const data = getAppMeta();
  const iconPath = String(data?.icon || "assets/icon.svg").trim();
  if (appIcon) {
    if (iconPath) appIcon.setAttribute("src", iconPath);
    appIcon.setAttribute("alt", "");
    appIcon.setAttribute("aria-hidden", "true");
  }
  appName.textContent = getLocalizedMetaValue(data?.appName) || "Mini tools";
  description.textContent = getLocalizedMetaValue(data?.description);
  author.textContent = getLocalizedMetaValue(data?.author?.label);

  const links = Array.isArray(data?.links) ? data.links : [];
  const fragment = document.createDocumentFragment();
  links.forEach((item) => {
    const href = String(item?.href || "").trim();
    if (!href) return;

    const link = document.createElement("a");
    link.className = "text-action-btn overflow-menu-item";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const iconName = String(item?.icon || "").trim();
    if (iconName) {
      const icon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      icon.setAttribute("class", "icon-svg btn-icon");
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", `#${iconName}`);
      icon.append(use);
      link.append(icon);
    }

    const label = document.createElement("span");
    label.textContent = getLocalizedMetaValue(item?.label);
    link.append(label);
    fragment.append(link);
  });

  linksRow.replaceChildren(fragment);
}

export function initAbout() {
  if (!aboutState.initialized) {
    registerTranslationApplier(renderAbout);
    aboutState.initialized = true;
  }
  renderAbout();
}
