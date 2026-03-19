import { initCalendar, calcDateDiff, changeCalendarMonth, goToCurrentMonth, setCalendarPickMode, setDateYear, swapDates, syncYearSelectWithDate } from './calendar.js';
import { calcBackspace, calcClear, calcEquals, calcFunction, calcInput, initCalculator, toggleCalcMode } from './calculator.js';
import { convertUnit, initConverter, swapConvUnits, updateConvUnits } from './converter.js';
import { convertCurrency, initCurrency, loadRates, swapCurrencyUnits } from './currency.js';
import { applyTranslations, initI18n, toggleLanguage } from './i18n.js';
import { exitApp, initNavigation, showPage } from './navigation.js';
import { initPwa } from './pwa.js';
import { initStopwatch, toggleStopwatch, addStopwatchLap, resetStopwatch } from './stopwatch.js';
import { initTextTools, analyzeText, copyTextTool, normalizeSpacesAction, removeEmptyLinesAction, toLowerCaseText, toSentenceCaseText, toTitleCaseText, toUpperCaseText, trimTextAction } from './text-tools.js';
import { initTheme, toggleTheme } from './theme.js';
import { initTimer, resetTimer, syncTimerFromInputs, toggleTimer } from './timer.js';
import { addCurrentCoordinateToFavorites, applyManualCoordinates, initWeatherModule, removeFavoriteCoordinateDialog, toggleWeatherManualMode } from './weather.js';
import { initWorldTime, toggleTimeFormat, updateWorldTime } from './world-time.js';

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
        analyzeText,
        copyTextTool,
        toUpperCaseText,
        toLowerCaseText,
        toTitleCaseText,
        toSentenceCaseText,
        trimTextAction,
        normalizeSpacesAction,
        removeEmptyLinesAction,
        loadRates,
        swapCurrencyUnits,
        convertCurrency
    });
}

async function initApp() {
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

window.addEventListener('load', () => {
    initApp().catch(err => {
        console.error('App initialization failed:', err);
    });
});
