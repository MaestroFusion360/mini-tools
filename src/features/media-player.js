import { byId } from "../core/dom.js";
import { t } from "../core/i18n.js";

const mediaState = {
  items: [],
  index: -1,
  initialized: false,
};

function isFullscreenActive() {
  const doc = document;
  return Boolean(
    doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.msFullscreenElement
  );
}

function recoverAfterFullscreenExit() {
  const player = getPlayer();
  if (!player) return;

  // Some browsers can leave the page in a "half-locked" interactive state
  // after leaving native video fullscreen. Force-reset focus and layout.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  player.blur();
  player.style.pointerEvents = "auto";
  document.documentElement.style.pointerEvents = "";
  document.body.style.pointerEvents = "";
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";

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
  const label = getNowLabel();
  if (!label) return;
  if (mediaState.index < 0 || !mediaState.items[mediaState.index]) {
    label.textContent = t("mediaNoFileSelected");
    return;
  }
  label.textContent = `${t("mediaNowPlaying")}: ${mediaState.items[mediaState.index].name}`;
}

function playIndex(nextIndex) {
  const player = getPlayer();
  if (!player) return;
  if (nextIndex < 0 || nextIndex >= mediaState.items.length) return;
  mediaState.index = nextIndex;
  const item = mediaState.items[nextIndex];
  player.src = item.url;
  player.load();
  player.play().catch(() => {});
  refreshPlaylistUi();
  updateNowPlaying();
}

function revokeAllUrls() {
  mediaState.items.forEach((item) => URL.revokeObjectURL(item.url));
}

export function mediaOpenFilesDialog() {
  byId("media-files-input")?.click();
}

export function mediaPlaySelected() {
  const selected = Number(getPlaylist()?.value || -1);
  if (!Number.isInteger(selected) || selected < 0) return;
  playIndex(selected);
}

export function mediaPrev() {
  if (!mediaState.items.length) return;
  const next =
    mediaState.index <= 0 ? mediaState.items.length - 1 : mediaState.index - 1;
  playIndex(next);
}

export function mediaNext() {
  if (!mediaState.items.length) return;
  const next = (mediaState.index + 1) % mediaState.items.length;
  playIndex(next);
}

export function mediaClearPlaylist() {
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
