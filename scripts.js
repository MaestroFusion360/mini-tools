// ================== ТЕМА И LOCALSTORAGE ==================
function toggleTheme() {
    const body = document.body;
    const toggle = document.getElementById('theme-toggle');

    if (body.classList.contains('dark')) {
        body.classList.remove('dark');
        toggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark');
        toggle.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const toggle = document.getElementById('theme-toggle');

    if (savedTheme === 'dark') {
        body.classList.add('dark');
        toggle.textContent = '☀️';
    } else {
        body.classList.remove('dark');
        toggle.textContent = '🌙';
    }
}

// ================== НАВИГАЦИЯ ==================
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    localStorage.setItem('lastPage', id);
}

function loadLastPage() {
    const lastPage = localStorage.getItem('lastPage');
    if (lastPage && document.getElementById(lastPage)) {
        showPage(lastPage);
    }
}

function exitApp() {
    if (confirm('Закрыть приложение?')) {
        window.close();
    }
}

// ================== ПОГОДА ==================
async function initWeather() {
    updateTimestamp();

    if (!('geolocation' in navigator)) {
        setLocationError('Геолокация не поддерживается');
        return;
    }

    try {
        if ('permissions' in navigator && navigator.permissions?.query) {
            const status = await navigator.permissions.query({ name: 'geolocation' });

            if (status.state === 'denied') {
                setLocationError('Доступ к геолокации запрещён в браузере');
                return;
            }
        }
    } catch {
        
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            document.getElementById('coord').textContent = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;

            await loadAddress(lat, lon);
            await loadWeather(lat, lon);
            updateTimestamp();
        },
        (err) => {
            if (err.code === 1) {
                setLocationError('Нет доступа к местоположению');
            } else if (err.code === 2) {
                setLocationError('Не удалось определить координаты');
            } else if (err.code === 3) {
                setLocationError('Истекло время ожидания геолокации');
            } else {
                setLocationError('Ошибка геолокации');
            }
            console.warn('Geolocation error:', err);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );

    loadCurrentTime();
}

function setLocationError(message) {
    document.getElementById('coord').textContent = message;
    document.getElementById('address').textContent = 'Проверь разрешение браузера и GPS';
}

async function loadAddress(lat, lon) {
    try {
        const addrRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`);
        const addr = await addrRes.json();
        const a = addr.address || {};
        const parts = [];

        if (a.city) parts.push(a.city);
        else if (a.town) parts.push(a.town);
        else if (a.village) parts.push(a.village);

        if (a.state) parts.push(a.state);
        if (a.country) parts.push(a.country);

        document.getElementById('address').textContent = parts.join(', ') || 'Адрес не найден';
    } catch {
        document.getElementById('address').textContent = 'Адрес недоступен';
    }
}

async function loadWeather(lat, lon) {
    try {
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=sunrise,sunset&timezone=auto`);
        const w = await wRes.json();

        document.getElementById('temp').textContent = w.current.temperature_2m;
        document.getElementById('humidity').textContent = w.current.relative_humidity_2m;
        document.getElementById('wind').textContent = w.current.wind_speed_10m;

        document.getElementById('sunrise').textContent = new Date(w.daily.sunrise[0]).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        document.getElementById('sunset').textContent = new Date(w.daily.sunset[0]).toLocaleTimeString('ru-RU', {
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
        const t = await tRes.json();
        const d = new Date(t.datetime);

        document.getElementById('time').textContent = d.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');
    } catch {
        const d = new Date();
        document.getElementById('time').textContent = d.toLocaleString('ru-RU', { hour12: false }).replace(',', '');
    }
}

function updateTimestamp() {
    document.getElementById('timestamp').textContent =
        'Обновлено: ' + new Date().toLocaleString('ru-RU', { hour12: false });
}

// ================== МИРОВОЕ ВРЕМЯ ==================
let time24h = true;

function toggleTimeFormat() {
    time24h = !time24h;
    document.getElementById('time-format-btn').textContent = time24h ? '24ч' : '12ч';
    localStorage.setItem('timeFormat', time24h ? '24' : '12');
    updateWorldTime();
}

function loadTimeFormat() {
    const savedFormat = localStorage.getItem('timeFormat');
    if (savedFormat === '12') {
        time24h = false;
        document.getElementById('time-format-btn').textContent = '12ч';
    }
}

function updateWorldTime() {
    const tz = document.getElementById('timezone-select').value;
    const now = new Date();
    const opts = tz === 'local' ? {} : { timeZone: tz };

    const timeStr = now.toLocaleTimeString(time24h ? 'ru-RU' : 'en-US', {
        ...opts,
        hour12: !time24h
    });

    document.getElementById('world-time').textContent = timeStr;
    document.getElementById('unix-time').textContent = `Unix: ${Math.floor(now.getTime() / 1000)}`;
}

// ================== КАЛЕНДАРЬ ==================
function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    document.getElementById('calendar-month-year').textContent =
        now.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    let html = `
        <div class="calendar-day weekday">Вс</div>
        <div class="calendar-day weekday">Пн</div>
        <div class="calendar-day weekday">Вт</div>
        <div class="calendar-day weekday">Ср</div>
        <div class="calendar-day weekday">Чт</div>
        <div class="calendar-day weekday">Пт</div>
        <div class="calendar-day weekday">Сб</div>
    `;

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    for (let d = 1; d <= lastDate; d++) {
        const cls = d === today ? 'calendar-day today' : 'calendar-day';
        html += `<div class="${cls}">${d}</div>`;
    }

    document.getElementById('calendar-days').innerHTML = html;
}

function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
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
    return date.toLocaleDateString('ru-RU', { weekday: 'long' });
}

function formatTime(date) {
    return date.toLocaleTimeString('ru-RU', {
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

    calcDateDiff();
}

function calcDateDiff() {
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

    const relation = sign >= 0 ? 'от первой до второй' : 'от второй до первой';

    document.getElementById('date-diff').innerHTML =
        `${totalDays} дн ${hours} ч ${minutes} мин<br>` +
        `${totalWeeks} нед ${remDays} дн<br>` +
        `${ymd.y} г ${ymd.m} мес ${ymd.d} дн<br>` +
        `${formatWeekday(d1)} ${formatTime(d1)} → ${formatWeekday(d2)} ${formatTime(d2)}<br>` +
        `${relation}<br>` +
        `Всего минут: ${totalMinutes.toLocaleString('ru-RU')}`;
}

// ================== КОНВЕРТЕР ЕДИНИЦ ==================
const unitLabels = {
    length: { m: 'м', km: 'км', cm: 'см', mm: 'мм', in: 'дюйм', ft: 'фут', yd: 'ярд', mile: 'миля' },
    area: { m2: 'м²', km2: 'км²', cm2: 'см²', mm2: 'мм²', ft2: 'ft²', yd2: 'yd²', acre: 'acre', ha: 'га' },
    volume: { l: 'л', ml: 'мл', m3: 'м³', cm3: 'см³', gal: 'gal', qt: 'qt' },
    weight: { kg: 'кг', g: 'г', mg: 'мг', t: 'т', lb: 'lb', oz: 'oz' },
    speed: { 'm/s': 'м/с', 'km/h': 'км/ч', mph: 'mph', knot: 'уз' },
    temperature: { C: '°C', F: '°F', K: 'K' }
};

const unitData = {
    length: { m: 1, km: 0.001, cm: 100, mm: 1000, in: 39.3700787402, ft: 3.280839895, yd: 1.0936132983, mile: 0.0006213711922 },
    area: { m2: 1, km2: 0.000001, cm2: 10000, mm2: 1000000, ft2: 10.763910417, yd2: 1.195990046, acre: 0.000247105381, ha: 0.0001 },
    volume: { l: 1, ml: 1000, m3: 0.001, cm3: 1000, gal: 0.2641720524, qt: 1.0566882094 },
    weight: { kg: 1, g: 1000, mg: 1000000, t: 0.001, lb: 2.2046226218, oz: 35.27396195 },
    speed: { 'm/s': 1, 'km/h': 3.6, mph: 2.2369362921, knot: 1.9438444924 },
    temperature: { C: 'C', F: 'F', K: 'K' }
};

function unitText(type, key) {
    return `${key} (${unitLabels[type][key] || key})`;
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
        temperature: ['C', 'F']
    };

    fromSel.value = defaults[type][0];
    toSel.value = defaults[type][1];
    convertUnit();
}

function swapConvUnits() {
    const fromSel = document.getElementById('conv-from');
    const toSel = document.getElementById('conv-to');
    [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
    convertUnit();
}

function formatSmart(n) {
    if (!isFinite(n)) return '0';
    const abs = Math.abs(n);

    if (abs === 0) return '0';
    if (abs >= 1000000 || abs < 0.000001) return n.toExponential(6);
    if (abs >= 1000) return n.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
    if (abs >= 1) return n.toLocaleString('ru-RU', { maximumFractionDigits: 6 });
    return n.toLocaleString('ru-RU', { maximumFractionDigits: 8 });
}

function convertUnit() {
    const type = document.getElementById('conv-type').value;
    const from = document.getElementById('conv-from').value;
    const to = document.getElementById('conv-to').value;
    const val = parseFloat(document.getElementById('conv-val').value) || 0;

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

    document.getElementById('conv-result').innerHTML =
        `${formatSmart(val)} ${unitLabels[type][from] || from}<br>= ${formatSmart(res)} ${unitLabels[type][to] || to}`;
}

// ================== КАЛЬКУЛЯТОР ==================
let calcVal = '0';

function calcInput(ch) {
    if (calcVal === '0' && ch !== '.') calcVal = ch;
    else calcVal += ch;

    document.getElementById('calc-display').textContent = calcVal;
}

function calcClear() {
    calcVal = '0';
    document.getElementById('calc-display').textContent = calcVal;
}

function calcEquals() {
    try {
        calcVal = Function(`"use strict"; return (${calcVal})`)().toString();
    } catch {
        calcVal = '0';
    }

    document.getElementById('calc-display').textContent = calcVal;
}

// ================== АНАЛИЗ ТЕКСТА ==================
function analyzeText() {
    const t = document.getElementById('text-input').value;
    const lines = t.split('\n');
    const chars = t.length;
    const bytes = new Blob([t]).size;
    const words = t.trim() ? t.trim().split(/\s+/).length : 0;
    const spaces = (t.match(/ /g) || []).length;
    const maxLine = Math.max(...lines.map(l => l.length), 0);

    document.getElementById('text-analysis').innerHTML =
        `Строк:${lines.length} Символов:${chars} UTF-8 ${(bytes / 1024).toFixed(2)}KB Макс.строка:${maxLine} Слов:${words} Пробелов:${spaces}`;
}

// ================== КОНВЕРТЕР ВАЛЮТ ==================
let rates = { USD: 1, EUR: 0.92, RUB: 92.5, GBP: 0.79, JPY: 151.5 };

async function loadRates() {
    try {
        const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const d = await r.json();
        if (d && d.rates) rates = d.rates;
    } catch {}

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
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(err => {
                console.warn('SW registration failed:', err);
            });
        });
    }
}

// ================== ИНИЦИАЛИЗАЦИЯ ==================
window.onload = function () {
    loadTheme();
    loadTimeFormat();
    loadLastPage();

    renderCalendar();
    calcDateDiff();
    updateConvUnits();
    loadRates();
    updateWorldTime();
    initWeather();
    registerServiceWorker();

    setInterval(updateWorldTime, 1000);
};