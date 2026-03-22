import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addCurrentCoordinateToFavorites,
  applyManualCoordinates,
  initWeatherModule,
  removeFavoriteCoordinateDialog,
  renderWeatherFavorites,
  renderWeatherPresets,
  toggleWeatherManualMode,
} from "../features/weather.js";

function mountWeatherDom() {
  document.body.innerHTML = `
    <h2 id="title-weather"></h2>
    <div id="weather-main-title"></div>
    <div id="weather-sun-title"></div>
    <div id="weather-forecast-title"></div>
    <div id="forecast-morning-label"></div>
    <div id="forecast-day-label"></div>
    <div id="forecast-evening-label"></div>
    <div id="forecast-tomorrow-label"></div>
    <div id="sunrise-label"></div>
    <div id="sunset-label"></div>
    <div id="weather-manual-label"></div>
    <label id="weather-lat-label" for="weather-lat"></label>
    <label id="weather-lon-label" for="weather-lon"></label>
    <button id="weather-fav-add-btn"></button>
    <button id="weather-fav-remove-btn"></button>
    <div id="weather-fav-title"></div>
    <div id="weather-presets-title"></div>

    <input id="weather-manual-toggle" type="checkbox" />
    <input id="weather-lat" type="number" />
    <input id="weather-lon" type="number" />
    <button id="weather-apply-btn"></button>

    <div id="coord"></div>
    <div id="address"></div>
    <div id="temp"></div>
    <div id="humidity"></div>
    <div id="wind"></div>
    <div id="pressure"></div>
    <div id="sunrise"></div>
    <div id="sunset"></div>
    <div id="weather-condition"></div>
    <div id="forecast-morning"></div>
    <div id="forecast-day"></div>
    <div id="forecast-evening"></div>
    <div id="forecast-tomorrow"></div>
    <div id="forecast-tomorrow-desc"></div>
    <div id="weather-data-source"></div>
    <div id="weather-favorites-list"></div>
    <div id="weather-presets-list"></div>
    <div id="timestamp"></div>
    <div id="time"></div>
  `;
}

function createWeatherPayload() {
  return {
    current: {
      temperature_2m: 12,
      relative_humidity_2m: 76,
      wind_speed_10m: 6,
      pressure_msl: 1013.2,
      weather_code: 3,
    },
    hourly: {
      time: ["2026-03-20T09:00", "2026-03-20T14:00", "2026-03-20T20:00"],
      temperature_2m: [8, 13, 9],
    },
    daily: {
      time: ["2026-03-20", "2026-03-21"],
      sunrise: ["2026-03-20T06:10:00"],
      sunset: ["2026-03-20T18:20:00"],
      temperature_2m_max: [13, 14],
      temperature_2m_min: [7, 6],
      weather_code: [3, 61],
    },
  };
}

function installFetchMock({ weatherOk = true } = {}) {
  const fetchMock = vi.fn(async (url) => {
    if (String(url).includes("nominatim.openstreetmap.org")) {
      return {
        ok: true,
        json: async () => ({
          address: { city: "Moscow", state: "Moscow", country: "Russia" },
        }),
      };
    }

    if (String(url).includes("api.open-meteo.com")) {
      if (!weatherOk) {
        return { ok: false, json: async () => ({}) };
      }
      return { ok: true, json: async () => createWeatherPayload() };
    }

    return {
      ok: true,
      json: async () => ({ datetime: "2026-03-20T12:00:00Z" }),
    };
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("weather module", () => {
  let warnSpy;

  beforeEach(() => {
    localStorage.clear();
    mountWeatherDom();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal(
      "prompt",
      vi.fn(() => "Home"),
    );
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy?.mockRestore();
    vi.unstubAllGlobals();
  });

  it("shows validation error for invalid manual coordinates", async () => {
    document.getElementById("weather-lat").value = "91";
    document.getElementById("weather-lon").value = "181";

    await applyManualCoordinates();

    expect(document.getElementById("coord")?.textContent).toBe(
      "manualCoordsInvalid",
    );
    expect(document.getElementById("address")?.textContent).toBe(
      "manualCoordsHint",
    );
  });

  it("loads address and weather for valid manual coordinates", async () => {
    installFetchMock();
    document.getElementById("weather-lat").value = "55.7558";
    document.getElementById("weather-lon").value = "37.6173";

    await applyManualCoordinates();

    expect(document.getElementById("coord")?.textContent).toContain("55.7558");
    expect(document.getElementById("address")?.textContent).toContain("Moscow");
    expect(document.getElementById("temp")?.textContent).toBe("12");
    expect(document.getElementById("pressure")?.textContent).toBe("760");
    expect(document.getElementById("forecast-morning")?.textContent).toContain(
      "8",
    );
    expect(
      document.getElementById("weather-data-source")?.textContent,
    ).toContain("api.open-meteo.com");
  });

  it("falls back to unavailable source when weather API fails", async () => {
    installFetchMock({ weatherOk: false });
    document.getElementById("weather-lat").value = "55.7558";
    document.getElementById("weather-lon").value = "37.6173";

    await applyManualCoordinates();

    expect(
      document.getElementById("weather-data-source")?.textContent,
    ).toContain("weatherSourceUnavailable");
    expect(document.getElementById("forecast-tomorrow")?.textContent).toBe(
      "--°C / --°C",
    );
  });

  it("toggles manual mode and stores state", () => {
    const toggle = document.getElementById("weather-manual-toggle");
    toggle.checked = true;

    toggleWeatherManualMode();

    expect(localStorage.getItem("weatherManualMode")).toBe("1");
    expect(document.getElementById("weather-lat")?.disabled).toBe(false);
    expect(document.getElementById("weather-lon")?.disabled).toBe(false);
    expect(document.getElementById("weather-apply-btn")?.disabled).toBe(false);
  });

  it("adds/removes favorite coordinates and renders presets", async () => {
    installFetchMock();
    document.getElementById("weather-lat").value = "55.7558";
    document.getElementById("weather-lon").value = "37.6173";
    await applyManualCoordinates();

    addCurrentCoordinateToFavorites();
    renderWeatherFavorites();

    const favorites = JSON.parse(
      localStorage.getItem("weatherFavorites") || "[]",
    );
    expect(favorites.length).toBe(1);
    expect(favorites[0].isHome).toBe(true);
    expect(
      document.getElementById("weather-favorites-list")?.textContent,
    ).toContain("Home");

    removeFavoriteCoordinateDialog();
    expect(
      document.getElementById("weather-favorites-list")?.textContent,
    ).toContain("noFavorites");

    renderWeatherPresets();
    expect(
      document.getElementById("weather-presets-list")?.children.length,
    ).toBeGreaterThan(20);
  });

  it("uses weather source label and localized favorite action titles", async () => {
    installFetchMock();
    document.getElementById("weather-lat").value = "55.7558";
    document.getElementById("weather-lon").value = "37.6173";
    await applyManualCoordinates();
    addCurrentCoordinateToFavorites();
    renderWeatherFavorites();

    const sourceText = document.getElementById(
      "weather-data-source",
    )?.textContent;
    expect(sourceText).toContain("weatherSourceLabel");

    const actionButtons = document.querySelectorAll(
      "#weather-favorites-list .weather-fav-mini-btn",
    );
    expect(actionButtons.length).toBeGreaterThanOrEqual(3);
    expect(actionButtons[0]?.getAttribute("aria-label")).toMatch(
      /weather(HomePoint|SetAsHome)/,
    );
    expect(actionButtons[1]?.getAttribute("aria-label")).toBe("weatherRename");
    expect(actionButtons[2]?.getAttribute("aria-label")).toBe("weatherDelete");
  });

  it("initWeatherModule is safe when called repeatedly", () => {
    installFetchMock();
    expect(() => initWeatherModule()).not.toThrow();
    expect(() => initWeatherModule()).not.toThrow();
  });
});
