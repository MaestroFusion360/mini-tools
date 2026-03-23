import { byId, showAppToast } from "./dom.js";
import { registerTranslationApplier, t } from "./i18n.js";
import { STORAGE_KEYS, getStoredJson, setStoredJson } from "./state.js";

const EXPORT_TYPE = "mini-tools-user-data";
const EXPORT_VERSION = 1;

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getBackupPayload() {
  return {
    type: EXPORT_TYPE,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      todoNotes: getStoredJson(STORAGE_KEYS.todoNotesData, null),
      rssNews: getStoredJson(STORAGE_KEYS.rssNewsData, null),
      weatherFavorites: getStoredJson(STORAGE_KEYS.weatherFavorites, []),
      budget: getStoredJson(STORAGE_KEYS.budgetData, null),
      calculator: getStoredJson(STORAGE_KEYS.calculatorData, null),
      converterPresets: getStoredJson(STORAGE_KEYS.converterPresets, null),
      currencyPresets: getStoredJson(STORAGE_KEYS.currencyPresets, null),
    },
  };
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parseImportPayload(raw) {
  if (!isObject(raw)) return null;

  const data = isObject(raw.data) ? raw.data : raw;
  if (!isObject(data)) return null;

  const result = {};
  const todoNotes = data.todoNotes ?? data[STORAGE_KEYS.todoNotesData];
  const rssNews = data.rssNews ?? data[STORAGE_KEYS.rssNewsData];
  const weatherFavorites =
    data.weatherFavorites ?? data[STORAGE_KEYS.weatherFavorites];
  const budget = data.budget ?? data[STORAGE_KEYS.budgetData];
  const calculator = data.calculator ?? data[STORAGE_KEYS.calculatorData];
  const converterPresets =
    data.converterPresets ?? data[STORAGE_KEYS.converterPresets];
  const currencyPresets =
    data.currencyPresets ?? data[STORAGE_KEYS.currencyPresets];

  if (isObject(todoNotes)) result.todoNotes = todoNotes;
  if (isObject(rssNews)) result.rssNews = rssNews;
  if (Array.isArray(weatherFavorites)) result.weatherFavorites = weatherFavorites;
  if (isObject(budget)) result.budget = budget;
  if (isObject(calculator)) result.calculator = calculator;
  if (isObject(converterPresets)) result.converterPresets = converterPresets;
  if (Array.isArray(currencyPresets)) result.currencyPresets = currencyPresets;

  return Object.keys(result).length ? result : null;
}

function applyImportedPayload(payload) {
  let updatedCount = 0;
  if (payload.todoNotes) {
    setStoredJson(STORAGE_KEYS.todoNotesData, payload.todoNotes);
    updatedCount += 1;
  }
  if (payload.rssNews) {
    setStoredJson(STORAGE_KEYS.rssNewsData, payload.rssNews);
    updatedCount += 1;
  }
  if (payload.weatherFavorites) {
    setStoredJson(STORAGE_KEYS.weatherFavorites, payload.weatherFavorites);
    updatedCount += 1;
  }
  if (payload.budget) {
    setStoredJson(STORAGE_KEYS.budgetData, payload.budget);
    updatedCount += 1;
  }
  if (payload.calculator) {
    setStoredJson(STORAGE_KEYS.calculatorData, payload.calculator);
    updatedCount += 1;
  }
  if (payload.converterPresets) {
    setStoredJson(STORAGE_KEYS.converterPresets, payload.converterPresets);
    updatedCount += 1;
  }
  if (payload.currencyPresets) {
    setStoredJson(STORAGE_KEYS.currencyPresets, payload.currencyPresets);
    updatedCount += 1;
  }
  return updatedCount;
}

function getDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function applyUserDataTransferTranslations() {
  const title = byId("overflow-settings-title");
  if (title) title.textContent = t("settings");

  const exportLabel = byId("settings-export-label");
  if (exportLabel) exportLabel.textContent = t("settingsExport");

  const importLabel = byId("settings-import-label");
  if (importLabel) importLabel.textContent = t("settingsImport");

  const exportBtn = byId("settings-export-btn");
  if (exportBtn) {
    exportBtn.title = t("settingsExport");
    exportBtn.setAttribute("aria-label", t("settingsExport"));
  }

  const importBtn = byId("settings-import-btn");
  if (importBtn) {
    importBtn.title = t("settingsImport");
    importBtn.setAttribute("aria-label", t("settingsImport"));
  }
}

export function exportUserData() {
  const payload = getBackupPayload();
  const text = JSON.stringify(payload, null, 2);
  downloadTextFile(`mini-tools-backup-${getDateStamp()}.json`, text);
  showAppToast(t("settingsExportDone"));
}

export function importUserData() {
  byId("settings-import-input")?.click();
}

export async function handleUserDataImportFile(event) {
  const input = event?.target;
  const file = input?.files?.[0];
  if (!file) return;

  try {
    const rawText = await file.text();
    const parsed = JSON.parse(rawText);
    const payload = parseImportPayload(parsed);
    if (!payload) {
      showAppToast(t("settingsImportInvalid"));
      return;
    }

    const updatedCount = applyImportedPayload(payload);
    if (!updatedCount) {
      showAppToast(t("settingsImportInvalid"));
      return;
    }

    showAppToast(t("settingsImportDone"), 2200);
    window.setTimeout(() => {
      window.location.reload();
    }, 260);
  } catch {
    showAppToast(t("settingsImportInvalid"));
  } finally {
    if (input) input.value = "";
  }
}

export function initUserDataTransfer() {
  registerTranslationApplier(applyUserDataTransferTranslations);
}
