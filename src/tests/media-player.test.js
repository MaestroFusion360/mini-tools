import { beforeEach, describe, expect, it, vi } from "vitest";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";
import {
  initMediaPlayer,
  mediaClearPlaylist,
  mediaNext,
} from "../features/media-player.js";

function mountMediaDom() {
  document.body.innerHTML = `
    <input id="media-files-input" type="file" multiple />
    <select id="media-playlist"></select>
    <div id="media-now-playing"></div>
    <video id="media-player"></video>
  `;

  const player = document.getElementById("media-player");
  player.load = vi.fn();
  player.play = vi.fn(() => Promise.resolve());
  player.pause = vi.fn();
}

describe("media player unit", () => {
  beforeEach(() => {
    FEATURE_RUNTIME_STATE.mediaPlayer.items = [];
    FEATURE_RUNTIME_STATE.mediaPlayer.index = -1;
    FEATURE_RUNTIME_STATE.mediaPlayer.initialized = false;

    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn((file) => `blob:${file.name}`),
      revokeObjectURL: vi.fn(),
    });

    mountMediaDom();
    initMediaPlayer();
  });

  it("renders empty playlist on init", () => {
    const playlist = document.getElementById("media-playlist");
    expect(playlist.disabled).toBe(true);
    expect(playlist.options.length).toBe(1);
    expect(document.getElementById("media-now-playing")?.textContent).toBe(
      "mediaNoFileSelected",
    );
  });

  it("loads files, plays first, supports next and clear", async () => {
    const input = document.getElementById("media-files-input");
    const fileA = new File(["a"], "track-a.mp3", { type: "audio/mpeg" });
    const fileB = new File(["b"], "track-b.mp3", { type: "audio/mpeg" });

    Object.defineProperty(input, "files", {
      configurable: true,
      value: [fileA, fileB],
    });
    input.dispatchEvent(new Event("change"));

    const playlist = document.getElementById("media-playlist");
    expect(playlist.disabled).toBe(false);
    expect(playlist.options.length).toBe(2);
    expect(document.getElementById("media-now-playing")?.textContent).toContain(
      "track-a.mp3",
    );

    mediaNext();
    expect(document.getElementById("media-now-playing")?.textContent).toContain(
      "track-b.mp3",
    );

    mediaClearPlaylist();
    expect(playlist.disabled).toBe(true);
    expect(playlist.options.length).toBe(1);
    expect(document.getElementById("media-now-playing")?.textContent).toBe(
      "mediaNoFileSelected",
    );
  });
});
