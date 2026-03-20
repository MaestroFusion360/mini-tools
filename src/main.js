import {
  initCalendar,
  calcDateDiff,
  changeCalendarMonth,
  goToCurrentMonth,
  setCalendarPickMode,
  toggleCalendarWeekStart,
  setDateYear,
  swapDates,
  syncYearSelectWithDate,
} from "./features/calendar.js";
import {
  calcBackspace,
  calcClear,
  calcEquals,
  calcFunction,
  calcInput,
  calcMemoryAdd,
  calcMemoryClear,
  calcMemoryRecall,
  calcMemorySubtract,
  calcRemoveHistoryAt,
  calcToggleSign,
  initCalculator,
  toggleCalcMode,
} from "./features/calculator.js";
import {
  convertUnit,
  initConverter,
  swapConvUnits,
  updateConvUnits,
} from "./features/converter.js";
import {
  convertCurrency,
  initCurrency,
  loadRates,
  swapCurrencyUnits,
} from "./features/currency.js";
import { applyTranslations, initI18n, toggleLanguage } from "./core/i18n.js";
import { exitApp, initNavigation, showPage } from "./core/navigation.js";
import { initPwa } from "./core/pwa.js";
import {
  initStopwatch,
  toggleStopwatch,
  addStopwatchLap,
  resetStopwatch,
} from "./features/stopwatch.js";
import {
  initTextTools,
  analyzeText,
  copyTextTool,
  saveTextToFile,
  findNextInEditor,
  findTextInEditor,
  normalizeSpacesAction,
  replaceAllInEditor,
  removeEmptyLinesAction,
  toLowerCaseText,
  toSentenceCaseText,
  toTitleCaseText,
  toUpperCaseText,
  trimTextAction,
} from "./features/text-tools.js";
import { initTheme, toggleTheme } from "./core/theme.js";
import {
  initTimer,
  resetTimer,
  syncTimerFromInputs,
  toggleTimer,
} from "./features/timer.js";
import {
  addCurrentCoordinateToFavorites,
  applyManualCoordinates,
  initWeatherModule,
  removeFavoriteCoordinateDialog,
  toggleWeatherManualMode,
} from "./features/weather.js";
import {
  initWorldTime,
  toggleTimeFormat,
  updateWorldTime,
} from "./features/world-time.js";

function exposeGlobals() {
  Object.assign(window, {
    toggleTheme,
    toggleLanguage,
    showPage,
    exitApp,
    toggleWeatherManualMode,
    applyManualCoordinates,
    addCurrentCoordinateToFavorites,
    removeFavoriteCoordinateDialog,
    toggleTimeFormat,
    updateWorldTime,
    syncTimerFromInputs,
    toggleTimer,
    resetTimer,
    toggleStopwatch,
    addStopwatchLap,
    resetStopwatch,
    changeCalendarMonth,
    goToCurrentMonth,
    setCalendarPickMode,
    toggleCalendarWeekStart,
    calcDateDiff,
    syncYearSelectWithDate,
    setDateYear,
    swapDates,
    updateConvUnits,
    convertUnit,
    swapConvUnits,
    toggleCalcMode,
    calcBackspace,
    calcInput,
    calcClear,
    calcFunction,
    calcEquals,
    calcMemoryClear,
    calcMemoryRecall,
    calcMemoryAdd,
    calcMemorySubtract,
    calcRemoveHistoryAt,
    calcToggleSign,
    analyzeText,
    copyTextTool,
    saveTextToFile,
    findTextInEditor,
    findNextInEditor,
    replaceAllInEditor,
    toUpperCaseText,
    toLowerCaseText,
    toTitleCaseText,
    toSentenceCaseText,
    trimTextAction,
    normalizeSpacesAction,
    removeEmptyLinesAction,
    loadRates,
    swapCurrencyUnits,
    convertCurrency,
  });
}

async function loadAppTemplate() {
  const appRoot = document.getElementById("app-root");
  if (!appRoot) throw new Error("Missing #app-root container");

  const response = await fetch("./src/app.html", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load app template: ${response.status}`);
  }

  appRoot.innerHTML = await response.text();
}

async function initApp() {
  await loadAppTemplate();
  initTheme();
  await initI18n();
  exposeGlobals();

  initNavigation();
  initWeatherModule();
  initWorldTime();
  initTimer();
  initStopwatch();
  initCalendar();
  initConverter();
  initCalculator();
  initTextTools();
  initCurrency();
  initPwa();

  applyTranslations();
}

window.addEventListener("load", () => {
  initApp().catch((err) => {
    console.error("App initialization failed:", err);
  });
});
