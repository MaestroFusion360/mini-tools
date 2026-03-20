import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addStopwatchLap,
  initStopwatch,
  resetStopwatch,
  toggleStopwatch,
} from "../features/stopwatch.js";

function mountStopwatchDom() {
  document.body.innerHTML = `
    <h2 id="title-stopwatch"></h2>
    <div id="stopwatch-display"></div>
    <button id="stopwatch-start-btn"></button>
    <button id="stopwatch-lap-btn"></button>
    <button id="stopwatch-reset-btn"></button>
    <div id="stopwatch-laps-title"></div>
    <div id="stopwatch-laps"></div>
    <div id="app-toast"></div>
  `;
}

describe("stopwatch modes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    vi.stubGlobal("alert", vi.fn());
    mountStopwatchDom();
    initStopwatch();
    resetStopwatch();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("supports start, pause and resume", () => {
    toggleStopwatch();
    vi.advanceTimersByTime(120);
    toggleStopwatch();

    const pausedDisplay =
      document.getElementById("stopwatch-display")?.textContent;
    expect(pausedDisplay).not.toBe("00:00:00.00");
    expect(document.getElementById("stopwatch-start-btn")?.textContent).toBe(
      "stopwatchResume",
    );

    toggleStopwatch();
    expect(document.getElementById("stopwatch-start-btn")?.textContent).toBe(
      "stopwatchPause",
    );
  });

  it("records lap only after stopwatch has elapsed", () => {
    addStopwatchLap();
    expect(document.getElementById("stopwatch-laps")?.textContent).toBe(
      "stopwatchNoLaps",
    );

    toggleStopwatch();
    vi.advanceTimersByTime(140);
    addStopwatchLap();

    const lapsText =
      document.getElementById("stopwatch-laps")?.textContent || "";
    expect(lapsText).toContain("#1:");
  });

  it("resets elapsed time and lap history", () => {
    toggleStopwatch();
    vi.advanceTimersByTime(120);
    addStopwatchLap();
    resetStopwatch();

    expect(document.getElementById("stopwatch-display")?.textContent).toBe(
      "00:00:00.00",
    );
    expect(document.getElementById("stopwatch-laps")?.textContent).toBe(
      "stopwatchNoLaps",
    );
  });
});

