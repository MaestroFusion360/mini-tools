// ================== THEME & LOCALSTORAGE ==================
function setThemeToggleIcon(isDark) {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const iconName = isDark ? 'i-sun' : 'i-moon';
    const iconAlt = isDark ? 'Light mode' : 'Dark mode';
    toggle.innerHTML = `<svg class="icon-svg theme-toggle-icon" aria-label="${iconAlt}"><use href="#${iconName}"></use></svg>`;
}

function toggleTheme() {
    const body = document.body;

    if (body.classList.contains('dark')) {
        body.classList.remove('dark');
        setThemeToggleIcon(false);
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark');
        setThemeToggleIcon(true);
        localStorage.setItem('theme', 'dark');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;

    if (savedTheme === 'dark') {
        body.classList.add('dark');
        setThemeToggleIcon(true);
    } else {
        body.classList.remove('dark');
        setThemeToggleIcon(false);
    }
}



const i18n = {
    en: {
        back: '← Back',
        tools: 'Tools',
        weather: 'Weather',
        weatherTitle: 'Weather',
        weatherNow: 'Current Weather',
        weatherSun: 'Sun',
        sunrise: 'Sunrise',
        sunset: 'Sunset',
        weatherManualLabel: 'Use manual coordinates',
        latitude: 'Latitude',
        longitude: 'Longitude',
        applyCoordinates: 'Apply coordinates',
        manualCoordsInvalid: 'Invalid coordinates',
        manualCoordsHint: 'Enter latitude (-90..90) and longitude (-180..180)',
        favoritesTitle: 'Favorite coordinates',
        presetsTitle: 'City presets',
        addFavorite: 'Add',
        removeFavorite: 'Remove',
        noFavorites: 'No favorites yet',
        favoriteNamePrompt: 'Favorite name',
        favoriteLatPrompt: 'Latitude (-90..90)',
        favoriteLonPrompt: 'Longitude (-180..180)',
        favoriteRemovePrompt: 'Enter favorite number to remove',
        favoriteSaved: 'Favorite saved',
        favoriteRemoved: 'Favorite removed',
        favoriteInvalid: 'Invalid favorite data',
        presetSaintPetersburg: 'Saint Petersburg',
        presetNewYork: 'New York',
        presetLondon: 'London',
        presetMoscow: 'Moscow',
        presetDubai: 'Dubai',
        presetBangkok: 'Bangkok',
        presetTokyo: 'Tokyo',
        worldTime: 'World Time',
        worldTimeTitle: 'World Time',
        calendar: 'Calendar',
        calendarTitle: 'Calendar',
        calendarDiffTitle: 'Date Difference',
        calendarPrev: 'Previous month',
        calendarNext: 'Next month',
        calendarToday: 'Current month',
        yearLabel: 'Year',
        converter: 'Converter',
        converterTitle: 'Converter',
        calculator: 'Calculator',
        calculatorTitle: 'Calculator',
        textAnalysis: 'Text Analysis',
        textAnalysisTitle: 'Text Analysis',
        currency: 'Currency',
        currencyTitle: 'Currency Converter',
        exit: 'Exit',
        useNow: 'Use current local date/time as Date 1',
        includeBoth: 'Include both dates',
        precision: 'Precision',
        refreshServer: '↻ Refresh rates from server',
        calcModeBasic: 'Mode: Basic',
        calcModeScientific: 'Mode: Scientific',
        textPlaceholder: 'Type text...',
        closeAppConfirm: 'Close app?',
        geoUnsupported: 'Geolocation is not supported',
        geoDenied: 'Geolocation access is blocked in browser',
        geoNoAccess: 'No location access',
        geoCoordFail: 'Failed to detect coordinates',
        geoTimeout: 'Geolocation timeout',
        geoError: 'Geolocation error',
        geoCheckPermissions: 'Check browser permissions and GPS',
        addressNotFound: 'Address not found',
        addressUnavailable: 'Address unavailable',
        updatedAt: 'Updated',
        unixLabel: 'Unix',
        localTimezone: 'Local',
        date1: 'Date 1',
        date2: 'Date 2',
        hours: 'Hours',
        minutes: 'Minutes',
        calculate: 'Calculate',
        length: 'Length',
        area: 'Area',
        volume: 'Volume',
        weight: 'Weight',
        speed: 'Speed',
        temperature: 'Temperature',
        pressure: 'Pressure',
        energy: 'Energy',
        calcExpression: 'Expression',
        calcHistoryTitle: 'History',
        calcEmptyHistory: 'No history yet',
        relationForward: 'from first to second',
        relationReverse: 'from second to first',
        dayShort: 'days',
        hourShort: 'h',
        minShort: 'min',
        weekShort: 'weeks',
        yearShort: 'y',
        monthShort: 'mo',
        totalMinutes: 'Total minutes',
        rateLabel: 'Rate',
        timeFormat24: '24h',
        timeFormat12: '12h',
        ratesRefreshing: 'Refreshing rates...',
        ratesUpdated: 'Rates updated',
        ratesFallback: 'Refresh failed, using built-in rates'
    },
    ru: {
        back: '← Назад',
        tools: 'Инструменты',
        weather: 'Погода',
        weatherTitle: 'Погода',
        weatherNow: 'Погода сейчас',
        weatherSun: 'Солнце',
        sunrise: 'Восход',
        sunset: 'Закат',
        weatherManualLabel: 'Ввести координаты вручную',
        latitude: 'Широта',
        longitude: 'Долгота',
        applyCoordinates: 'Применить координаты',
        manualCoordsInvalid: 'Некорректные координаты',
        manualCoordsHint: 'Введите широту (-90..90) и долготу (-180..180)',
        favoritesTitle: 'Избранные координаты',
        presetsTitle: 'Пресеты городов',
        addFavorite: 'Добавить',
        removeFavorite: 'Удалить',
        noFavorites: 'Пока нет избранного',
        favoriteNamePrompt: 'Название точки',
        favoriteLatPrompt: 'Широта (-90..90)',
        favoriteLonPrompt: 'Долгота (-180..180)',
        favoriteRemovePrompt: 'Введите номер точки для удаления',
        favoriteSaved: 'Точка сохранена',
        favoriteRemoved: 'Точка удалена',
        favoriteInvalid: 'Некорректные данные точки',
        presetSaintPetersburg: 'Санкт-Петербург',
        presetNewYork: 'Нью-Йорк',
        presetLondon: 'Лондон',
        presetMoscow: 'Москва',
        presetDubai: 'Дубай',
        presetBangkok: 'Бангкок',
        presetTokyo: 'Токио',
        worldTime: 'Мировое время',
        worldTimeTitle: 'Мировое время',
        calendar: 'Календарь',
        calendarTitle: 'Календарь',
        calendarDiffTitle: 'Разница дат',
        calendarPrev: 'Предыдущий месяц',
        calendarNext: 'Следующий месяц',
        calendarToday: 'Текущий месяц',
        yearLabel: 'Год',
        converter: 'Конвертер',
        converterTitle: 'Конвертер',
        calculator: 'Калькулятор',
        calculatorTitle: 'Калькулятор',
        textAnalysis: 'Анализ текста',
        textAnalysisTitle: 'Анализ текста',
        currency: 'Конвертер валют',
        currencyTitle: 'Конвертер валют',
        exit: 'Выход',
        useNow: 'Использовать текущие локальные дату/время как Дата 1',
        includeBoth: 'Включая обе даты',
        precision: 'Точность',
        refreshServer: '↻ Обновить курсы с сервера',
        calcModeBasic: 'Режим: Базовый',
        calcModeScientific: 'Режим: Инженерный',
        textPlaceholder: 'Введите текст...',
        closeAppConfirm: 'Закрыть приложение?',
        geoUnsupported: 'Геолокация не поддерживается',
        geoDenied: 'Доступ к геолокации запрещён в браузере',
        geoNoAccess: 'Нет доступа к местоположению',
        geoCoordFail: 'Не удалось определить координаты',
        geoTimeout: 'Истекло время ожидания геолокации',
        geoError: 'Ошибка геолокации',
        geoCheckPermissions: 'Проверь разрешение браузера и GPS',
        addressNotFound: 'Адрес не найден',
        addressUnavailable: 'Адрес недоступен',
        updatedAt: 'Обновлено',
        unixLabel: 'Unix',
        localTimezone: 'Локальное',
        date1: 'Дата 1',
        date2: 'Дата 2',
        hours: 'Часы',
        minutes: 'Минуты',
        calculate: 'Рассчитать',
        length: 'Длина',
        area: 'Площадь',
        volume: 'Объём',
        weight: 'Вес',
        speed: 'Скорость',
        temperature: 'Температура',
        pressure: 'Давление',
        energy: 'Энергия',
        calcExpression: 'Выражение',
        calcHistoryTitle: 'История',
        calcEmptyHistory: 'Пока пусто',
        relationForward: 'от первой до второй',
        relationReverse: 'от второй до первой',
        dayShort: 'дн',
        hourShort: 'ч',
        minShort: 'мин',
        weekShort: 'нед',
        yearShort: 'г',
        monthShort: 'мес',
        totalMinutes: 'Всего минут',
        rateLabel: 'Курс',
        timeFormat24: '24ч',
        timeFormat12: '12ч',
        ratesRefreshing: 'Обновление курсов...',
        ratesUpdated: 'Курсы обновлены',
        ratesFallback: 'Ошибка обновления, используются локальные курсы'
    }
};

let currentLang = localStorage.getItem('lang') || 'en';

function getLocale() {
    return currentLang === 'ru' ? 'ru-RU' : 'en-US';
}

function formatDateTime(date, options = {}) {
    return date.toLocaleString(getLocale(), { hour12: false, ...options }).replace(',', '');
}

function formatNumber(value, options = {}) {
    return value.toLocaleString(getLocale(), options);
}

function t(key) {
    return i18n[currentLang]?.[key] || i18n.en[key] || key;
}

function setLabelText(forId, value) {
    const label = document.querySelector(`label[for="${forId}"]`);
    if (label) label.textContent = value;
}

function setSelectOptionText(selectId, value, text) {
    const option = document.querySelector(`#${selectId} option[value="${value}"]`);
    if (option) option.textContent = text;
}

function applyTranslations() {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    document.documentElement.lang = currentLang;
    setText('title-tools-text', t('tools'));
    setText('menu-weather', t('weather'));
    setText('menu-time', t('worldTime'));
    setText('menu-calendar', t('calendar'));
    setText('menu-converter', t('converter'));
    setText('menu-calc', t('calculator'));
    setText('menu-text', t('textAnalysis'));
    setText('menu-currency', t('currency'));
    setText('menu-exit', t('exit'));

    document.querySelectorAll('[data-i18n="back-btn"]').forEach(btn => btn.textContent = t('back'));
    setText('title-weather', t('weatherTitle'));
    setText('weather-main-title', t('weatherNow'));
    setText('weather-sun-title', t('weatherSun'));
    setText('sunrise-label', t('sunrise'));
    setText('sunset-label', t('sunset'));
    setText('weather-manual-label', t('weatherManualLabel'));
    setText('weather-lat-label', t('latitude'));
    setText('weather-lon-label', t('longitude'));
    setText('weather-apply-btn', t('applyCoordinates'));
    setText('weather-fav-title', t('favoritesTitle'));
    setText('weather-fav-add-btn', '+');
    setText('weather-fav-remove-btn', '-');
    setText('weather-presets-title', t('presetsTitle'));
    setText('title-time', t('worldTimeTitle'));
    setText('title-calendar', t('calendarTitle'));
    setText('calendar-diff-title', t('calendarDiffTitle'));
    setText('calendar-today-btn', t('calendarToday'));
    setText('title-converter', t('converterTitle'));
    setText('title-calc', t('calculatorTitle'));
    setText('title-text', t('textAnalysisTitle'));
    setText('title-currency', t('currencyTitle'));
    setText('use-now-label', t('useNow'));
    setText('date-inclusive-label', t('includeBoth'));
    setText('cur-refresh-btn', t('refreshServer'));
    setLabelText('conv-precision', t('precision'));
    setLabelText('date1', t('date1'));
    setLabelText('date2', t('date2'));
    setLabelText('date1-year', t('yearLabel'));
    setLabelText('date2-year', t('yearLabel'));
    setLabelText('time1h', t('hours'));
    setLabelText('time2h', t('hours'));
    setLabelText('time1m', t('minutes'));
    setLabelText('time2m', t('minutes'));

    const calcBtn = document.querySelector('button[onclick="calcDateDiff()"]');
    if (calcBtn) calcBtn.textContent = t('calculate');

    setSelectOptionText('conv-type', 'length', t('length'));
    setSelectOptionText('conv-type', 'area', t('area'));
    setSelectOptionText('conv-type', 'volume', t('volume'));
    setSelectOptionText('conv-type', 'weight', t('weight'));
    setSelectOptionText('conv-type', 'speed', t('speed'));
    setSelectOptionText('conv-type', 'temperature', t('temperature'));
    setSelectOptionText('conv-type', 'pressure', t('pressure'));
    setSelectOptionText('conv-type', 'energy', t('energy'));

    setSelectOptionText('timezone-select', 'local', t('localTimezone'));
    setSelectOptionText('timezone-select', 'America/New_York', currentLang === 'ru' ? 'Нью-Йорк' : 'New York');
    setSelectOptionText('timezone-select', 'Europe/London', currentLang === 'ru' ? 'Лондон' : 'London');
    setSelectOptionText('timezone-select', 'Europe/Moscow', currentLang === 'ru' ? 'Москва' : 'Moscow');
    setSelectOptionText('timezone-select', 'Asia/Dubai', currentLang === 'ru' ? 'Дубай' : 'Dubai');
    setSelectOptionText('timezone-select', 'Asia/Bangkok', currentLang === 'ru' ? 'Бангкок' : 'Bangkok');
    setSelectOptionText('timezone-select', 'Asia/Tokyo', currentLang === 'ru' ? 'Токио' : 'Tokyo');

    const historyTitle = document.querySelector('.calc-history-title');
    if (historyTitle) historyTitle.textContent = t('calcHistoryTitle');

    const prevBtn = document.getElementById('calendar-prev-btn');
    const nextBtn = document.getElementById('calendar-next-btn');
    if (prevBtn) prevBtn.title = t('calendarPrev');
    if (nextBtn) nextBtn.title = t('calendarNext');

    const placeholder = document.getElementById('text-input');
    if (placeholder) placeholder.placeholder = t('textPlaceholder');

    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.textContent = currentLang === 'ru' ? '🇷🇺' : '🇬🇧';
        langBtn.title = currentLang === 'ru' ? 'Язык' : 'Language';
    }

    toggleCalcMode(false);
    updateWorldTime();
    renderCalendar();
    calcDateDiff();
    syncBaseDateWithNow();
    analyzeText();
    renderWeatherFavorites();
    renderWeatherPresets();
}

function toggleLanguage() {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('lang', currentLang);
    applyTranslations();
}

// ================== NAVIGATION ==================
function showPage(id) {
    const nextPage = document.getElementById(id);
    if (!nextPage) return;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    nextPage.classList.add('active');
    localStorage.setItem('lastPage', id);
}

function loadLastPage() {
    const lastPage = localStorage.getItem('lastPage');
    if (lastPage && document.getElementById(lastPage)) {
        showPage(lastPage);
    }
}

function exitApp() {
    if (confirm(t('closeAppConfirm'))) {
        window.close();
    }
}

// ================== WEATHER ==================
const WEATHER_MODE_KEY = 'weatherManualMode';
const WEATHER_MANUAL_LAT_KEY = 'weatherManualLat';
const WEATHER_MANUAL_LON_KEY = 'weatherManualLon';
const WEATHER_FAVORITES_KEY = 'weatherFavorites';
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

function setCoordText(lat, lon) {
    document.getElementById('coord').textContent = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
}

function setWeatherManualUI(manual) {
    const latInput = document.getElementById('weather-lat');
    const lonInput = document.getElementById('weather-lon');
    const applyBtn = document.getElementById('weather-apply-btn');

    if (latInput) latInput.disabled = !manual;
    if (lonInput) lonInput.disabled = !manual;
    if (applyBtn) applyBtn.disabled = !manual;
}

function getWeatherFavorites() {
    try {
        const raw = localStorage.getItem(WEATHER_FAVORITES_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(item =>
            item &&
            typeof item.name === 'string' &&
            Number.isFinite(item.lat) &&
            Number.isFinite(item.lon)
        );
    } catch {
        return [];
    }
}

function saveWeatherFavorites(items) {
    localStorage.setItem(WEATHER_FAVORITES_KEY, JSON.stringify(items));
}

function renderWeatherFavorites() {
    const holder = document.getElementById('weather-favorites-list');
    if (!holder) return;

    const favorites = getWeatherFavorites();
    if (!favorites.length) {
        holder.innerHTML = `<span class="small-text">${t('noFavorites')}</span>`;
        return;
    }

    holder.innerHTML = '';
    favorites.forEach((item, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'weather-fav-chip';
        btn.textContent = `${idx + 1}. ${item.name}`;
        btn.title = `${item.lat.toFixed(4)}, ${item.lon.toFixed(4)}`;
        btn.onclick = async () => {
            const toggle = document.getElementById('weather-manual-toggle');
            if (toggle) toggle.checked = true;
            localStorage.setItem(WEATHER_MODE_KEY, '1');
            setWeatherManualUI(true);
            document.getElementById('weather-lat').value = String(item.lat);
            document.getElementById('weather-lon').value = String(item.lon);
            await applyManualCoordinates();
        };
        holder.appendChild(btn);
    });
}

function renderWeatherPresets() {
    const holder = document.getElementById('weather-presets-list');
    if (!holder) return;

    holder.innerHTML = '';
    WEATHER_CITY_PRESETS.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'weather-fav-chip';
        btn.textContent = t(item.labelKey);
        btn.title = `${item.lat.toFixed(4)}, ${item.lon.toFixed(4)}`;
        btn.onclick = async () => {
            const toggle = document.getElementById('weather-manual-toggle');
            if (toggle) toggle.checked = true;
            localStorage.setItem(WEATHER_MODE_KEY, '1');
            setWeatherManualUI(true);
            document.getElementById('weather-lat').value = String(item.lat);
            document.getElementById('weather-lon').value = String(item.lon);
            await applyManualCoordinates();
        };
        holder.appendChild(btn);
    });
}

function addCurrentCoordinateToFavorites() {
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

    favorites.push({ name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon });
    saveWeatherFavorites(favorites);
    renderWeatherFavorites();
    alert(t('favoriteSaved'));
}

function removeFavoriteCoordinateDialog() {
    const favorites = getWeatherFavorites();
    if (!favorites.length) {
        alert(t('noFavorites'));
        return;
    }

    const list = favorites.map((item, idx) => `${idx + 1}. ${item.name} (${item.lat.toFixed(4)}, ${item.lon.toFixed(4)})`).join('\n');
    const value = prompt(`${t('favoriteRemovePrompt')}:\n${list}`, '1');
    if (value === null) return;

    const idx = parseInt(value, 10) - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= favorites.length) {
        alert(t('favoriteInvalid'));
        return;
    }

    favorites.splice(idx, 1);
    saveWeatherFavorites(favorites);
    renderWeatherFavorites();
    alert(t('favoriteRemoved'));
}

function getManualCoords() {
    const latInput = document.getElementById('weather-lat');
    const lonInput = document.getElementById('weather-lon');
    if (!latInput || !lonInput) return null;

    const lat = Number(String(latInput.value).replace(',', '.'));
    const lon = Number(String(lonInput.value).replace(',', '.'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

    return { lat, lon };
}

function loadWeatherSettings() {
    const toggle = document.getElementById('weather-manual-toggle');
    const latInput = document.getElementById('weather-lat');
    const lonInput = document.getElementById('weather-lon');
    if (!toggle || !latInput || !lonInput) return;

    const manual = localStorage.getItem(WEATHER_MODE_KEY) === '1';
    toggle.checked = manual;
    latInput.value = localStorage.getItem(WEATHER_MANUAL_LAT_KEY) || '';
    lonInput.value = localStorage.getItem(WEATHER_MANUAL_LON_KEY) || '';
    setWeatherManualUI(manual);
}

async function refreshWeatherByCoordinates(lat, lon) {
    weatherCurrentCoords = { lat, lon };
    setCoordText(lat, lon);
    await loadAddress(lat, lon);
    await loadWeather(lat, lon);
    updateTimestamp();
}

function toggleWeatherManualMode() {
    const toggle = document.getElementById('weather-manual-toggle');
    if (!toggle) return;

    const manual = !!toggle.checked;
    localStorage.setItem(WEATHER_MODE_KEY, manual ? '1' : '0');
    setWeatherManualUI(manual);

    if (manual) applyManualCoordinates();
    else initWeather();
}

async function applyManualCoordinates() {
    const coords = getManualCoords();
    if (!coords) {
        document.getElementById('coord').textContent = t('manualCoordsInvalid');
        document.getElementById('address').textContent = t('manualCoordsHint');
        return;
    }

    localStorage.setItem(WEATHER_MANUAL_LAT_KEY, String(coords.lat));
    localStorage.setItem(WEATHER_MANUAL_LON_KEY, String(coords.lon));
    await refreshWeatherByCoordinates(coords.lat, coords.lon);
}

async function initWeather() {
    updateTimestamp();
    loadCurrentTime();

    const manual = document.getElementById('weather-manual-toggle')?.checked;
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
        async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            await refreshWeatherByCoordinates(lat, lon);
        },
        (err) => {
            if (err.code === 1) {
                setLocationError(t('geoNoAccess'));
            } else if (err.code === 2) {
                setLocationError(t('geoCoordFail'));
            } else if (err.code === 3) {
                setLocationError(t('geoTimeout'));
            } else {
                setLocationError(t('geoError'));
            }
            console.warn('Geolocation error:', err);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );

}

function setLocationError(message) {
    document.getElementById('coord').textContent = message;
    document.getElementById('address').textContent = t('geoCheckPermissions');
}

async function loadAddress(lat, lon) {
    try {
        const addrRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${currentLang}`);
        if (!addrRes.ok) throw new Error('Address request failed');
        const addr = await addrRes.json();
        const a = addr.address || {};
        const parts = [];

        if (a.city) parts.push(a.city);
        else if (a.town) parts.push(a.town);
        else if (a.village) parts.push(a.village);

        if (a.state) parts.push(a.state);
        if (a.country) parts.push(a.country);

        document.getElementById('address').textContent = parts.join(', ') || t('addressNotFound');
    } catch {
        document.getElementById('address').textContent = t('addressUnavailable');
    }
}

async function loadWeather(lat, lon) {
    try {
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=sunrise,sunset&timezone=auto`);
        if (!wRes.ok) throw new Error('Weather request failed');
        const w = await wRes.json();

        if (!w.current || !w.daily?.sunrise?.length || !w.daily?.sunset?.length) {
            throw new Error('Weather payload is incomplete');
        }

        document.getElementById('temp').textContent = w.current.temperature_2m;
        document.getElementById('humidity').textContent = w.current.relative_humidity_2m;
        document.getElementById('wind').textContent = w.current.wind_speed_10m;

        document.getElementById('sunrise').textContent = new Date(w.daily.sunrise[0]).toLocaleTimeString(getLocale(), {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        document.getElementById('sunset').textContent = new Date(w.daily.sunset[0]).toLocaleTimeString(getLocale(), {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch (e) {
        console.warn('Weather error:', e);
    }
}

async function loadCurrentTime() {
    try {
        const tRes = await fetch('https://worldtimeapi.org/api/ip');
        if (!tRes.ok) throw new Error('Time request failed');
        const t = await tRes.json();
        const d = new Date(t.datetime);

        document.getElementById('time').textContent = formatDateTime(d, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch {
        const d = new Date();
        document.getElementById('time').textContent = formatDateTime(d);
    }
}

function updateTimestamp() {
    document.getElementById('timestamp').textContent =
        `${t('updatedAt')}: ${formatDateTime(new Date())}`;
}

// ================== WORLD TIME ==================
let time24h = true;

function toggleTimeFormat() {
    time24h = !time24h;
    document.getElementById('time-format-btn').textContent = time24h ? t('timeFormat24') : t('timeFormat12');
    localStorage.setItem('timeFormat', time24h ? '24' : '12');
    updateWorldTime();
}

function loadTimeFormat() {
    const savedFormat = localStorage.getItem('timeFormat');
    if (savedFormat === '12') {
        time24h = false;
    }
    document.getElementById('time-format-btn').textContent = time24h ? t('timeFormat24') : t('timeFormat12');
}

function updateWorldTime() {
    const tz = document.getElementById('timezone-select').value;
    const now = new Date();
    const opts = tz === 'local' ? {} : { timeZone: tz };

    const timeStr = now.toLocaleTimeString(getLocale(), {
        ...opts,
        hour12: !time24h
    });

    document.getElementById('world-time').textContent = timeStr;
    document.getElementById('unix-time').textContent = `${t('unixLabel')}: ${Math.floor(now.getTime() / 1000)}`;
}

// ================== CALENDAR ==================
const CALENDAR_START_YEAR = 1970;
const CALENDAR_END_YEAR = 2100;
let calendarViewDate = new Date();

function renderCalendar() {
    const now = new Date();
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    const today = now.getDate();

    document.getElementById('calendar-month-year').textContent =
        new Date(year, month, 1).toLocaleString(getLocale(), { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const weekdays = currentLang === 'ru' ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = weekdays.map(day => `<div class=\"calendar-day weekday\">${day}</div>`).join('');

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    for (let d = 1; d <= lastDate; d++) {
        const cls = isCurrentMonth && d === today ? 'calendar-day today' : 'calendar-day';
        html += `<div class="${cls}">${d}</div>`;
    }

    document.getElementById('calendar-days').innerHTML = html;
}

function changeCalendarMonth(delta) {
    calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + delta, 1);
    renderCalendar();
}

function goToCurrentMonth() {
    const now = new Date();
    calendarViewDate = new Date(now.getFullYear(), now.getMonth(), 1);
    renderCalendar();
}

function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function parseDateInputValue(dateId) {
    const value = document.getElementById(dateId).value;
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    return { year: y, month: m, day: d };
}

function fillYearSelect(selectId, selectedYear) {
    const sel = document.getElementById(selectId);
    if (!sel) return;

    const prevValue = sel.value;
    sel.innerHTML = '';
    for (let year = CALENDAR_END_YEAR; year >= CALENDAR_START_YEAR; year--) {
        const option = new Option(String(year), String(year));
        sel.add(option);
    }

    const value = String(selectedYear || prevValue || new Date().getFullYear());
    if (sel.querySelector(`option[value="${value}"]`)) {
        sel.value = value;
    }
}

function syncYearSelectWithDate(dateId, yearSelectId) {
    const parsed = parseDateInputValue(dateId);
    if (!parsed) return;
    const yearSel = document.getElementById(yearSelectId);
    if (yearSel) yearSel.value = String(parsed.year);
}

function setDateYear(dateId, yearSelectId) {
    const dateEl = document.getElementById(dateId);
    const yearSel = document.getElementById(yearSelectId);
    const parsed = parseDateInputValue(dateId);
    if (!dateEl || !yearSel || !parsed) return;

    const targetYear = parseInt(yearSel.value, 10);
    if (!Number.isFinite(targetYear)) return;

    const monthIndex = parsed.month - 1;
    const maxDay = daysInMonth(targetYear, monthIndex);
    const safeDay = Math.min(parsed.day, maxDay);

    dateEl.value = `${targetYear}-${String(parsed.month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    syncYearSelectWithDate(dateId, yearSelectId);
}

function initDateYearSelects() {
    fillYearSelect('date1-year');
    fillYearSelect('date2-year');
    syncYearSelectWithDate('date1', 'date1-year');
    syncYearSelectWithDate('date2', 'date2-year');
}

function clampNumber(id, min, max) {
    const el = document.getElementById(id);
    let val = parseInt(el.value, 10);

    if (isNaN(val)) val = min;
    if (val < min) val = min;
    if (val > max) val = max;

    el.value = val;
    return val;
}

function getDateTime(dateId, hourId, minuteId) {
    const dateValue = document.getElementById(dateId).value;
    if (!dateValue) return null;

    const h = clampNumber(hourId, 0, 23);
    const m = clampNumber(minuteId, 0, 59);

    return new Date(`${dateValue}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
}

function diffYMD(start, end) {
    let y = end.getFullYear() - start.getFullYear();
    let m = end.getMonth() - start.getMonth();
    let d = end.getDate() - start.getDate();

    if (d < 0) {
        m--;
        const prevMonth = (end.getMonth() - 1 + 12) % 12;
        const prevYear = prevMonth === 11 ? end.getFullYear() - 1 : end.getFullYear();
        d += daysInMonth(prevYear, prevMonth);
    }

    if (m < 0) {
        y--;
        m += 12;
    }

    return { y, m, d };
}

function formatWeekday(date) {
    return date.toLocaleDateString(getLocale(), { weekday: 'long' });
}

function formatTime(date) {
    return date.toLocaleTimeString(getLocale(), {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function swapDates() {
    const date1 = document.getElementById('date1');
    const date2 = document.getElementById('date2');
    const time1h = document.getElementById('time1h');
    const time1m = document.getElementById('time1m');
    const time2h = document.getElementById('time2h');
    const time2m = document.getElementById('time2m');

    [date1.value, date2.value] = [date2.value, date1.value];
    [time1h.value, time2h.value] = [time2h.value, time1h.value];
    [time1m.value, time2m.value] = [time2m.value, time1m.value];
    syncYearSelectWithDate('date1', 'date1-year');
    syncYearSelectWithDate('date2', 'date2-year');

    calcDateDiff();
    syncBaseDateWithNow();
}

function syncBaseDateWithNow() {
    const useNow = document.getElementById('date-use-now')?.checked;
    const ids = ['date1', 'date1-year', 'time1h', 'time1m'];

    if (useNow) {
        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        document.getElementById('date1').value = localDate;
        document.getElementById('time1h').value = now.getHours();
        document.getElementById('time1m').value = now.getMinutes();
        syncYearSelectWithDate('date1', 'date1-year');
    }

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !!useNow;
    });
}

function calcDateDiff() {
    syncBaseDateWithNow();
    const d1 = getDateTime('date1', 'time1h', 'time1m');
    const d2 = getDateTime('date2', 'time2h', 'time2m');

    if (!d1 || !d2) {
        document.getElementById('date-diff').textContent = '--';
        return;
    }

    const inclusive = document.getElementById('date-inclusive').checked;
    const sign = d2 >= d1 ? 1 : -1;
    const start = sign >= 0 ? d1 : d2;
    const end = sign >= 0 ? d2 : d1;

    let diffMs = end - start;
    if (inclusive) diffMs += 24 * 60 * 60 * 1000;

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const remDays = totalDays % 7;

    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

    const ymd = diffYMD(
        new Date(start.getFullYear(), start.getMonth(), start.getDate()),
        new Date(end.getFullYear(), end.getMonth(), end.getDate())
    );

    const relation = sign >= 0 ? t('relationForward') : t('relationReverse');

    document.getElementById('date-diff').innerHTML =
        `${totalDays} ${t('dayShort')} ${hours} ${t('hourShort')} ${minutes} ${t('minShort')}<br>` +
        `${totalWeeks} ${t('weekShort')} ${remDays} ${t('dayShort')}<br>` +
        `${ymd.y} ${t('yearShort')} ${ymd.m} ${t('monthShort')} ${ymd.d} ${t('dayShort')}<br>` +
        `${formatWeekday(d1)} ${formatTime(d1)} → ${formatWeekday(d2)} ${formatTime(d2)}<br>` +
        `${relation}<br>` +
        `${t('totalMinutes')}: ${totalMinutes.toLocaleString(getLocale())}`;
}

// ================== UNIT CONVERTER ==================
let unitLabels = {
    en: {
        length: { m: 'm', km: 'km', cm: 'cm', mm: 'mm', in: 'inch', ft: 'ft', yd: 'yd', mile: 'mile', nmi: 'nautical mile' },
        area: { m2: 'm²', km2: 'km²', cm2: 'cm²', mm2: 'mm²', ft2: 'ft²', yd2: 'yd²', acre: 'acre', ha: 'ha' },
        volume: { l: 'l', ml: 'ml', m3: 'm³', cm3: 'cm³', gal: 'gal', qt: 'qt' },
        weight: { kg: 'kg', g: 'g', mg: 'mg', t: 't', lb: 'lb', oz: 'oz' },
        speed: { 'm/s': 'm/s', 'km/h': 'km/h', mph: 'mph', knot: 'knot', mach: 'Mach' },
        temperature: { C: '°C', F: '°F', K: 'K' },
        pressure: { pa: 'Pa', kpa: 'kPa', bar: 'bar', atm: 'atm', psi: 'psi', mmhg: 'mmHg' },
        energy: { j: 'J', kj: 'kJ', cal: 'cal', kcal: 'kcal', wh: 'Wh', kwh: 'kWh' }
    },
    ru: {
        length: { m: 'м', km: 'км', cm: 'см', mm: 'мм', in: 'дюйм', ft: 'фут', yd: 'ярд', mile: 'миля', nmi: 'мор. миля' },
        area: { m2: 'м²', km2: 'км²', cm2: 'см²', mm2: 'мм²', ft2: 'ft²', yd2: 'yd²', acre: 'акр', ha: 'га' },
        volume: { l: 'л', ml: 'мл', m3: 'м³', cm3: 'см³', gal: 'gal', qt: 'qt' },
        weight: { kg: 'кг', g: 'г', mg: 'мг', t: 'т', lb: 'lb', oz: 'oz' },
        speed: { 'm/s': 'м/с', 'km/h': 'км/ч', mph: 'mph', knot: 'уз', mach: 'Mach' },
        temperature: { C: '°C', F: '°F', K: 'K' },
        pressure: { pa: 'Па', kpa: 'кПа', bar: 'бар', atm: 'атм', psi: 'psi', mmhg: 'мм рт. ст.' },
        energy: { j: 'Дж', kj: 'кДж', cal: 'кал', kcal: 'ккал', wh: 'Вт⋅ч', kwh: 'кВт⋅ч' }
    }
};

let unitData = {
    length: { m: 1, km: 0.001, cm: 100, mm: 1000, in: 39.3700787402, ft: 3.280839895, yd: 1.0936132983, mile: 0.0006213711922, nmi: 0.000539956803 },
    area: { m2: 1, km2: 0.000001, cm2: 10000, mm2: 1000000, ft2: 10.763910417, yd2: 1.195990046, acre: 0.000247105381, ha: 0.0001 },
    volume: { l: 1, ml: 1000, m3: 0.001, cm3: 1000, gal: 0.2641720524, qt: 1.0566882094 },
    weight: { kg: 1, g: 1000, mg: 1000000, t: 0.001, lb: 2.2046226218, oz: 35.27396195 },
    speed: { 'm/s': 1, 'km/h': 3.6, mph: 2.2369362921, knot: 1.9438444924, mach: 0.0029154519 },
    temperature: { C: 'C', F: 'F', K: 'K' },
    pressure: { pa: 1, kpa: 0.001, bar: 0.00001, atm: 0.0000098692326672, psi: 0.00014503773773, mmhg: 0.007500616827 },
    energy: { j: 1, kj: 0.001, cal: 0.23900573614, kcal: 0.00023900573614, wh: 0.00027777777778, kwh: 2.7777777778e-7 }
};

let converterPresets = {
    length: [['m', 'ft'], ['km', 'mile'], ['mile', 'km']],
    area: [['m2', 'ft2'], ['ha', 'acre']],
    volume: [['l', 'gal'], ['m3', 'l']],
    weight: [['kg', 'lb'], ['g', 'oz']],
    speed: [['km/h', 'm/s'], ['mph', 'km/h']],
    temperature: [['C', 'F'], ['F', 'C'], ['C', 'K']],
    pressure: [['bar', 'psi'], ['atm', 'mmhg']],
    energy: [['kj', 'kcal'], ['kwh', 'kj']]
};

function unitText(type, key) {
    const labels = unitLabels[currentLang]?.[type] || unitLabels.en[type] || {};
    return `${key} (${labels[key] || key})`;
}

function renderConverterPresets(type) {
    const holder = document.getElementById('conv-presets');
    holder.innerHTML = '';

    (converterPresets[type] || []).forEach(([from, to]) => {
        const labels = unitLabels[currentLang]?.[type] || unitLabels.en[type] || {};
        const btn = document.createElement('button');
        btn.className = 'preset-chip';
        btn.type = 'button';
        btn.textContent = `${labels[from] || from} → ${labels[to] || to}`;
        btn.onclick = () => {
            document.getElementById('conv-from').value = from;
            document.getElementById('conv-to').value = to;
            convertUnit();
        };
        holder.appendChild(btn);
    });
}

function updateConvUnits() {
    const type = document.getElementById('conv-type').value;
    const fromSel = document.getElementById('conv-from');
    const toSel = document.getElementById('conv-to');

    fromSel.innerHTML = '';
    toSel.innerHTML = '';

    Object.keys(unitData[type]).forEach(u => {
        fromSel.add(new Option(unitText(type, u), u));
        toSel.add(new Option(unitText(type, u), u));
    });

    const defaults = {
        length: ['m', 'km'],
        area: ['m2', 'ha'],
        volume: ['l', 'gal'],
        weight: ['kg', 'lb'],
        speed: ['km/h', 'm/s'],
        temperature: ['C', 'F'],
        pressure: ['bar', 'psi'],
        energy: ['kj', 'kcal']
    };

    fromSel.value = defaults[type][0];
    toSel.value = defaults[type][1];
    renderConverterPresets(type);
    convertUnit();
}


function swapConvUnits() {
    const fromSel = document.getElementById('conv-from');
    const toSel = document.getElementById('conv-to');
    [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
    convertUnit();
}

function formatSmart(n, precision = 6) {
    if (!isFinite(n)) return '0';
    const abs = Math.abs(n);

    if (abs === 0) return '0';
    if (abs >= 1000000 || abs < 0.000001) return n.toExponential(Math.min(precision, 8));
    if (abs >= 1000) return formatNumber(n, { maximumFractionDigits: precision });
    if (abs >= 1) return formatNumber(n, { maximumFractionDigits: precision });
    return formatNumber(n, { maximumFractionDigits: Math.min(precision + 2, 12) });
}

function convertUnit() {
    const type = document.getElementById('conv-type').value;
    const from = document.getElementById('conv-from').value;
    const to = document.getElementById('conv-to').value;
    const val = parseFloat(document.getElementById('conv-val').value) || 0;
    const precision = parseInt(document.getElementById('conv-precision').value, 10) || 6;

    document.getElementById('conv-precision-value').textContent = precision;

    let res;

    if (type === 'temperature') {
        let c;
        if (from === 'C') c = val;
        else if (from === 'F') c = (val - 32) * 5 / 9;
        else c = val - 273.15;

        if (to === 'C') res = c;
        else if (to === 'F') res = c * 9 / 5 + 32;
        else res = c + 273.15;
    } else {
        const base = val / unitData[type][from];
        res = base * unitData[type][to];
    }

    const reverseRate = val !== 0 ? res / val : null;
    const labels = unitLabels[currentLang]?.[type] || unitLabels.en[type] || {};

    document.getElementById('conv-result').innerHTML =
        `${formatSmart(val, precision)} ${labels[from] || from}<br>` +
        `= ${formatSmart(res, precision)} ${labels[to] || to}` +
        (reverseRate !== null
            ? `<br><span class="small-text">${t('rateLabel')}: 1 ${labels[from] || from} = ${formatSmart(reverseRate, precision)} ${labels[to] || to}</span>`
            : '');
}

// ================== CALCULATOR ==================
let calcVal = '0';
let calcScientificMode = false;
const calcAllowed = /^[\d+\-*/().,%\s]*$/;
const calcHistory = [];

function renderCalcDisplay() {
    document.getElementById('calc-display').textContent = calcVal;
    document.getElementById('calc-expression-preview').textContent = `${t('calcExpression')}: ${calcVal}`;
}

function renderCalcHistory() {
    const el = document.getElementById('calc-history');

    if (!calcHistory.length) {
        el.textContent = t('calcEmptyHistory');
        return;
    }

    el.innerHTML = calcHistory
        .slice(-10)
        .reverse()
        .map(item => `<div class="calc-history-item">${item}</div>`)
        .join('');
}

function toggleCalcMode(toggle = true) {
    if (toggle) calcScientificMode = !calcScientificMode;
    document.getElementById('calc-mode-btn').textContent = calcScientificMode
        ? t('calcModeScientific')
        : t('calcModeBasic');

    document.querySelector('.calc-buttons').classList.toggle('calc-scientific', calcScientificMode);
}

function calcInput(ch) {
    if (calcVal === '0' && !['.', '**', '%'].includes(ch)) {
        calcVal = ch;
    } else {
        calcVal += ch;
    }

    renderCalcDisplay();
}

function calcBackspace() {
    calcVal = calcVal.length > 1 ? calcVal.slice(0, -1) : '0';
    renderCalcDisplay();
}

function calcClear() {
    calcVal = '0';
    renderCalcDisplay();
}

function factorial(n) {
    if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error('Factorial range');

    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

const calcFunctionHandlers = {
    sin: value => Math.sin(value * Math.PI / 180),
    cos: value => Math.cos(value * Math.PI / 180),
    tan: value => Math.tan(value * Math.PI / 180),
    sqrt: value => Math.sqrt(value),
    ln: value => Math.log(value),
    log: value => Math.log10(value),
    fact: value => factorial(value)
};

function calcFunction(fn) {
    try {
        const current = Number(calcEquals(true));

        const handler = calcFunctionHandlers[fn];
        if (!handler) throw new Error('Unknown function');

        const result = handler(current);

        if (!Number.isFinite(result)) throw new Error('Non-finite result');
        const exprLabel = `${fn}(${current})`;
        calcVal = result.toString();
        calcHistory.push(`${exprLabel} = ${calcVal}`);
        renderCalcHistory();
    } catch {
        calcVal = '0';
    }

    renderCalcDisplay();
}

function calcEquals(returnOnly = false) {
    let resultText = '0';

    try {
        let expr = calcVal.replace(/\s+/g, '');

        if (!expr || !calcAllowed.test(expr)) throw new Error('Invalid input');
        expr = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

        const openBrackets = (expr.match(/\(/g) || []).length;
        const closeBrackets = (expr.match(/\)/g) || []).length;
        if (openBrackets !== closeBrackets) throw new Error('Unbalanced brackets');

        const result = Function(`"use strict"; return (${expr})`)();
        if (!Number.isFinite(result)) throw new Error('Non-finite result');

        resultText = result.toString();

        if (!returnOnly) {
            calcHistory.push(`${calcVal} = ${resultText}`);
            calcVal = resultText;
            renderCalcHistory();
        }
    } catch {
        if (!returnOnly) calcVal = '0';
    }

    if (!returnOnly) renderCalcDisplay();
    return resultText;
}

// ================== TEXT ANALYSIS ==================
function analyzeText() {
    const t = document.getElementById('text-input').value;
    const lines = t.split('\n');
    const chars = t.length;
    const bytes = new Blob([t]).size;
    const words = t.trim() ? t.trim().split(/\s+/).length : 0;
    const spaces = (t.match(/ /g) || []).length;
    const maxLine = Math.max(...lines.map(l => l.length), 0);

    document.getElementById('text-analysis').innerHTML =
        (currentLang === 'ru'
            ? `Строк: ${lines.length} · Символов: ${chars} · UTF-8: ${(bytes / 1024).toFixed(2)} KB · Макс. строка: ${maxLine} · Слов: ${words} · Пробелов: ${spaces}`
            : `Lines: ${lines.length} · Characters: ${chars} · UTF-8: ${(bytes / 1024).toFixed(2)} KB · Max line: ${maxLine} · Words: ${words} · Spaces: ${spaces}`);
}

// ================== CURRENCY CONVERTER ==================
let rates = { USD: 1, EUR: 0.92, RUB: 92.5, GBP: 0.79, JPY: 151.5 };

async function loadRates(manual = false) {
    const status = document.getElementById('cur-data-status');
    if (manual && status) {
        status.textContent = t('ratesRefreshing');
    }

    try {
        const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!r.ok) throw new Error('Rates request failed');
        const d = await r.json();
        if (d && d.rates) rates = d.rates;

        if (status) {
            status.textContent = `${t('ratesUpdated')}: ` +
                new Date().toLocaleTimeString(getLocale(), { hour12: false });
        }
    } catch (e) {
        console.warn('Rates loading failed, fallback to built-in rates:', e);
        if (status) {
            status.textContent = t('ratesFallback');
        }
    }

    convertCurrency();
}

function swapCurrencyUnits() {
    const fromSel = document.getElementById('cur-from');
    const toSel = document.getElementById('cur-to');
    [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
    convertCurrency();
}

function convertCurrency() {
    const amt = parseFloat(document.getElementById('cur-amount').value) || 0;
    const from = document.getElementById('cur-from').value;
    const to = document.getElementById('cur-to').value;

    const usd = amt / rates[from];
    const res = usd * rates[to];

    document.getElementById('cur-result').textContent = `= ${res.toFixed(2)} ${to}`;
}

// ================== PWA ==================
function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('SW registration failed:', err);
    });
}

// ================== INITIALIZATION ==================
const WORLD_TIME_INTERVAL_MS = 1000;
const DATE_DIFF_SYNC_INTERVAL_MS = 60000;

function initApp() {
    loadTheme();
    loadWeatherSettings();
    initDateYearSelects();
    applyTranslations();
    loadTimeFormat();
    loadLastPage();

    renderCalendar();
    calcDateDiff();
    syncBaseDateWithNow();
    renderCalcDisplay();
    renderCalcHistory();
    updateConvUnits();
    loadRates();
    updateWorldTime();
    initWeather();
    registerServiceWorker();

    setInterval(updateWorldTime, WORLD_TIME_INTERVAL_MS);
    setInterval(() => {
        if (document.getElementById('date-use-now')?.checked) calcDateDiff();
    }, DATE_DIFF_SYNC_INTERVAL_MS);
}

window.addEventListener('load', initApp);

