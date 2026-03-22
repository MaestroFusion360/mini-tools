import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function mountWorldTimeDom(zone = "local") {
  document.body.innerHTML = `
    <h2 id="title-time"></h2>
    <select id="timezone-select">
      <option value="local">Local</option>
      <option value="America/New_York">NY</option>
      <option value="Europe/Moscow">Moscow</option>
      <option value="Invalid/Zone">Invalid</option>
    </select>
    <button id="time-format-btn"></button>
    <div id="world-time"></div>
    <div id="unix-time"></div>
  `;
  document.getElementById("timezone-select").value = zone;
}

async function importWorldTimeModule() {
  vi.resetModules();
  return import("../features/world-time.js");
}

describe("world time modes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:34:56Z"));
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("falls back to local when timezone is invalid", async () => {
    mountWorldTimeDom("Invalid/Zone");
    const { initWorldTime } = await importWorldTimeModule();

    initWorldTime();
    expect(document.getElementById("timezone-select")?.value).toBe("local");
  });

  it("toggles between 24h and 12h mode and persists format", async () => {
    mountWorldTimeDom("local");
    const { initWorldTime, toggleTimeFormat } = await importWorldTimeModule();

    initWorldTime();
    expect(document.getElementById("time-format-btn")?.textContent).toBe(
      "timeFormat24",
    );

    toggleTimeFormat();
    expect(document.getElementById("time-format-btn")?.textContent).toBe(
      "timeFormat12",
    );
    expect(localStorage.getItem("timeFormat")).toBe("12");
  });

  it("updates displayed world and unix time", async () => {
    mountWorldTimeDom("America/New_York");
    const { initWorldTime, updateWorldTime } = await importWorldTimeModule();

    initWorldTime();
    updateWorldTime();

    const worldTime = document.getElementById("world-time")?.textContent || "";
    const unixText = document.getElementById("unix-time")?.textContent || "";

    expect(worldTime.length).toBeGreaterThan(0);
    expect(unixText).toContain("unixLabel:");
  });

  it("initWorldTime is safe when called repeatedly", async () => {
    mountWorldTimeDom("local");
    const { initWorldTime } = await importWorldTimeModule();

    expect(() => initWorldTime()).not.toThrow();
    expect(() => initWorldTime()).not.toThrow();
    expect(document.getElementById("time-format-btn")?.textContent).toBe(
      "timeFormat24",
    );
  });
});
