import { byId } from "../core/dom.js";

const MAX_HISTORY = 25;
const paintState = {
  drawing: false,
  lastX: 0,
  lastY: 0,
  undoStack: [],
  redoStack: [],
  nextMirrorAxis: "horizontal",
  activePanel: "",
  canvasReady: false,
};
const PAINT_PANELS = ["draw", "resize", "crop", "rotate", "mirror"];

function getCanvas() {
  return byId("paint-canvas");
}

function getCtx() {
  const canvas = getCanvas();
  return canvas ? canvas.getContext("2d") : null;
}

function getPage() {
  return byId("page-paint");
}

function getFullscreenButton() {
  return byId("paint-fullscreen-btn");
}

function getFullscreenElement() {
  const doc = document;
  return doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
}

function isPaintFullscreen() {
  const page = getPage();
  const fullscreenElement = getFullscreenElement();
  if (!page || !fullscreenElement) return false;
  return fullscreenElement === page || page.contains(fullscreenElement);
}

function updateFullscreenUi() {
  const button = getFullscreenButton();
  if (!button) return;
  const isActive = isPaintFullscreen();
  button.classList.toggle("active", isActive);
  button.setAttribute("aria-pressed", isActive ? "true" : "false");
}

function handlePaintFullscreenChange() {
  updateFullscreenUi();
}

async function requestElementFullscreen(element) {
  if (!element) return;
  if (typeof element.requestFullscreen === "function") {
    await element.requestFullscreen();
    return;
  }
  if (typeof element.webkitRequestFullscreen === "function") {
    element.webkitRequestFullscreen();
    return;
  }
  if (typeof element.msRequestFullscreen === "function") {
    element.msRequestFullscreen();
  }
}

async function exitAnyFullscreen() {
  const doc = document;
  if (typeof doc.exitFullscreen === "function") {
    await doc.exitFullscreen();
    return;
  }
  if (typeof doc.webkitExitFullscreen === "function") {
    doc.webkitExitFullscreen();
    return;
  }
  if (typeof doc.msExitFullscreen === "function") {
    doc.msExitFullscreen();
  }
}

function getTool() {
  return byId("paint-tool")?.value || "brush";
}

function getSize() {
  return Math.max(1, Number(byId("paint-size")?.value || 6));
}

function getColor() {
  return byId("paint-color")?.value || "#0f766e";
}

function getSnapshot() {
  const canvas = getCanvas();
  return canvas ? canvas.toDataURL("image/png") : "";
}

function pushUndoState() {
  const snapshot = getSnapshot();
  if (!snapshot) return;
  paintState.undoStack.push(snapshot);
  if (paintState.undoStack.length > MAX_HISTORY) paintState.undoStack.shift();
  paintState.redoStack = [];
}

function restoreSnapshot(snapshot) {
  if (!snapshot) return;
  const img = new Image();
  img.onload = () => {
    setCanvasSize(img.width, img.height);
    fillBackground();
    getCtx()?.drawImage(img, 0, 0);
    syncResizeInputs();
  };
  img.src = snapshot;
}

function setCanvasSize(width, height) {
  const canvas = getCanvas();
  if (!canvas) return;
  canvas.width = Math.max(1, Math.floor(width));
  canvas.height = Math.max(1, Math.floor(height));
}

function fillBackground() {
  const ctx = getCtx();
  const canvas = getCanvas();
  if (!ctx || !canvas) return;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function syncResizeInputs() {
  const canvas = getCanvas();
  const widthInput = byId("paint-resize-w");
  const heightInput = byId("paint-resize-h");
  if (!canvas || !widthInput || !heightInput) return;
  widthInput.value = String(canvas.width);
  heightInput.value = String(canvas.height);
}

function getPointer(event) {
  const canvas = getCanvas();
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function drawStroke(x1, y1, x2, y2) {
  const ctx = getCtx();
  if (!ctx) return;
  const tool = getTool();
  ctx.save();
  ctx.lineWidth = getSize();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = getColor();
  }
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function placeText(x, y) {
  const ctx = getCtx();
  if (!ctx) return;
  const text = byId("paint-text")?.value?.trim() || "";
  if (!text) return;
  pushUndoState();
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = getColor();
  ctx.font = `${Math.max(12, getSize() * 4)}px Manrope, sans-serif`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function applyRasterTransform(drawFn, nextWidth, nextHeight) {
  const canvas = getCanvas();
  const ctx = getCtx();
  if (!canvas || !ctx) return;
  pushUndoState();
  const src = document.createElement("canvas");
  src.width = canvas.width;
  src.height = canvas.height;
  src.getContext("2d")?.drawImage(canvas, 0, 0);
  setCanvasSize(nextWidth, nextHeight);
  const nextCtx = getCtx();
  if (!nextCtx) return;
  fillBackground();
  drawFn(nextCtx, src);
  syncResizeInputs();
}

function loadImageFile(file) {
  if (!file) return;
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  img.onload = () => {
    pushUndoState();
    setCanvasSize(img.width, img.height);
    const ctx = getCtx();
    if (ctx) {
      fillBackground();
      ctx.drawImage(img, 0, 0);
      syncResizeInputs();
    }
    URL.revokeObjectURL(objectUrl);
  };
  img.onerror = () => URL.revokeObjectURL(objectUrl);
  img.src = objectUrl;
}

function onPointerDown(event) {
  const tool = getTool();
  const { x, y } = getPointer(event);
  if (tool === "text") {
    placeText(x, y);
    return;
  }
  pushUndoState();
  paintState.drawing = true;
  paintState.lastX = x;
  paintState.lastY = y;
}

function onPointerMove(event) {
  if (!paintState.drawing) return;
  const { x, y } = getPointer(event);
  drawStroke(paintState.lastX, paintState.lastY, x, y);
  paintState.lastX = x;
  paintState.lastY = y;
}

function stopDrawing() {
  paintState.drawing = false;
}

function updatePanelUi() {
  PAINT_PANELS.forEach((panel) => {
    const panelEl = byId(`paint-panel-${panel}`);
    const buttonEl = byId(`paint-panel-${panel}-btn`);
    const isActive = paintState.activePanel === panel;
    if (panelEl) panelEl.classList.toggle("is-hidden", !isActive);
    if (buttonEl) {
      buttonEl.classList.toggle("active", isActive);
      buttonEl.setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  });
}

export function paintOpenFileDialog() {
  byId("paint-open-input")?.click();
}

export function paintTogglePanel(panel) {
  if (!PAINT_PANELS.includes(panel)) return;
  paintState.activePanel = paintState.activePanel === panel ? "" : panel;
  updatePanelUi();
}

export async function paintToggleFullscreen() {
  const page = getPage();
  if (!page) return;
  try {
    if (isPaintFullscreen()) {
      await exitAnyFullscreen();
    } else {
      await requestElementFullscreen(page);
    }
  } catch {
    // Fullscreen can be blocked by browser policy/user settings.
  } finally {
    updateFullscreenUi();
  }
}

export function paintSaveImage() {
  const canvas = getCanvas();
  if (!canvas) return;
  const link = document.createElement("a");
  const url = canvas.toDataURL("image/png");
  link.href = url;
  link.download = "paint.png";
  document.body.append(link);
  link.click();
  link.remove();
}

export function paintClearCanvas() {
  const canvas = getCanvas();
  if (!canvas) return;
  pushUndoState();
  fillBackground();
}

export function paintUndo() {
  if (!paintState.undoStack.length) return;
  const current = getSnapshot();
  if (current) {
    paintState.redoStack.push(current);
    if (paintState.redoStack.length > MAX_HISTORY) paintState.redoStack.shift();
  }
  const prev = paintState.undoStack.pop();
  restoreSnapshot(prev);
}

export function paintRedo() {
  if (!paintState.redoStack.length) return;
  const current = getSnapshot();
  if (current) {
    paintState.undoStack.push(current);
    if (paintState.undoStack.length > MAX_HISTORY) paintState.undoStack.shift();
  }
  const next = paintState.redoStack.pop();
  restoreSnapshot(next);
}

export function paintApplyCrop() {
  const canvas = getCanvas();
  if (!canvas) return;
  const x = Math.max(0, Number(byId("paint-crop-x")?.value || 0));
  const y = Math.max(0, Number(byId("paint-crop-y")?.value || 0));
  const w = Math.max(1, Number(byId("paint-crop-w")?.value || canvas.width));
  const h = Math.max(1, Number(byId("paint-crop-h")?.value || canvas.height));
  const sx = Math.min(canvas.width - 1, x);
  const sy = Math.min(canvas.height - 1, y);
  const sw = Math.max(1, Math.min(w, canvas.width - sx));
  const sh = Math.max(1, Math.min(h, canvas.height - sy));
  applyRasterTransform(
    (ctx, src) => ctx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh),
    sw,
    sh,
  );
}

export function paintApplyResize() {
  const canvas = getCanvas();
  if (!canvas) return;
  const w = Math.max(1, Number(byId("paint-resize-w")?.value || canvas.width));
  const h = Math.max(1, Number(byId("paint-resize-h")?.value || canvas.height));
  applyRasterTransform(
    (ctx, src) => ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, w, h),
    w,
    h,
  );
}

export function paintApplyRotate() {
  const canvas = getCanvas();
  if (!canvas) return;
  const rawAngle = Number(byId("paint-rotate-angle")?.value);
  const angle = Number.isFinite(rawAngle) ? rawAngle : 90;
  const normalized = ((angle % 360) + 360) % 360;
  const swapSides = normalized === 90 || normalized === 270;
  const nextW = swapSides ? canvas.height : canvas.width;
  const nextH = swapSides ? canvas.width : canvas.height;
  applyRasterTransform((ctx, src) => {
    ctx.save();
    ctx.translate(nextW / 2, nextH / 2);
    ctx.rotate((normalized * Math.PI) / 180);
    ctx.drawImage(src, -src.width / 2, -src.height / 2);
    ctx.restore();
  }, nextW, nextH);
}

export function paintApplyMirror() {
  const canvas = getCanvas();
  if (!canvas) return;
  const axisSelect = byId("paint-mirror-axis");
  const axis =
    axisSelect?.value === "vertical" || axisSelect?.value === "horizontal"
      ? axisSelect.value
      : paintState.nextMirrorAxis;
  applyRasterTransform((ctx, src) => {
    ctx.save();
    if (axis === "vertical") {
      ctx.scale(1, -1);
      ctx.drawImage(src, 0, -src.height);
    } else {
      ctx.scale(-1, 1);
      ctx.drawImage(src, -src.width, 0);
    }
    ctx.restore();
  }, canvas.width, canvas.height);
  if (!axisSelect) {
    paintState.nextMirrorAxis =
      axis === "horizontal" ? "vertical" : "horizontal";
  }
}

export function initPaint() {
  const canvas = getCanvas();
  if (!canvas || paintState.canvasReady) return;
  paintState.canvasReady = true;
  fillBackground();
  syncResizeInputs();

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointerleave", stopDrawing);

  const input = byId("paint-open-input");
  if (input) {
    input.addEventListener("change", (event) => {
      const file = event.target?.files?.[0];
      loadImageFile(file);
      input.value = "";
    });
  }

  document.addEventListener("fullscreenchange", handlePaintFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handlePaintFullscreenChange);
  document.addEventListener("msfullscreenchange", handlePaintFullscreenChange);

  updatePanelUi();
  handlePaintFullscreenChange();
}
