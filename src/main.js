import {
  initCalendar,
  calcDateDiff,
  changeCalendarMonth,
  goToCurrentMonth,
  setCalendarPickMode,
  toggleCalendarWeekStart,
  setDateYear,
  onCalendarDateInputChange,
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
import {
  initMediaPlayer,
  mediaClearPlaylist,
  mediaNext,
  mediaOpenFilesDialog,
  mediaPlaySelected,
  mediaPrev,
} from "./features/media-player.js";
import {
  addTodoItem,
  addTodoNote,
  clearCompletedTodo,
  clearTodoSearch,
  initTodoNotes,
  onTodoInputKeydown,
  onTodoNotesInput,
  onTodoNotesSave,
  onTodoNotesInputKeydown,
  removeTodoNote,
  todoNoteEditorAction,
  setTodoSearch,
  setTodoVisibility,
  setTodoTab,
  toggleTodoItem,
} from "./features/todo-notes.js";
import {
  addRssFeed,
  exportRssFeeds,
  handleRssImportFile,
  initRssNews,
  importRssFeeds,
  loadRssFeed,
  onRssFeedChange,
  onRssViewModeChange,
  markAllRssRead,
  removeRssFeed,
} from "./features/rss-news.js";
import {
  initPaint,
  paintApplyFilters,
  paintApplyCrop,
  paintCopySelection,
  paintApplyMirror,
  paintApplyResize,
  paintApplyRotate,
  paintClearCanvas,
  paintPasteClipboard,
  paintOpenFileDialog,
  paintResetFilters,
  paintSelectShape,
  paintSetTool,
  paintToggleTextBold,
  paintToggleTextItalic,
  paintToggleFontPanel,
  paintToggleGrid,
  paintToggleSelectionTool,
  paintToggleFullscreen,
  paintTogglePanel,
  paintZoomIn,
  paintZoomOut,
  paintZoomReset,
  paintRedo,
  paintSaveImage,
  paintUndo,
} from "./features/paint.js";
import { applyTranslations, initI18n, toggleLanguage } from "./core/i18n.js";
import { initChangelog } from "./core/changelog.js";
import { initAppMeta } from "./core/app-meta.js";
import { initAbout } from "./core/about.js";
import {
  closeAboutDialog,
  closeOverflowMenu,
  exitApp,
  initNavigation,
  openAboutDialog,
  showPage,
  toggleOverflowMenu,
} from "./core/navigation.js";
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
  replaceInEditor,
  replaceAllInEditor,
  removeEmptyLinesAction,
  toggleTextInputFullscreen,
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
import {
  clearQrCode,
  downloadQrCode,
  generateQrCode,
  initQrGenerator,
} from "./features/qr-generator.js";
import {
  clearEmojiSearch,
  filterEmojiCatalog,
  initEmojiCatalog,
} from "./features/emoji-catalog.js";
import {
  addBudgetEntry,
  clearBudgetEntries,
  clearBudgetForm,
  initBudget,
  onBudgetTypeChange,
  saveBudgetLimit,
  setBudgetCurrency,
  setBudgetFilter,
} from "./features/budget.js";

function exposeGlobals() {
  Object.assign(window, {
    toggleTheme,
    toggleLanguage,
    showPage,
    toggleOverflowMenu,
    closeOverflowMenu,
    openAboutDialog,
    closeAboutDialog,
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
    onCalendarDateInputChange,
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
    replaceInEditor,
    replaceAllInEditor,
    toUpperCaseText,
    toLowerCaseText,
    toTitleCaseText,
    toSentenceCaseText,
    trimTextAction,
    normalizeSpacesAction,
    removeEmptyLinesAction,
    toggleTextInputFullscreen,
    loadRates,
    swapCurrencyUnits,
    convertCurrency,
    paintOpenFileDialog,
    paintToggleFullscreen,
    paintTogglePanel,
    paintApplyFilters,
    paintResetFilters,
    paintSelectShape,
    paintSetTool,
    paintToggleTextBold,
    paintToggleTextItalic,
    paintToggleFontPanel,
    paintZoomIn,
    paintZoomOut,
    paintZoomReset,
    paintToggleGrid,
    paintToggleSelectionTool,
    paintCopySelection,
    paintPasteClipboard,
    paintSaveImage,
    paintUndo,
    paintRedo,
    paintClearCanvas,
    paintApplyCrop,
    paintApplyResize,
    paintApplyRotate,
    paintApplyMirror,
    mediaOpenFilesDialog,
    mediaPlaySelected,
    mediaPrev,
    mediaNext,
    mediaClearPlaylist,
    addTodoItem,
    addTodoNote,
    clearCompletedTodo,
    clearTodoSearch,
    onTodoInputKeydown,
    onTodoNotesInput,
    onTodoNotesSave,
    onTodoNotesInputKeydown,
    removeTodoNote,
    todoNoteEditorAction,
    setTodoSearch,
    setTodoVisibility,
    setTodoTab,
    toggleTodoItem,
    addRssFeed,
    removeRssFeed,
    loadRssFeed,
    onRssFeedChange,
    onRssViewModeChange,
    markAllRssRead,
    exportRssFeeds,
    importRssFeeds,
    handleRssImportFile,
    generateQrCode,
    clearQrCode,
    downloadQrCode,
    filterEmojiCatalog,
    clearEmojiSearch,
    saveBudgetLimit,
    setBudgetCurrency,
    onBudgetTypeChange,
    addBudgetEntry,
    clearBudgetForm,
    setBudgetFilter,
    clearBudgetEntries,
  });
}

async function loadAppTemplate() {
  const appRoot = document.getElementById("app-root");
  if (!appRoot) throw new Error("Missing #app-root container");

  const [iconsResponse, appResponse] = await Promise.all([
    fetch("./src/icons.html", { cache: "no-store" }),
    fetch("./src/app.html", { cache: "no-store" }),
  ]);
  if (!iconsResponse.ok) {
    throw new Error(`Failed to load icons template: ${iconsResponse.status}`);
  }
  if (!appResponse.ok) {
    throw new Error(`Failed to load app template: ${appResponse.status}`);
  }
  const [iconsHtml, appHtml] = await Promise.all([
    iconsResponse.text(),
    appResponse.text(),
  ]);
  appRoot.innerHTML = `${iconsHtml}\n${appHtml}`;
}

async function initApp() {
  await loadAppTemplate();
  initTheme();
  await initI18n();
  await initAppMeta();
  await initChangelog();
  initAbout();
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
  initPaint();
  initMediaPlayer();
  initTodoNotes();
  initRssNews();
  initQrGenerator();
  await initEmojiCatalog();
  initBudget();
  initPwa();

  applyTranslations();
}

window.addEventListener("load", () => {
  initApp().catch((err) => {
    console.error("App initialization failed:", err);
  });
});
