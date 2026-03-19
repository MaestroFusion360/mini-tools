import { queryAll } from "./dom.js";
import { t } from "./i18n.js";
import { STORAGE_KEYS, getStored, setStored } from "./state.js";

export function showPage(id) {
  const nextPage = document.getElementById(id);
  if (!nextPage) return;

  queryAll(".page").forEach((p) => p.classList.remove("active"));
  nextPage.classList.add("active");
  setStored(STORAGE_KEYS.lastPage, id);
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
}
