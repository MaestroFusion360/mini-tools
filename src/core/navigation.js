import { queryAll } from "./dom.js";
import { t } from "./i18n.js";
import { STORAGE_KEYS, getStored, setStored } from "./state.js";

function getOverflowElements() {
  return {
    menu: document.getElementById("overflow-menu"),
    toggleBtn: document.getElementById("overflow-menu-btn"),
    aboutModal: document.getElementById("about-modal"),
  };
}

function setOverflowExpanded(expanded) {
  const { menu, toggleBtn } = getOverflowElements();
  if (menu) menu.classList.toggle("is-hidden", !expanded);
  if (toggleBtn) toggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
}

export function closeOverflowMenu() {
  setOverflowExpanded(false);
}

export function toggleOverflowMenu(event) {
  event?.stopPropagation?.();
  const { menu } = getOverflowElements();
  if (!menu) return;
  setOverflowExpanded(menu.classList.contains("is-hidden"));
}

export function openAboutDialog() {
  const { aboutModal } = getOverflowElements();
  closeOverflowMenu();
  if (!aboutModal) return;
  aboutModal.classList.remove("is-hidden");
}

export function closeAboutDialog() {
  const { aboutModal } = getOverflowElements();
  if (!aboutModal) return;
  aboutModal.classList.add("is-hidden");
}

export function showPage(id) {
  const nextPage = document.getElementById(id);
  if (!nextPage) return;

  queryAll(".page").forEach((p) => p.classList.remove("active"));
  nextPage.classList.add("active");
  setStored(STORAGE_KEYS.lastPage, id);
  closeOverflowMenu();
  closeAboutDialog();
}

export function loadLastPage() {
  const lastPage = getStored(STORAGE_KEYS.lastPage, "");
  if (lastPage && document.getElementById(lastPage)) showPage(lastPage);
}

export function exitApp() {
  if (confirm(t("closeAppConfirm"))) window.close();
}

export function initNavigation() {
  loadLastPage();

  document.addEventListener("click", (event) => {
    const { menu, toggleBtn, aboutModal } = getOverflowElements();
    const target = event.target;
    if (menu && toggleBtn) {
      const insideMenu = menu.contains(target);
      const pressedToggle = toggleBtn.contains(target);
      if (!insideMenu && !pressedToggle) closeOverflowMenu();
    }
    if (
      aboutModal &&
      !aboutModal.classList.contains("is-hidden") &&
      target === aboutModal
    ) {
      closeAboutDialog();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeOverflowMenu();
      closeAboutDialog();
    }
  });
}
