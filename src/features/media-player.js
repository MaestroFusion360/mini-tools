import { byId } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";

const mediaState = FEATURE_RUNTIME_STATE.mediaPlayer;

function ensureMediaState() {
  if (!Array.isArray(mediaState.items)) {
    mediaState.items = [];
  }
  if (!Number.isInteger(mediaState.index)) {
    mediaState.index = -1;
  }
  if (typeof mediaState.initialized !== "boolean") {
    mediaState.initialized = false;
  }
}

function isFullscreenActive() {
  const doc = document;
  return Boolean(
    doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.msFullscreenElement
  );
}

function recoverAfterFullscreenExit() {
  ensureMediaState();
  const player = getPlayer();
  if (!player) return;

  // Some browsers can leave the page in a "half-locked" interactive state
  // after leaving native video fullscreen. Force-reset focus and layout.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  player.blur();
  player.style.pointerEvents = "auto";

  // Toggle controls to force refresh of native video UI layer.
  const hadControls = player.controls;
  player.controls = false;
  void player.offsetHeight;
  player.controls = hadControls;
}

function handleFullscreenChange() {
  if (isFullscreenActive()) return;
  requestAnimationFrame(() => {
    recoverAfterFullscreenExit();
  });
}

function getPlayer() {
  return byId("media-player");
}

function getPlaylist() {
  return byId("media-playlist");
}

function getNowLabel() {
  return byId("media-now-playing");
}

function refreshPlaylistUi() {
  ensureMediaState();
  const select = getPlaylist();
  if (!select) return;
  select.innerHTML = "";
  if (!mediaState.items.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("mediaPlaylistEmpty");
    select.append(option);
    select.disabled = true;
    return;
  }
  mediaState.items.forEach((item, idx) => {
    const option = document.createElement("option");
    option.value = String(idx);
    option.textContent = item.name;
    select.append(option);
  });
  select.disabled = false;
  if (mediaState.index >= 0) select.value = String(mediaState.index);
}

function updateNowPlaying() {
  ensureMediaState();
  const label = getNowLabel();
  if (!label) return;
  if (mediaState.index < 0 || !mediaState.items[mediaState.index]) {
    label.textContent = t("mediaNoFileSelected");
    return;
  }
  label.textContent = `${t("mediaNowPlaying")}: ${mediaState.items[mediaState.index].name}`;
}

function playIndex(nextIndex) {
  ensureMediaState();
  const player = getPlayer();
  if (!player) return;
  if (nextIndex < 0 || nextIndex >= mediaState.items.length) return;
  mediaState.index = nextIndex;
  const item = mediaState.items[nextIndex];
  player.src = item.url;
  player.load();
  player.play().catch((err) => {
    console.debug("Media play() was blocked:", err);
  });
  refreshPlaylistUi();
  updateNowPlaying();
}

function revokeAllUrls() {
  ensureMediaState();
  mediaState.items.forEach((item) => URL.revokeObjectURL(item.url));
}

export function mediaOpenFilesDialog() {
  byId("media-files-input")?.click();
}

export function mediaPlaySelected() {
  ensureMediaState();
  const selected = Number(getPlaylist()?.value || -1);
  if (!Number.isInteger(selected) || selected < 0) return;
  playIndex(selected);
}

export function mediaPrev() {
  ensureMediaState();
  if (!mediaState.items.length) return;
  const next =
    mediaState.index <= 0 ? mediaState.items.length - 1 : mediaState.index - 1;
  playIndex(next);
}

export function mediaNext() {
  ensureMediaState();
  if (!mediaState.items.length) return;
  const next = (mediaState.index + 1) % mediaState.items.length;
  playIndex(next);
}

export function mediaClearPlaylist() {
  ensureMediaState();
  revokeAllUrls();
  mediaState.items = [];
  mediaState.index = -1;
  const player = getPlayer();
  if (player) {
    player.pause();
    player.removeAttribute("src");
    player.load();
  }
  refreshPlaylistUi();
  updateNowPlaying();
}

export function initMediaPlayer() {
  ensureMediaState();
  if (mediaState.initialized) return;
  mediaState.initialized = true;

  const filesInput = byId("media-files-input");
  if (filesInput) {
    filesInput.addEventListener("change", (event) => {
      const files = Array.from(event.target?.files || []);
      if (!files.length) return;
      files.forEach((file) => {
        mediaState.items.push({
          name: file.name,
          url: URL.createObjectURL(file),
        });
      });
      refreshPlaylistUi();
      if (mediaState.index < 0) playIndex(0);
      filesInput.value = "";
    });
  }

  const player = getPlayer();
  if (player) {
    player.addEventListener("ended", () => {
      if (mediaState.items.length > 1) mediaNext();
    });
    player.addEventListener("webkitendfullscreen", () => {
      recoverAfterFullscreenExit();
    });
  }

  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("msfullscreenchange", handleFullscreenChange);

  refreshPlaylistUi();
  updateNowPlaying();
}
