import { byId, setSelectOptionText, setText } from './dom.js';
import { registerTranslationApplier, t, getLanguage } from './i18n.js';
import { STORAGE_KEYS, getStored, setStored } from './state.js';
import { getLocale } from './utils.js';

let time24h = true;
const WORLD_TIME_INTERVAL_MS = 1000;
let worldTimeIntervalId = null;

export function toggleTimeFormat() {
    time24h = !time24h;
    byId('time-format-btn').textContent = time24h ? t('timeFormat24') : t('timeFormat12');
    setStored(STORAGE_KEYS.timeFormat, time24h ? '24' : '12');
    updateWorldTime();
}

function loadTimeFormat() {
    const savedFormat = getStored(STORAGE_KEYS.timeFormat, '24');
    if (savedFormat === '12') time24h = false;
    byId('time-format-btn').textContent = time24h ? t('timeFormat24') : t('timeFormat12');
}

export function updateWorldTime() {
    const tzSelect = byId('timezone-select');
    if (!tzSelect) return;
    const tz = tzSelect.value;
    const now = new Date();
    const opts = tz === 'local' ? {} : { timeZone: tz };
    const timeStr = now.toLocaleTimeString(getLocale(), { ...opts, hour12: !time24h });
    byId('world-time').textContent = timeStr;
    byId('unix-time').textContent = `${t('unixLabel')}: ${Math.floor(now.getTime() / 1000)}`;
}

function applyWorldTimeTranslations() {
    setText('title-time', t('worldTimeTitle'));
    setSelectOptionText('timezone-select', 'local', t('localTimezone'));
    setSelectOptionText('timezone-select', 'America/New_York', getLanguage() === 'ru' ? 'Нью-Йорк' : 'New York');
    setSelectOptionText('timezone-select', 'Europe/London', getLanguage() === 'ru' ? 'Лондон' : 'London');
    setSelectOptionText('timezone-select', 'Europe/Moscow', getLanguage() === 'ru' ? 'Москва' : 'Moscow');
    setSelectOptionText('timezone-select', 'Asia/Dubai', getLanguage() === 'ru' ? 'Дубай' : 'Dubai');
    setSelectOptionText('timezone-select', 'Asia/Bangkok', getLanguage() === 'ru' ? 'Бангкок' : 'Bangkok');
    setSelectOptionText('timezone-select', 'Asia/Tokyo', getLanguage() === 'ru' ? 'Токио' : 'Tokyo');
    byId('time-format-btn').textContent = time24h ? t('timeFormat24') : t('timeFormat12');
    updateWorldTime();
}

export function initWorldTime() {
    loadTimeFormat();
    registerTranslationApplier(applyWorldTimeTranslations);
    updateWorldTime();
    if (worldTimeIntervalId) clearInterval(worldTimeIntervalId);
    worldTimeIntervalId = setInterval(updateWorldTime, WORLD_TIME_INTERVAL_MS);
}
