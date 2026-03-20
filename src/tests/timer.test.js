import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  initTimer,
  resetTimer,
  syncTimerFromInputs,
  toggleTimer,
} from "../features/timer.js";

function mountTimerDom() {
  document.body.innerHTML = `
    <h2 id="title-timer"></h2>
    <label id="timer-hours-label" for="timer-hours"></label>
    <label id="timer-minutes-label" for="timer-minutes"></label>
    <label id="timer-seconds-label" for="timer-seconds"></label>
    <input id="timer-hours" type="number" value="0" />
    <input id="timer-minutes" type="number" value="0" />
    <input id="timer-seconds" type="number" value="0" />
    <div id="timer-display"></div>
    <div id="timer-status"></div>
    <button id="timer-start-btn"></button>
    <button id="timer-reset-btn"></button>
    <div id="app-toast"></div>
  `;
}

describe("timer modes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    vi.stubGlobal("alert", vi.fn());
    mountTimerDom();
    initTimer();
    resetTimer();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("clamps input values and syncs display", () => {
    document.getElementById("timer-hours").value = "120";
    document.getElementById("timer-minutes").value = "99";
    document.getElementById("timer-seconds").value = "61";

    syncTimerFromInputs();

    expect(document.getElementById("timer-hours")?.value).toBe("99");
    expect(document.getElementById("timer-minutes")?.value).toBe("59");
    expect(document.getElementById("timer-seconds")?.value).toBe("59");
    expect(document.getElementById("timer-display")?.textContent).toBe(
      "99:59:59",
    );
  });

  it("supports start, pause and resume states", () => {
    document.getElementById("timer-seconds").value = "5";
    syncTimerFromInputs();

    toggleTimer();
    expect(document.getElementById("timer-start-btn")?.textContent).toBe(
      "timerPause",
    );

    vi.advanceTimersByTime(2000);
    expect(document.getElementById("timer-display")?.textContent).toBe(
      "00:00:03",
    );

    toggleTimer();
    expect(document.getElementById("timer-status")?.textContent).toBe(
      "timerPaused",
    );

    toggleTimer();
    expect(document.getElementById("timer-status")?.textContent).toBe(
      "timerRunning",
    );
  });

  it("finishes countdown and shows done state", () => {
    document.getElementById("timer-seconds").value = "1";
    syncTimerFromInputs();

    toggleTimer();
    vi.advanceTimersByTime(1500);

    expect(document.getElementById("timer-display")?.textContent).toBe(
      "00:00:00",
    );
    expect(document.getElementById("timer-status")?.textContent).toBe(
      "timerDone",
    );
    expect(document.getElementById("app-toast")?.textContent).toBe(
      "timerFinishedToast",
    );
  });
});

