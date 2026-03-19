import { byId, setIcon, setText } from './dom.js';
import { registerTranslationApplier, getLanguage, isKnownTranslation, t } from './i18n.js';
import { STORAGE_KEYS, getStored, getStoredJson, setStored, setStoredJson } from './state.js';
import { formatDateTime, getLocale } from './utils.js';

let weatherCurrentCoords = null;

const WEATHER_CITY_PRESETS = [
    { labelKey: 'presetSaintPetersburg', lat: 59.9343, lon: 30.3351 },
    { labelKey: 'presetNewYork', lat: 40.7128, lon: -74.0060 },
    { labelKey: 'presetLondon', lat: 51.5074, lon: -0.1278 },
    { labelKey: 'presetMoscow', lat: 55.7558, lon: 37.6173 },
    { labelKey: 'presetDubai', lat: 25.2048, lon: 55.2708 },
    { labelKey: 'presetBangkok', lat: 13.7563, lon: 100.5018 },
    { labelKey: 'presetTokyo', lat: 35.6762, lon: 139.6503 }
];

function getWeatherUiText(en, ru) {
    return getLanguage() === 'ru' ? ru : en;
}

function setCoordText(lat, lon) {
    byId('coord').textContent = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
}

function setWeatherManualUI(manual) {
    const latInput = byId('weather-lat');
    const lonInput = byId('weather-lon');
    const applyBtn = byId('weather-apply-btn');
    if (latInput) latInput.disabled = !manual;
    if (lonInput) lonInput.disabled = !manual;
    if (applyBtn) applyBtn.disabled = !manual;
}

function getWeatherFavorites() {
    const parsed = getStoredJson(STORAGE_KEYS.weatherFavorites, []);
    if (!Array.isArray(parsed)) return [];
    let hasHome = false;
    const favorites = parsed
        .map(item => {
            if (!item) return null;
            const lat = Number(item.lat);
            const lon = Number(item.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

            const fallbackName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : fallbackName;
            const isHome = Boolean(item.isHome) && !hasHome;
            if (isHome) hasHome = true;
            return { name, lat, lon, isHome };
        })
        .filter(Boolean);
    if (!hasHome && favorites.length) favorites[0].isHome = true;
    return favorites;
}

function saveWeatherFavorites(items) {
    let hasHome = false;
    const normalized = (Array.isArray(items) ? items : [])
        .map(item => {
            if (!item) return null;
            const lat = Number(item.lat);
            const lon = Number(item.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
            const fallbackName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : fallbackName;
            const isHome = Boolean(item.isHome) && !hasHome;
            if (isHome) hasHome = true;
            return { name, lat, lon, isHome };
        })
        .filter(Boolean);
    if (!hasHome && normalized.length) normalized[0].isHome = true;
    setStoredJson(STORAGE_KEYS.weatherFavorites, normalized);
}

async function applyFavoriteCoordinates(lat, lon) {
    const toggle = byId('weather-manual-toggle');
    if (toggle) toggle.checked = true;
    setStored(STORAGE_KEYS.weatherMode, '1');
    setWeatherManualUI(true);
    byId('weather-lat').value = String(lat);
    byId('weather-lon').value = String(lon);
    await applyManualCoordinates();
}

export function renderWeatherFavorites() {
    const holder = byId('weather-favorites-list');
    if (!holder) return;

    const favorites = getWeatherFavorites();
    if (!favorites.length) {
        holder.innerHTML = `<span class="small-text">${t('noFavorites')}</span>`;
        return;
    }

    holder.innerHTML = '';
    favorites.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = `weather-fav-item${item.isHome ? ' is-home' : ''}`;

        const applyBtn = document.createElement('button');
        applyBtn.type = 'button';
        applyBtn.className = 'weather-fav-chip weather-fav-main';
        applyBtn.textContent = item.name;
        applyBtn.title = `${item.lat.toFixed(4)}, ${item.lon.toFixed(4)}`;
        applyBtn.onclick = async () => {
            await applyFavoriteCoordinates(item.lat, item.lon);
        };

        const actions = document.createElement('div');
        actions.className = 'weather-fav-item-actions';

        const homeBtn = document.createElement('button');
        homeBtn.type = 'button';
        homeBtn.className = `icon-btn weather-fav-mini-btn${item.isHome ? ' active' : ''}`;
        homeBtn.innerHTML = '<svg class="icon-svg btn-icon"><use href="#i-house"></use></svg>';
        homeBtn.title = item.isHome
            ? getWeatherUiText('Home point', 'Домашняя точка')
            : getWeatherUiText('Set as home', 'Сделать домашней');
        homeBtn.onclick = () => setFavoriteHome(idx);

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'icon-btn weather-fav-mini-btn';
        editBtn.innerHTML = '<svg class="icon-svg btn-icon"><use href="#i-pen"></use></svg>';
        editBtn.title = getWeatherUiText('Rename', 'Переименовать');
        editBtn.onclick = () => renameFavoriteCoordinate(idx);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'icon-btn weather-fav-mini-btn';
        deleteBtn.innerHTML = '<svg class="icon-svg btn-icon"><use href="#i-x"></use></svg>';
        deleteBtn.title = getWeatherUiText('Delete', 'Удалить');
        deleteBtn.onclick = () => removeFavoriteCoordinateAt(idx);

        actions.appendChild(homeBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        row.appendChild(applyBtn);
        row.appendChild(actions);
        holder.appendChild(row);
    });
}

export function renderWeatherPresets() {
    const holder = byId('weather-presets-list');
    if (!holder) return;
    holder.innerHTML = '';
    WEATHER_CITY_PRESETS.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'weather-fav-chip';
        btn.textContent = t(item.labelKey);
        btn.title = `${item.lat.toFixed(4)}, ${item.lon.toFixed(4)}`;
        btn.onclick = async () => {
            await applyFavoriteCoordinates(item.lat, item.lon);
        };
        holder.appendChild(btn);
    });
}

export function addCurrentCoordinateToFavorites() {
    if (!weatherCurrentCoords) {
        alert(t('manualCoordsHint'));
        return;
    }
    const { lat, lon } = weatherCurrentCoords;
    const favorites = getWeatherFavorites();
    const exists = favorites.some(item => Math.abs(item.lat - lat) < 0.000001 && Math.abs(item.lon - lon) < 0.000001);
    if (exists) {
        renderWeatherFavorites();
        return;
    }
    const defaultName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const value = prompt(t('favoriteNamePrompt'), defaultName);
    if (value === null) return;
    favorites.push({ name: value.trim() || defaultName, lat, lon, isHome: favorites.length === 0 });
    saveWeatherFavorites(favorites);
    renderWeatherFavorites();
}

function renameFavoriteCoordinate(index) {
    const favorites = getWeatherFavorites();
    const item = favorites[index];
    if (!item) return;
    const value = prompt(t('favoriteNamePrompt'), item.name);
    if (value === null) return;
    item.name = value.trim() || `${item.lat.toFixed(4)}, ${item.lon.toFixed(4)}`;
    saveWeatherFavorites(favorites);
    renderWeatherFavorites();
}

function removeFavoriteCoordinateAt(index) {
    const favorites = getWeatherFavorites();
    if (!favorites[index]) return;
    favorites.splice(index, 1);
    saveWeatherFavorites(favorites);
    renderWeatherFavorites();
}

function setFavoriteHome(index) {
    const favorites = getWeatherFavorites();
    if (!favorites[index]) return;
    favorites.forEach((item, idx) => { item.isHome = idx === index; });
    saveWeatherFavorites(favorites);
    renderWeatherFavorites();
}

export function removeFavoriteCoordinateDialog() {
    const favorites = getWeatherFavorites();
    if (!favorites.length) {
        alert(t('noFavorites'));
        return;
    }
    const homeIndex = favorites.findIndex(item => item.isHome);
    favorites.splice(homeIndex >= 0 ? homeIndex : 0, 1);
    saveWeatherFavorites(favorites);
    renderWeatherFavorites();
}

function getManualCoords() {
    const latInput = byId('weather-lat');
    const lonInput = byId('weather-lon');
    if (!latInput || !lonInput) return null;
    const lat = Number(String(latInput.value).replace(',', '.'));
    const lon = Number(String(lonInput.value).replace(',', '.'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lat, lon };
}

function loadWeatherSettings() {
    const toggle = byId('weather-manual-toggle');
    const latInput = byId('weather-lat');
    const lonInput = byId('weather-lon');
    if (!toggle || !latInput || !lonInput) return;

    const manual = getStored(STORAGE_KEYS.weatherMode, '0') === '1';
    toggle.checked = manual;
    latInput.value = getStored(STORAGE_KEYS.weatherManualLat, '') || '';
    lonInput.value = getStored(STORAGE_KEYS.weatherManualLon, '') || '';
    setWeatherManualUI(manual);
}

async function refreshWeatherByCoordinates(lat, lon) {
    weatherCurrentCoords = { lat, lon };
    setCoordText(lat, lon);
    await loadAddress(lat, lon);
    await loadWeather(lat, lon);
    updateTimestamp();
}

export function toggleWeatherManualMode() {
    const toggle = byId('weather-manual-toggle');
    if (!toggle) return;
    const manual = !!toggle.checked;
    setStored(STORAGE_KEYS.weatherMode, manual ? '1' : '0');
    setWeatherManualUI(manual);
    if (manual) applyManualCoordinates();
    else initWeather();
}

export async function applyManualCoordinates() {
    const coords = getManualCoords();
    if (!coords) {
        byId('coord').textContent = t('manualCoordsInvalid');
        byId('address').textContent = t('manualCoordsHint');
        return;
    }
    setStored(STORAGE_KEYS.weatherManualLat, String(coords.lat));
    setStored(STORAGE_KEYS.weatherManualLon, String(coords.lon));
    await refreshWeatherByCoordinates(coords.lat, coords.lon);
}

export async function initWeather() {
    updateTimestamp();
    await loadCurrentTime();

    const manual = byId('weather-manual-toggle')?.checked;
    if (manual) {
        await applyManualCoordinates();
        return;
    }

    if (!('geolocation' in navigator)) {
        setLocationError(t('geoUnsupported'));
        return;
    }

    try {
        if ('permissions' in navigator && navigator.permissions?.query) {
            const status = await navigator.permissions.query({ name: 'geolocation' });
            if (status.state === 'denied') {
                setLocationError(t('geoDenied'));
                return;
            }
        }
    } catch {
        
    }

    navigator.geolocation.getCurrentPosition(
        async pos => {
            await refreshWeatherByCoordinates(pos.coords.latitude, pos.coords.longitude);
        },
        err => {
            if (err.code === 1) setLocationError(t('geoNoAccess'));
            else if (err.code === 2) setLocationError(t('geoCoordFail'));
            else if (err.code === 3) setLocationError(t('geoTimeout'));
            else setLocationError(t('geoError'));
            console.warn('Geolocation error:', err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

function setLocationError(message) {
    byId('coord').textContent = message;
    byId('address').textContent = t('geoCheckPermissions');
}

async function loadAddress(lat, lon) {
    try {
        const addrRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${getLanguage()}`);
        if (!addrRes.ok) throw new Error('Address request failed');
        const addr = await addrRes.json();
        const a = addr.address || {};
        const parts = [];
        if (a.city) parts.push(a.city);
        else if (a.town) parts.push(a.town);
        else if (a.village) parts.push(a.village);
        if (a.state) parts.push(a.state);
        if (a.country) parts.push(a.country);
        byId('address').textContent = parts.join(', ') || t('addressNotFound');
    } catch {
        byId('address').textContent = t('addressUnavailable');
    }
}

async function loadWeather(lat, lon) {
    try {
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&timezone=auto`);
        if (!wRes.ok) throw new Error('Weather request failed');
        const w = await wRes.json();
        if (!w.current || !w.daily?.sunrise?.length || !w.daily?.sunset?.length) throw new Error('Weather payload is incomplete');
        byId('temp').textContent = w.current.temperature_2m;
        byId('humidity').textContent = w.current.relative_humidity_2m;
        byId('wind').textContent = w.current.wind_speed_10m;
        byId('sunrise').textContent = new Date(w.daily.sunrise[0]).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', hour12: false });
        byId('sunset').textContent = new Date(w.daily.sunset[0]).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', hour12: false });
        renderForecast(w);
    } catch (e) {
        console.warn('Weather error:', e);
        renderForecast();
    }
}

function findHourlyValue(hourlyTime, hourlyValues, dayKey, hour) {
    if (!Array.isArray(hourlyTime) || !Array.isArray(hourlyValues)) return null;
    const exactPrefix = `${dayKey}T${String(hour).padStart(2, '0')}:`;
    const exactIndex = hourlyTime.findIndex(item => item.startsWith(exactPrefix));
    if (exactIndex >= 0 && Number.isFinite(hourlyValues[exactIndex])) return hourlyValues[exactIndex];

    const sameDayIndexes = hourlyTime
        .map((item, idx) => ({ item, idx }))
        .filter(entry => entry.item.startsWith(`${dayKey}T`))
        .map(entry => entry.idx);
    if (!sameDayIndexes.length) return null;

    let best = null;
    for (const idx of sameDayIndexes) {
        const hourStr = hourlyTime[idx].slice(11, 13);
        const h = Number(hourStr);
        if (!Number.isFinite(h)) continue;
        const delta = Math.abs(h - hour);
        if (!best || delta < best.delta) best = { idx, delta };
    }
    if (!best) return null;
    return Number.isFinite(hourlyValues[best.idx]) ? hourlyValues[best.idx] : null;
}

function formatTemp(value) {
    return Number.isFinite(value) ? `${Math.round(value)}°C` : '--°C';
}

function renderForecast(weatherData = null) {
    const morningEl = byId('forecast-morning');
    const dayEl = byId('forecast-day');
    const eveningEl = byId('forecast-evening');
    const tomorrowEl = byId('forecast-tomorrow');
    if (!morningEl || !dayEl || !eveningEl || !tomorrowEl) return;

    if (!weatherData?.daily?.time?.length || !weatherData?.hourly?.time?.length) {
        morningEl.textContent = '--°C';
        dayEl.textContent = '--°C';
        eveningEl.textContent = '--°C';
        tomorrowEl.textContent = '--°C / --°C';
        return;
    }

    const todayKey = weatherData.daily.time[0];
    const morning = findHourlyValue(weatherData.hourly.time, weatherData.hourly.temperature_2m, todayKey, 9);
    const day = findHourlyValue(weatherData.hourly.time, weatherData.hourly.temperature_2m, todayKey, 14);
    const evening = findHourlyValue(weatherData.hourly.time, weatherData.hourly.temperature_2m, todayKey, 20);

    morningEl.textContent = formatTemp(morning);
    dayEl.textContent = formatTemp(day);
    eveningEl.textContent = formatTemp(evening);

    const tomorrowMax = weatherData.daily.temperature_2m_max?.[1];
    const tomorrowMin = weatherData.daily.temperature_2m_min?.[1];
    tomorrowEl.textContent = `${formatTemp(tomorrowMin)} / ${formatTemp(tomorrowMax)}`;
}

async function loadCurrentTime() {
    try {
        const tRes = await fetch('https://worldtimeapi.org/api/ip');
        if (!tRes.ok) throw new Error('Time request failed');
        const data = await tRes.json();
        const d = new Date(data.datetime);
        byId('time').textContent = formatDateTime(d, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch {
        byId('time').textContent = formatDateTime(new Date());
    }
}

function translateTextIfKnown(el, keys) {
    if (!el) return;
    const current = (el.textContent || '').trim();
    for (const key of keys) {
        if (isKnownTranslation(current, key)) {
            el.textContent = t(key);
            return;
        }
    }
}

export function refreshWeatherLocaleState() {
    const coordEl = byId('coord');
    const addressEl = byId('address');

    if (weatherCurrentCoords) setCoordText(weatherCurrentCoords.lat, weatherCurrentCoords.lon);
    else translateTextIfKnown(coordEl, ['manualCoordsInvalid', 'geoUnsupported', 'geoDenied', 'geoNoAccess', 'geoCoordFail', 'geoTimeout', 'geoError']);

    translateTextIfKnown(addressEl, ['manualCoordsHint', 'geoCheckPermissions', 'addressNotFound', 'addressUnavailable']);
    updateTimestamp();
}

function updateTimestamp() {
    byId('timestamp').textContent = `${t('updatedAt')}: ${formatDateTime(new Date())}`;
}

function applyWeatherTranslations() {
    setText('title-weather', t('weatherTitle'));
    setText('weather-main-title', t('weatherNow'));
    setText('weather-sun-title', t('weatherSun'));
    setText('weather-forecast-title', t('weatherForecast'));
    setText('forecast-morning-label', t('forecastMorning'));
    setText('forecast-day-label', t('forecastDay'));
    setText('forecast-evening-label', t('forecastEvening'));
    setText('forecast-tomorrow-label', t('forecastTomorrow'));
    setText('sunrise-label', t('sunrise'));
    setText('sunset-label', t('sunset'));
    setText('weather-manual-label', t('weatherManualLabel'));
    setText('weather-lat-label', t('latitude'));
    setText('weather-lon-label', t('longitude'));
    setText('weather-apply-btn', t('applyCoordinates'));
    setText('weather-fav-title', t('favoritesTitle'));
    setText('weather-presets-title', t('presetsTitle'));
    setIcon('weather-fav-add-btn', 'i-plus');
    setIcon('weather-fav-remove-btn', 'i-minus');
    const weatherFavHomeBtn = byId('weather-fav-remove-btn');
    if (weatherFavHomeBtn) weatherFavHomeBtn.title = getLanguage() === 'ru' ? 'Удалить домашнюю точку' : 'Remove home point';

    renderWeatherFavorites();
    renderWeatherPresets();
    refreshWeatherLocaleState();
}

export function initWeatherModule() {
    loadWeatherSettings();
    registerTranslationApplier(applyWeatherTranslations);
    initWeather();
}
