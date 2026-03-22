export const STORAGE_KEYS = {
  theme: "theme",
  lang: "lang",
  lastPage: "lastPage",
  timeFormat: "timeFormat",
  worldTimeSaved: "worldTimeSaved",
  weatherMode: "weatherManualMode",
  weatherManualLat: "weatherManualLat",
  weatherManualLon: "weatherManualLon",
  weatherFavorites: "weatherFavorites",
};

export const FEATURE_RUNTIME_STATE = {
  calculator: {
    calcVal: "0",
    calcScientificMode: false,
    calcMemoryValue: 0,
    calcInitialized: false,
    calcHistory: [],
  },
  calendar: {
    dateDiffIntervalId: null,
    calendarViewDate: new Date(),
    calendarInitialized: false,
    calendarPickMode: "date1",
    calendarPickModeTouched: false,
    calendarPickPending: false,
    calendarWeekStartsMonday: true,
  },
  currency: {
    rates: { USD: 1, EUR: 0.92, RUB: 92.5, GBP: 0.79, JPY: 151.5 },
    ratesSourceText: "",
    ratesUsingBuiltIn: true,
  },
  mediaPlayer: {
    items: [],
    index: -1,
    initialized: false,
  },
  paint: {
    drawing: false,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    splineLastMidX: 0,
    splineLastMidY: 0,
    splineLastX: 0,
    splineLastY: 0,
    splineStage: 0,
    splineEndX: 0,
    splineEndY: 0,
    splineBaseImageData: null,
    undoStack: [],
    redoStack: [],
    nextMirrorAxis: "horizontal",
    activePanel: "",
    canvasReady: false,
    activeTool: "brush",
    showFontPanel: false,
    selectionMode: false,
    selecting: false,
    selection: null,
    shapeTool: "",
    shapeBaseImageData: null,
    filterBaseImageData: null,
    zoom: 1,
    showGrid: false,
    clipboardSnapshot: "",
    clipboardMeta: null,
    fullscreen: false,
    textBold: false,
    textItalic: false,
    autoSizedToViewport: false,
  },
  stopwatch: {
    stopwatchRunning: false,
    stopwatchStartAtMs: 0,
    stopwatchElapsedMs: 0,
    stopwatchIntervalId: null,
    stopwatchLaps: [],
  },
  textEditor: {
    textCopyFeedbackTimer: null,
    textFindState: {
      query: "",
      sourceText: "",
      optionsKey: "",
      matches: [],
      activeIndex: -1,
    },
  },
  timer: {
    timerRemainingSeconds: 60,
    timerIntervalId: null,
    timerRunning: false,
    timerEndAtMs: 0,
    timerHasStarted: false,
    timerFinished: false,
  },
  weather: {
    weatherCurrentCoords: null,
    weatherUsingApiSource: false,
    weatherSourceText: "",
  },
  worldTime: {
    time24h: true,
    worldTimeIntervalId: null,
  },
};

export function getStored(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function setStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function getStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
