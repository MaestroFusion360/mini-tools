import { byId } from './dom.js';
import { STORAGE_KEYS, getStored, setStored } from './state.js';

function setThemeToggleIcon(isDark) {
    const toggle = byId('theme-toggle');
    if (!toggle) return;

    const iconName = isDark ? 'i-sun' : 'i-moon';
    const iconAlt = isDark ? 'Light mode' : 'Dark mode';
    toggle.innerHTML = `<svg class="icon-svg theme-toggle-icon" aria-label="${iconAlt}"><use href="#${iconName}"></use></svg>`;
}

export function toggleTheme() {
    const body = document.body;
    const nextDark = !body.classList.contains('dark');
    body.classList.toggle('dark', nextDark);
    setThemeToggleIcon(nextDark);
    setStored(STORAGE_KEYS.theme, nextDark ? 'dark' : 'light');
}

export function initTheme() {
    const savedTheme = getStored(STORAGE_KEYS.theme, 'light');
    const isDark = savedTheme === 'dark';
    document.body.classList.toggle('dark', isDark);
    setThemeToggleIcon(isDark);
}
