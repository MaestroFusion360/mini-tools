import { byId, setLabelText, setText } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";
import { getLocale } from "../core/utils.js";

const CALENDAR_START_YEAR = 1970;
const CALENDAR_END_YEAR = 2100;
const DATE_DIFF_SYNC_INTERVAL_MS = 60000;
const DAY_MS = 24 * 60 * 60 * 1000;

const calendarState = FEATURE_RUNTIME_STATE.calendar;

const IDS = {
  monthTitle: "calendar-month-year",
  daysGrid: "calendar-days",
  weekStartToggle: "calendar-week-start-monday",
  dateUseNow: "date-use-now",
  dateInclusive: "date-inclusive",
  dateDiff: "date-diff",
  calcButton: "calendar-calc-btn",
  prevBtn: "calendar-prev-btn",
  nextBtn: "calendar-next-btn",
  swapBtn: "calendar-swap-btn",
};

const DATE_FIELDS = {
  date1: {
    date: "date1",
    year: "date1-year",
    hour: "time1h",
    minute: "time1m",
  },
  date2: {
    date: "date2",
    year: "date2-year",
    hour: "time2h",
    minute: "time2m",
  },
};

function ensureCalendarState() {
  const isValidDate =
    calendarState.calendarViewDate instanceof Date &&
    Number.isFinite(calendarState.calendarViewDate.getTime());
  if (!isValidDate) {
    calendarState.calendarViewDate = new Date();
    calendarState.calendarViewDate.setDate(1);
  }
  if (typeof calendarState.calendarWeekStartsMonday !== "boolean") {
    calendarState.calendarWeekStartsMonday = true;
  }
  if (!["date1", "date2"].includes(calendarState.calendarPickMode)) {
    calendarState.calendarPickMode = "date1";
  }
  if (typeof calendarState.calendarInitialized !== "boolean") {
    calendarState.calendarInitialized = false;
  }
}

function el(id) {
  return byId(id);
}

function formatDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateValue(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function parseDateInputValue(dateId) {
  return parseDateValue(el(dateId)?.value);
}

function getDateOnlyFromInput(dateId) {
  const parsed = parseDateInputValue(dateId);
  if (!parsed) return null;
  return new Date(parsed.year, parsed.month - 1, parsed.day);
}

function getCalendarWeekdayLabels() {
  const formatter = new Intl.DateTimeFormat(getLocale(), { weekday: "short" });
  const baseDate = calendarState.calendarWeekStartsMonday
    ? new Date(2024, 0, 1)
    : new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(baseDate);
    current.setDate(baseDate.getDate() + index);
    return formatter.format(current);
  });
}

function syncCalendarWeekStartSetting() {
  const checkbox = el(IDS.weekStartToggle);
  calendarState.calendarWeekStartsMonday = checkbox ? checkbox.checked : true;
}

export function toggleCalendarWeekStart() {
  syncCalendarWeekStartSetting();
  renderCalendar();
}

export function setCalendarPickMode(mode) {
  if (!["date1", "date2"].includes(mode)) return;
  calendarState.calendarPickMode = mode;
}

function buildCalendarModel() {
  const now = new Date();
  const year = calendarState.calendarViewDate.getFullYear();
  const month = calendarState.calendarViewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekdayRaw = firstDay.getDay();
  const leadingEmpty = calendarState.calendarWeekStartsMonday
    ? (startWeekdayRaw + 6) % 7
    : startWeekdayRaw;
  const totalDays = daysInMonth(year, month);

  const d1Selected = getDateOnlyFromInput(DATE_FIELDS.date1.date);
  const d2Selected = getDateOnlyFromInput(DATE_FIELDS.date2.date);
  const hasBoth = Boolean(d1Selected && d2Selected);
  const rangeStart = hasBoth
    ? d1Selected <= d2Selected
      ? d1Selected
      : d2Selected
    : null;
  const rangeEnd = hasBoth
    ? d1Selected <= d2Selected
      ? d2Selected
      : d1Selected
    : null;

  const days = [];
  for (let day = 1; day <= totalDays; day += 1) {
    const dayDate = new Date(year, month, day);
    const isoDate = formatDateInputValue(dayDate);
    const classes = ["calendar-day", "calendar-day-clickable"];
    if (dayDate.toDateString() === now.toDateString()) classes.push("today");
    if (d1Selected && dayDate.toDateString() === d1Selected.toDateString()) {
      classes.push("selected-start");
    }
    if (d2Selected && dayDate.toDateString() === d2Selected.toDateString()) {
      classes.push("selected-end");
    }
    if (rangeStart && rangeEnd && dayDate > rangeStart && dayDate < rangeEnd) {
      classes.push("in-range");
    }
    days.push({ day, isoDate, classes: classes.join(" ") });
  }

  return {
    monthTitle: calendarState.calendarViewDate.toLocaleDateString(getLocale(), {
      month: "long",
      year: "numeric",
    }),
    weekdayLabels: getCalendarWeekdayLabels(),
    leadingEmpty,
    days,
  };
}

function renderCalendarHtml(model) {
  let html = "";
  model.weekdayLabels.forEach((label) => {
    html += `<div class="calendar-day weekday">${label}</div>`;
  });
  for (let i = 0; i < model.leadingEmpty; i += 1) {
    html += '<div class="calendar-day empty"></div>';
  }
  model.days.forEach((item) => {
    html += `<div class="${item.classes}" data-calendar-date="${item.isoDate}">${item.day}</div>`;
  });
  return html;
}

export function renderCalendar() {
  const monthTitleEl = el(IDS.monthTitle);
  const daysGridEl = el(IDS.daysGrid);
  if (!monthTitleEl || !daysGridEl) return;
  const model = buildCalendarModel();
  monthTitleEl.textContent = model.monthTitle;
  daysGridEl.innerHTML = renderCalendarHtml(model);
}

function applyCalendarDatePick(dateValue) {
  if (!dateValue) return;
  if (
    calendarState.calendarPickMode === "date1" &&
    el(IDS.dateUseNow)?.checked
  ) {
    const useNowToggle = el(IDS.dateUseNow);
    if (useNowToggle) useNowToggle.checked = false;
    syncBaseDateWithNow();
  }
  const target = DATE_FIELDS[calendarState.calendarPickMode];
  if (!target) return;
  const targetInput = el(target.date);
  if (!targetInput) return;

  targetInput.value = dateValue;
  syncYearSelectWithDate(target.date, target.year);
  calcDateDiff();
  renderCalendar();
  setCalendarPickMode(
    calendarState.calendarPickMode === "date1" ? "date2" : "date1",
  );
}

function bindCalendarDayDelegation() {
  const daysGrid = el(IDS.daysGrid);
  if (!daysGrid || daysGrid.dataset.bound === "1") return;
  daysGrid.dataset.bound = "1";
  daysGrid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const cell = target.closest(".calendar-day-clickable");
    if (!(cell instanceof HTMLElement)) return;
    applyCalendarDatePick(cell.dataset.calendarDate || "");
  });
}

export function changeCalendarMonth(delta) {
  calendarState.calendarViewDate = new Date(
    calendarState.calendarViewDate.getFullYear(),
    calendarState.calendarViewDate.getMonth() + delta,
    1,
  );
  renderCalendar();
}

export function goToCurrentMonth() {
  calendarState.calendarViewDate = new Date();
  calendarState.calendarViewDate.setDate(1);
  renderCalendar();
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function fillYearSelect(selectId, selectedYear) {
  const select = el(selectId);
  if (!select) return;
  const selected = Number(selectedYear);
  let html = "";
  for (let y = CALENDAR_END_YEAR; y >= CALENDAR_START_YEAR; y -= 1) {
    html += `<option value="${y}"${y === selected ? " selected" : ""}>${y}</option>`;
  }
  select.innerHTML = html;
}

export function syncYearSelectWithDate(dateId, yearSelectId) {
  const parsed = parseDateInputValue(dateId);
  if (!parsed) return;
  fillYearSelect(yearSelectId, parsed.year);
}

export function onCalendarDateInputChange(dateId, yearSelectId) {
  syncYearSelectWithDate(dateId, yearSelectId);
  calcDateDiff();
  renderCalendar();
}

export function setDateYear(dateId, yearSelectId) {
  const dateInput = el(dateId);
  const yearSelect = el(yearSelectId);
  const parsed = parseDateInputValue(dateId);
  if (!dateInput || !yearSelect || !parsed) return;
  const nextYear = Number(yearSelect.value);
  const maxDay = daysInMonth(nextYear, parsed.month - 1);
  const nextDay = Math.min(parsed.day, maxDay);
  dateInput.value = `${nextYear}-${String(parsed.month).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
  syncYearSelectWithDate(dateId, yearSelectId);
  calcDateDiff();
  renderCalendar();
}

function initDateYearSelects() {
  const date2 = el(DATE_FIELDS.date2.date);
  if (date2 && (!date2.value || date2.value === "2025-12-31")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    date2.value = formatDateInputValue(tomorrow);
  }
  syncYearSelectWithDate(DATE_FIELDS.date1.date, DATE_FIELDS.date1.year);
  syncYearSelectWithDate(DATE_FIELDS.date2.date, DATE_FIELDS.date2.year);
}

function clampNumber(id, min, max) {
  const input = el(id);
  if (!input) return min;
  let value = Number(input.value);
  if (!Number.isFinite(value)) value = min;
  value = Math.max(min, Math.min(max, Math.floor(value)));
  input.value = String(value);
  return value;
}

function getDateTime(dateId, hourId, minuteId) {
  const parsed = parseDateInputValue(dateId);
  if (!parsed) return null;
  const h = clampNumber(hourId, 0, 23);
  const m = clampNumber(minuteId, 0, 59);
  return new Date(parsed.year, parsed.month - 1, parsed.day, h, m, 0, 0);
}

function diffYMD(start, end) {
  let y = end.getFullYear() - start.getFullYear();
  let m = end.getMonth() - start.getMonth();
  let d = end.getDate() - start.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { y, m, d };
}

function formatWeekday(date) {
  return date.toLocaleDateString(getLocale(), { weekday: "long" });
}

function formatTime(date) {
  return date.toLocaleTimeString(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildDateDiffModel() {
  const d1 = getDateTime(
    DATE_FIELDS.date1.date,
    DATE_FIELDS.date1.hour,
    DATE_FIELDS.date1.minute,
  );
  const d2 = getDateTime(
    DATE_FIELDS.date2.date,
    DATE_FIELDS.date2.hour,
    DATE_FIELDS.date2.minute,
  );
  if (!d1 || !d2) return null;

  const inclusive = Boolean(el(IDS.dateInclusive)?.checked);
  const ms = Math.abs(d2 - d1) + (inclusive ? DAY_MS : 0);
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(ms / DAY_MS);
  const weeks = Math.floor(days / 7);
  const remDays = days % 7;
  const hours = Math.floor((ms % DAY_MS) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const start = d1 < d2 ? d1 : d2;
  const end = d1 < d2 ? d2 : d1;
  const startDateOnly = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endDateOnly = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  );
  // Inclusive mode should affect both elapsed totals and calendar Y/M/D breakdown.
  if (inclusive) {
    endDateOnly.setDate(endDateOnly.getDate() + 1);
  }
  const ymd = diffYMD(startDateOnly, endDateOnly);
  const relation = d2 >= d1 ? t("relationForward") : t("relationReverse");

  return {
    d1,
    d2,
    days,
    weeks,
    remDays,
    hours,
    minutes,
    ymd,
    relation,
    totalMinutes,
  };
}

function renderDateDiff(model) {
  const result = el(IDS.dateDiff);
  if (!result) return;
  if (!model) {
    result.textContent = "--";
    return;
  }
  const lines = [
    `${model.days} ${t("dayShort")} ${model.hours} ${t("hourShort")} ${model.minutes} ${t("minShort")}`,
    `${model.weeks} ${t("weekShort")} ${model.remDays} ${t("dayShort")}`,
    `${model.ymd.y} ${t("yearShort")} ${model.ymd.m} ${t("monthShort")} ${model.ymd.d} ${t("dayShort")}`,
    `${formatWeekday(model.d1)} ${formatTime(model.d1)} -> ${formatWeekday(model.d2)} ${formatTime(model.d2)}`,
    model.relation,
    `${t("totalMinutes")}: ${model.totalMinutes.toLocaleString(getLocale())}`,
  ];
  result.innerHTML = lines.join("<br>");
}

function swapInputValues(idA, idB) {
  const a = el(idA);
  const b = el(idB);
  if (!a || !b) return;
  [a.value, b.value] = [b.value, a.value];
}

export function swapDates() {
  [
    [DATE_FIELDS.date1.date, DATE_FIELDS.date2.date],
    [DATE_FIELDS.date1.year, DATE_FIELDS.date2.year],
    [DATE_FIELDS.date1.hour, DATE_FIELDS.date2.hour],
    [DATE_FIELDS.date1.minute, DATE_FIELDS.date2.minute],
  ].forEach(([left, right]) => swapInputValues(left, right));
  calcDateDiff();
  renderCalendar();
}

export function syncBaseDateWithNow() {
  const useNow = Boolean(el(IDS.dateUseNow)?.checked);
  const fields = [
    el(DATE_FIELDS.date1.date),
    el(DATE_FIELDS.date1.year),
    el(DATE_FIELDS.date1.hour),
    el(DATE_FIELDS.date1.minute),
  ];
  fields.forEach((field) => {
    if (field) field.disabled = useNow;
  });
  if (!useNow) return;

  const now = new Date();
  const date1 = el(DATE_FIELDS.date1.date);
  const time1h = el(DATE_FIELDS.date1.hour);
  const time1m = el(DATE_FIELDS.date1.minute);
  if (!date1 || !time1h || !time1m) return;
  date1.value = formatDateInputValue(now);
  syncYearSelectWithDate(DATE_FIELDS.date1.date, DATE_FIELDS.date1.year);
  time1h.value = String(now.getHours());
  time1m.value = String(now.getMinutes());
}

export function calcDateDiff() {
  syncBaseDateWithNow();
  renderDateDiff(buildDateDiffModel());
}

function applyCalendarTranslations() {
  setText("title-calendar", t("calendarTitle"));
  setText("calendar-diff-title", t("calendarDiffTitle"));
  setText("calendar-today-btn", t("calendarToday"));
  setText("calendar-week-start-label", t("calendarWeekStartsMonday"));
  setText("use-now-label", t("useNow"));
  setText("date-inclusive-label", t("includeBoth"));

  [
    ["date1", t("date1")],
    ["date2", t("date2")],
    [DATE_FIELDS.date1.year, t("yearLabel")],
    [DATE_FIELDS.date2.year, t("yearLabel")],
    [DATE_FIELDS.date1.hour, t("hours")],
    [DATE_FIELDS.date2.hour, t("hours")],
    [DATE_FIELDS.date1.minute, t("minutes")],
    [DATE_FIELDS.date2.minute, t("minutes")],
  ].forEach(([id, text]) => setLabelText(id, text));

  const calcBtn = el(IDS.calcButton);
  if (calcBtn) calcBtn.textContent = t("calculate");

  const prevBtn = el(IDS.prevBtn);
  if (prevBtn) {
    prevBtn.title = t("calendarPrev");
    prevBtn.setAttribute("aria-label", t("calendarPrev"));
  }
  const nextBtn = el(IDS.nextBtn);
  if (nextBtn) {
    nextBtn.title = t("calendarNext");
    nextBtn.setAttribute("aria-label", t("calendarNext"));
  }
  const swapBtn = el(IDS.swapBtn);
  if (swapBtn) {
    const swapTitle = t("swapDates");
    swapBtn.title = swapTitle;
    swapBtn.setAttribute("aria-label", swapTitle);
  }

  renderCalendar();
  calcDateDiff();
}

function initDateDiffAutoSync() {
  if (calendarState.dateDiffIntervalId) {
    clearInterval(calendarState.dateDiffIntervalId);
  }
  calendarState.dateDiffIntervalId = setInterval(() => {
    if (!el(IDS.dateUseNow)?.checked) return;
    calcDateDiff();
  }, DATE_DIFF_SYNC_INTERVAL_MS);
}

export function initCalendar() {
  ensureCalendarState();
  const weekStartCheckbox = el(IDS.weekStartToggle);
  if (weekStartCheckbox) {
    weekStartCheckbox.checked = calendarState.calendarWeekStartsMonday;
  }
  syncCalendarWeekStartSetting();
  initDateYearSelects();
  bindCalendarDayDelegation();
  if (!calendarState.calendarInitialized) {
    registerTranslationApplier(applyCalendarTranslations);
    calendarState.calendarInitialized = true;
  }
  renderCalendar();
  calcDateDiff();
  initDateDiffAutoSync();
}
