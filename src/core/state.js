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
