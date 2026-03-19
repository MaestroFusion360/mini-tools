import { byId, setLabelText, setSelectOptionText, setText } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";
import { getLocale } from "../core/utils.js";

const CALENDAR_START_YEAR = 1970;
const CALENDAR_END_YEAR = 2100;
const DATE_DIFF_SYNC_INTERVAL_MS = 60000;
let dateDiffIntervalId = null;

let calendarViewDate = new Date();
let calendarPickMode = "date1";
let calendarPickModeTouched = false;
let calendarPickPending = false;
let calendarWeekStartsMonday = true;

function formatDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDateOnlyFromInput(dateId) {
  const parsed = parseDateInputValue(dateId);
  if (!parsed) return null;
  return new Date(parsed.year, parsed.month - 1, parsed.day);
}

function updateCalendarPickModeLabels() {
  const date1Btn = byId("calendar-pick-date1");
  const date2Btn = byId("calendar-pick-date2");
  if (date1Btn) date1Btn.textContent = t("date1");
  if (date2Btn) date2Btn.textContent = t("date2");
}

function getCalendarWeekdayLabels() {
  const formatter = new Intl.DateTimeFormat(getLocale(), { weekday: "short" });
  const baseDate = calendarWeekStartsMonday
    ? new Date(2024, 0, 1)
    : new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(baseDate);
    current.setDate(baseDate.getDate() + index);
    return formatter.format(current);
  });
}

function syncCalendarWeekStartSetting() {
  const checkbox = byId("calendar-week-start-monday");
  calendarWeekStartsMonday = checkbox ? checkbox.checked : true;
}

export function toggleCalendarWeekStart() {
  syncCalendarWeekStartSetting();
  renderCalendar();
}

export function setCalendarPickMode(mode, fromUser = true) {
  if (!["date1", "date2"].includes(mode)) return;
  if (fromUser) {
    calendarPickModeTouched = true;
    calendarPickPending = true;
  }
  calendarPickMode = mode;
  const date1Btn = byId("calendar-pick-date1");
  const date2Btn = byId("calendar-pick-date2");
  if (date1Btn)
    date1Btn.classList.toggle(
      "active",
      calendarPickModeTouched && mode === "date1",
    );
  if (date1Btn)
    date1Btn.classList.toggle(
      "pick-pending",
      calendarPickPending && mode === "date1",
    );
  if (date2Btn)
    date2Btn.classList.toggle(
      "active",
      calendarPickModeTouched && mode === "date2",
    );
  if (date2Btn)
    date2Btn.classList.toggle(
      "pick-pending",
      calendarPickPending && mode === "date2",
    );
}

function applyCalendarDatePick(dateValue) {
  if (!dateValue) return;
  if (calendarPickMode === "date1" && byId("date-use-now")?.checked) {
    const useNowToggle = byId("date-use-now");
    if (useNowToggle) useNowToggle.checked = false;
    syncBaseDateWithNow();
  }
  const targetDateId = calendarPickMode;
  const targetYearId = `${calendarPickMode}-year`;
  const targetInput = byId(targetDateId);
  if (!targetInput) return;
  targetInput.value = dateValue;
  calendarPickPending = false;
  setCalendarPickMode(calendarPickMode, false);
  syncYearSelectWithDate(targetDateId, targetYearId);
  calcDateDiff();
}

export function renderCalendar() {
  const now = new Date();
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekdayRaw = firstDay.getDay();
  const startWeekday = calendarWeekStartsMonday
    ? (startWeekdayRaw + 6) % 7
    : startWeekdayRaw;
  const totalDays = daysInMonth(year, month);
  const monthTitle = calendarViewDate.toLocaleDateString(getLocale(), {
    month: "long",
    year: "numeric",
  });

  byId("calendar-month-year").textContent = monthTitle;

  const d1Selected = getDateOnlyFromInput("date1");
  const d2Selected = getDateOnlyFromInput("date2");
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

  let html = "";
  const wd = getCalendarWeekdayLabels();
  wd.forEach((w) => (html += `<div class="calendar-day weekday">${w}</div>`));
  for (let i = 0; i < startWeekday; i++)
    html += '<div class="calendar-day empty"></div>';

  for (let day = 1; day <= totalDays; day++) {
    const dayDate = new Date(year, month, day);
    const isoDate = formatDateInputValue(dayDate);
    const isToday = dayDate.toDateString() === now.toDateString();
    const isDate1 =
      d1Selected && dayDate.toDateString() === d1Selected.toDateString();
    const isDate2 =
      d2Selected && dayDate.toDateString() === d2Selected.toDateString();
    const inRange =
      rangeStart && rangeEnd && dayDate > rangeStart && dayDate < rangeEnd;
    const classNames = ["calendar-day", "calendar-day-clickable"];
    if (isToday) classNames.push("today");
    if (isDate1) classNames.push("selected-start");
    if (isDate2) classNames.push("selected-end");
    if (inRange) classNames.push("in-range");
    html += `<div class="${classNames.join(" ")}" data-calendar-date="${isoDate}">${day}</div>`;
  }

  byId("calendar-days").innerHTML = html;
  byId("calendar-days")
    .querySelectorAll(".calendar-day-clickable")
    .forEach((cell) => {
      cell.addEventListener("click", () => {
        applyCalendarDatePick(cell.dataset.calendarDate || "");
        renderCalendar();
      });
    });
}

export function changeCalendarMonth(delta) {
  if (delta < 0) {
    calendarPickPending = false;
    setCalendarPickMode(calendarPickMode, false);
  }
  calendarViewDate = new Date(
    calendarViewDate.getFullYear(),
    calendarViewDate.getMonth() + delta,
    1,
  );
  renderCalendar();
}

export function goToCurrentMonth() {
  calendarViewDate = new Date();
  calendarViewDate.setDate(1);
  renderCalendar();
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function parseDateInputValue(dateId) {
  const value = byId(dateId).value;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function fillYearSelect(selectId, selectedYear) {
  const sel = byId(selectId);
  if (!sel) return;
  const selected = Number(selectedYear);
  let html = "";
  for (let y = CALENDAR_END_YEAR; y >= CALENDAR_START_YEAR; y--) {
    html += `<option value="${y}"${y === selected ? " selected" : ""}>${y}</option>`;
  }
  sel.innerHTML = html;
}

export function syncYearSelectWithDate(dateId, yearSelectId) {
  const parsed = parseDateInputValue(dateId);
  if (!parsed) return;
  fillYearSelect(yearSelectId, parsed.year);
  renderCalendar();
}

export function setDateYear(dateId, yearSelectId) {
  const dateInput = byId(dateId);
  const yearSelect = byId(yearSelectId);
  const parsed = parseDateInputValue(dateId);
  if (!dateInput || !yearSelect || !parsed) return;
  const y = Number(yearSelect.value);
  const maxDay = daysInMonth(y, parsed.month - 1);
  const d = Math.min(parsed.day, maxDay);
  dateInput.value = `${y}-${String(parsed.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  syncYearSelectWithDate(dateId, yearSelectId);
  calcDateDiff();
}

function initDateYearSelects() {
  const date2El = byId("date2");
  if (date2El && (!date2El.value || date2El.value === "2025-12-31")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    date2El.value = formatDateInputValue(tomorrow);
  }
  syncYearSelectWithDate("date1", "date1-year");
  syncYearSelectWithDate("date2", "date2-year");
}

function clampNumber(id, min, max) {
  const el = byId(id);
  if (!el) return min;
  let v = Number(el.value);
  if (!Number.isFinite(v)) v = min;
  v = Math.max(min, Math.min(max, Math.floor(v)));
  el.value = String(v);
  return v;
}

function getDateTime(dateId, hourId, minuteId) {
  const p = parseDateInputValue(dateId);
  if (!p) return null;
  const h = clampNumber(hourId, 0, 23);
  const m = clampNumber(minuteId, 0, 59);
  return new Date(p.year, p.month - 1, p.day, h, m, 0, 0);
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

export function swapDates() {
  const d1 = byId("date1").value;
  const d2 = byId("date2").value;
  const y1 = byId("date1-year").value;
  const y2 = byId("date2-year").value;
  const h1 = byId("time1h").value;
  const h2 = byId("time2h").value;
  const m1 = byId("time1m").value;
  const m2 = byId("time2m").value;

  byId("date1").value = d2;
  byId("date2").value = d1;
  byId("date1-year").value = y2;
  byId("date2-year").value = y1;
  byId("time1h").value = h2;
  byId("time2h").value = h1;
  byId("time1m").value = m2;
  byId("time2m").value = m1;
  calcDateDiff();
}

export function syncBaseDateWithNow() {
  const useNow = byId("date-use-now")?.checked;
  const date1El = byId("date1");
  const date1YearEl = byId("date1-year");
  const time1h = byId("time1h");
  const time1m = byId("time1m");
  [date1El, date1YearEl, time1h, time1m].forEach((el) => {
    if (el) el.disabled = useNow;
  });
  if (!useNow) return;
  const now = new Date();
  date1El.value = formatDateInputValue(now);
  syncYearSelectWithDate("date1", "date1-year");
  time1h.value = String(now.getHours());
  time1m.value = String(now.getMinutes());
}

export function calcDateDiff() {
  syncBaseDateWithNow();
  const d1 = getDateTime("date1", "time1h", "time1m");
  const d2 = getDateTime("date2", "time2h", "time2m");
  if (!d1 || !d2) {
    byId("date-diff").textContent = "--";
    return;
  }

  const inclusive = byId("date-inclusive")?.checked;
  const ms = Math.abs(d2 - d1) + (inclusive ? 24 * 60 * 60 * 1000 : 0);
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const remDays = days % 7;
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const start = d1 < d2 ? d1 : d2;
  const end = d1 < d2 ? d2 : d1;
  const ymd = diffYMD(start, end);
  const relation = d2 >= d1 ? t("relationForward") : t("relationReverse");

  byId("date-diff").innerHTML =
    `${days} ${t("dayShort")} ${hours} ${t("hourShort")} ${minutes} ${t("minShort")}<br>` +
    `${weeks} ${t("weekShort")} ${remDays} ${t("dayShort")}<br>` +
    `${ymd.y} ${t("yearShort")} ${ymd.m} ${t("monthShort")} ${ymd.d} ${t("dayShort")}<br>` +
    `${formatWeekday(d1)} ${formatTime(d1)} → ${formatWeekday(d2)} ${formatTime(d2)}<br>` +
    `${relation}<br>` +
    `${t("totalMinutes")}: ${totalMinutes.toLocaleString(getLocale())}`;
  renderCalendar();
}

function applyCalendarTranslations() {
  setText("title-calendar", t("calendarTitle"));
  setText("calendar-diff-title", t("calendarDiffTitle"));
  setText("calendar-today-btn", t("calendarToday"));
  setText("calendar-week-start-label", t("calendarWeekStartsMonday"));
  setText("use-now-label", t("useNow"));
  setText("date-inclusive-label", t("includeBoth"));
  setLabelText("date1", t("date1"));
  setLabelText("date2", t("date2"));
  setLabelText("date1-year", t("yearLabel"));
  setLabelText("date2-year", t("yearLabel"));
  setLabelText("time1h", t("hours"));
  setLabelText("time2h", t("hours"));
  setLabelText("time1m", t("minutes"));
  setLabelText("time2m", t("minutes"));
  updateCalendarPickModeLabels();
  setCalendarPickMode(calendarPickMode, false);

  const calcBtn = document.querySelector('button[onclick="calcDateDiff()"]');
  if (calcBtn) calcBtn.textContent = t("calculate");

  const prevBtn = byId("calendar-prev-btn");
  const nextBtn = byId("calendar-next-btn");
  if (prevBtn) prevBtn.title = t("calendarPrev");
  if (nextBtn) nextBtn.title = t("calendarNext");

  calcDateDiff();
}

export function initCalendar() {
  const weekStartCheckbox = byId("calendar-week-start-monday");
  if (weekStartCheckbox) weekStartCheckbox.checked = true;
  syncCalendarWeekStartSetting();
  initDateYearSelects();
  registerTranslationApplier(applyCalendarTranslations);
  renderCalendar();
  calcDateDiff();
  syncBaseDateWithNow();

  if (dateDiffIntervalId) clearInterval(dateDiffIntervalId);
  dateDiffIntervalId = setInterval(() => {
    if (byId("date-use-now")?.checked) calcDateDiff();
  }, DATE_DIFF_SYNC_INTERVAL_MS);
}

