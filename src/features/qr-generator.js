import { byId, showAppToast } from "../core/dom.js";
import { registerTranslationApplier, t } from "../core/i18n.js";

const qrState = {
  initialized: false,
  lastUrl: "",
};

const QR_BASE_URL = "https://api.qrserver.com/v1/create-qr-code/";
const DEFAULT_QR_SIZE = 220;
const MIN_QR_SIZE = 100;
const MAX_QR_SIZE = 1000;
const MAX_QR_TEXT_LENGTH = 1500;

function normalizeQrSize(size) {
  const numericSize = Number(size);
  if (!Number.isFinite(numericSize)) return DEFAULT_QR_SIZE;
  return Math.max(MIN_QR_SIZE, Math.min(MAX_QR_SIZE, Math.round(numericSize)));
}

export function buildQrImageUrl(text, size) {
  const cleanText = String(text || "").trim();
  const validSize = normalizeQrSize(size);
  return `${QR_BASE_URL}?size=${validSize}x${validSize}&format=png&margin=12&data=${encodeURIComponent(cleanText)}`;
}

function renderQrStatus(messageKey) {
  const status = byId("qr-status");
  if (status) status.textContent = t(messageKey);
}

function setPreviewVisible(visible) {
  const preview = byId("qr-preview-wrap");
  if (preview) preview.classList.toggle("is-hidden", !visible);
}

function bindQrImageEvents() {
  const image = byId("qr-image");
  if (!image || image.dataset.qrBound === "1") return;

  image.addEventListener("load", () => {
    qrState.lastUrl = image.currentSrc || image.src || "";
    renderQrStatus("qrStatusReady");
    setPreviewVisible(true);
  });

  image.addEventListener("error", () => {
    qrState.lastUrl = "";
    setPreviewVisible(false);
    renderQrStatus("qrStatusError");
  });

  image.dataset.qrBound = "1";
}

export function generateQrCode() {
  const input = byId("qr-input");
  const sizeSelect = byId("qr-size");
  const image = byId("qr-image");
  if (!input || !sizeSelect || !image) return;

  const text = String(input.value || "").trim();
  if (!text) {
    qrState.lastUrl = "";
    renderQrStatus("qrStatusEmpty");
    setPreviewVisible(false);
    return;
  }
  if (text.length > MAX_QR_TEXT_LENGTH) {
    qrState.lastUrl = "";
    renderQrStatus("qrStatusTooLong");
    setPreviewVisible(false);
    return;
  }

  const nextUrl = buildQrImageUrl(text, sizeSelect.value);
  image.alt = t("qrImageAlt");
  setPreviewVisible(false);
  renderQrStatus("qrStatusLoading");
  image.src = nextUrl;
}

export function clearQrCode() {
  const input = byId("qr-input");
  const image = byId("qr-image");
  const sizeSelect = byId("qr-size");
  if (input) input.value = "";
  if (sizeSelect) sizeSelect.value = String(DEFAULT_QR_SIZE);
  if (image) {
    image.removeAttribute("src");
    image.removeAttribute("srcset");
    image.alt = t("qrImageAlt");
  }
  qrState.lastUrl = "";
  setPreviewVisible(false);
  renderQrStatus("qrStatusHint");
}

export function downloadQrCode() {
  if (!qrState.lastUrl) {
    renderQrStatus("qrStatusEmpty");
    return;
  }
  window.open(qrState.lastUrl, "_blank", "noopener,noreferrer");
  showAppToast(t("qrDownloadStarted"));
}

function applyQrTranslations() {
  const input = byId("qr-input");
  const sizeSelect = byId("qr-size");
  const downloadBtn = byId("qr-download-btn");
  if (input) input.placeholder = t("qrPlaceholder");
  if (sizeSelect) {
    const options = Array.from(sizeSelect.options);
    options.forEach((option) => {
      const value = Number(option.value);
      if (Number.isFinite(value)) option.textContent = `${value} x ${value}`;
    });
  }
  if (downloadBtn) {
    downloadBtn.textContent = t("qrDownload");
  }
  const staticTextMap = [
    ["menu-qr", "qrGenerator"],
    ["title-qr", "qrGeneratorTitle"],
    ["qr-input-label", "qrInputLabel"],
    ["qr-generate-btn", "qrGenerate"],
    ["qr-clear-btn", "qrClear"],
  ];
  staticTextMap.forEach(([id, key]) => {
    const el = byId(id);
    if (el) el.textContent = t(key);
  });

  if (!qrState.lastUrl) renderQrStatus("qrStatusHint");
}

export function initQrGenerator() {
  if (!qrState.initialized) {
    registerTranslationApplier(applyQrTranslations);
    qrState.initialized = true;
  }
  bindQrImageEvents();
  if (!qrState.lastUrl) renderQrStatus("qrStatusHint");
}
