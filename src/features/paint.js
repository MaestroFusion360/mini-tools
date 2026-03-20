import { byId } from "../core/dom.js";

const MAX_HISTORY = 25;
const paintState = {
  drawing: false,
  lastX: 0,
  lastY: 0,
  startX: 0,
  startY: 0,
  splineLastMidX: 0,
  splineLastMidY: 0,
  splineLastX: 0,
  splineLastY: 0,
  splineStage: 0,
  splineEndX: 0,
  splineEndY: 0,
  splineBaseImageData: null,
  undoStack: [],
  redoStack: [],
  nextMirrorAxis: "horizontal",
  activePanel: "",
  canvasReady: false,
  activeTool: "brush",
  showFontPanel: false,
  selectionMode: false,
  selecting: false,
  selection: null,
  shapeTool: "",
  shapeBaseImageData: null,
  filterBaseImageData: null,
  zoom: 1,
  showGrid: false,
  clipboardSnapshot: "",
  clipboardMeta: null,
};
const PAINT_PANELS = ["draw", "resize", "crop", "rotate", "mirror", "filters", "shapes", "zoom"];
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

function getCanvas() {
  return byId("paint-canvas");
}

function getCtx() {
  const canvas = getCanvas();
  return canvas ? canvas.getContext("2d") : null;
}

function getCanvasWrap() {
  return byId("paint-canvas-wrap");
}

function getZoomLabel() {
  return byId("paint-zoom-label");
}

function getGridOverlay() {
  return byId("paint-grid-overlay");
}

function getSelectionOverlay() {
  return byId("paint-selection-overlay");
}

function getFilterValues() {
  return {
    brightness: Number(byId("paint-filter-brightness")?.value || 0),
    contrast: Number(byId("paint-filter-contrast")?.value || 0),
    saturation: Number(byId("paint-filter-saturation")?.value || 0),
  };
}

function clearFilterBase() {
  paintState.filterBaseImageData = null;
}

function clearShapeBase() {
  paintState.shapeBaseImageData = null;
}

function clearSplineState() {
  paintState.splineStage = 0;
  paintState.splineBaseImageData = null;
}

function clearSelection() {
  paintState.selection = null;
  paintState.selecting = false;
}

function deactivateSelectionMode() {
  paintState.selectionMode = false;
  clearSelection();
  updateSelectionUi();
}

function clearSelectionIfAny() {
  if (paintState.selectionMode || paintState.selection || paintState.selecting) {
    deactivateSelectionMode();
  }
}

function makeOffscreenFromImageData(imageData) {
  const offscreen = document.createElement("canvas");
  offscreen.width = imageData.width;
  offscreen.height = imageData.height;
  offscreen.getContext("2d")?.putImageData(imageData, 0, 0);
  return offscreen;
}

function buildFilterString({ brightness, contrast, saturation }) {
  return `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`;
}

function updateZoomUi() {
  const canvas = getCanvas();
  const label = getZoomLabel();
  if (canvas) {
    if (isPaintFullscreen() && paintState.zoom === 1) {
      canvas.style.width = "auto";
    } else {
      canvas.style.width = `${Math.round(paintState.zoom * 100)}%`;
    }
  }
  if (label) {
    label.textContent = `${Math.round(paintState.zoom * 100)}%`;
  }
  syncGridOverlay();
}

function syncGridOverlay() {
  const overlay = getGridOverlay();
  const canvas = getCanvas();
  const wrap = getCanvasWrap();
  if (!overlay || !canvas || !wrap) return;
  const wrapRect = wrap.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  overlay.style.left = `${canvasRect.left - wrapRect.left + wrap.scrollLeft}px`;
  overlay.style.top = `${canvasRect.top - wrapRect.top + wrap.scrollTop}px`;
  overlay.style.width = `${canvasRect.width}px`;
  overlay.style.height = `${canvasRect.height}px`;
  updateSelectionUi();
}

function updateGridUi() {
  const wrap = getCanvasWrap();
  const button = byId("paint-grid-btn");
  if (wrap) {
    wrap.classList.toggle("paint-grid-enabled", paintState.showGrid);
  }
  if (button) {
    button.classList.toggle("active", paintState.showGrid);
    button.setAttribute("aria-pressed", paintState.showGrid ? "true" : "false");
  }
  syncGridOverlay();
}

function updateSelectionUi() {
  const button = byId("paint-select-btn");
  const overlay = getSelectionOverlay();
  const wrap = getCanvasWrap();
  const canvas = getCanvas();
  if (button) {
    button.classList.toggle("active", paintState.selectionMode);
    button.setAttribute("aria-pressed", paintState.selectionMode ? "true" : "false");
  }
  if (!overlay || !wrap || !canvas || !paintState.selection) {
    if (overlay) overlay.classList.add("is-hidden");
    return;
  }
  const wrapRect = wrap.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvasRect.width / canvas.width;
  const scaleY = canvasRect.height / canvas.height;
  overlay.classList.remove("is-hidden");
  overlay.style.left = `${canvasRect.left - wrapRect.left + wrap.scrollLeft + paintState.selection.x * scaleX}px`;
  overlay.style.top = `${canvasRect.top - wrapRect.top + wrap.scrollTop + paintState.selection.y * scaleY}px`;
  overlay.style.width = `${paintState.selection.w * scaleX}px`;
  overlay.style.height = `${paintState.selection.h * scaleY}px`;
}

function updateShapeUi() {
  const shapeButtons = [
    ["rect", byId("paint-shape-rect-btn")],
    ["ellipse", byId("paint-shape-ellipse-btn")],
    ["line", byId("paint-shape-line-btn")],
    ["spline", byId("paint-shape-spline-btn")],
  ];
  shapeButtons.forEach(([shape, button]) => {
    if (!button) return;
    const isActive = paintState.shapeTool === shape;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function updateToolUi() {
  const tool = getTool();
  const brushBtn = byId("paint-tool-brush-btn");
  const eraserBtn = byId("paint-tool-eraser-btn");
  const textBtn = byId("paint-tool-text-btn");
  const pipetteBtn = byId("paint-tool-pipette-btn");
  const fillBtn = byId("paint-tool-fill-btn");
  const textWrap = byId("paint-text-wrap");
  const fontBtn = byId("paint-text-fonts-btn");
  const fontWrap = byId("paint-font-wrap");
  if (brushBtn) {
    const active = tool === "brush";
    brushBtn.classList.toggle("active", active);
    brushBtn.setAttribute("aria-pressed", active ? "true" : "false");
  }
  if (eraserBtn) {
    const active = tool === "eraser";
    eraserBtn.classList.toggle("active", active);
    eraserBtn.setAttribute("aria-pressed", active ? "true" : "false");
  }
  if (textBtn) {
    const active = tool === "text";
    textBtn.classList.toggle("active", active);
    textBtn.setAttribute("aria-pressed", active ? "true" : "false");
  }
  if (pipetteBtn) {
    const active = tool === "pipette";
    pipetteBtn.classList.toggle("active", active);
    pipetteBtn.setAttribute("aria-pressed", active ? "true" : "false");
  }
  if (fillBtn) {
    const active = tool === "fill";
    fillBtn.classList.toggle("active", active);
    fillBtn.setAttribute("aria-pressed", active ? "true" : "false");
  }
  if (textWrap) {
    textWrap.classList.toggle("is-hidden", tool !== "text");
  }
  if (fontBtn) {
    const showFontBtn = tool === "text";
    fontBtn.classList.toggle("is-hidden", !showFontBtn);
    if (!showFontBtn) {
      paintState.showFontPanel = false;
      fontBtn.classList.remove("active");
      fontBtn.setAttribute("aria-pressed", "false");
    } else {
      fontBtn.classList.toggle("active", paintState.showFontPanel);
      fontBtn.setAttribute("aria-pressed", paintState.showFontPanel ? "true" : "false");
    }
  }
  if (fontWrap) {
    fontWrap.classList.toggle("is-hidden", !(tool === "text" && paintState.showFontPanel));
  }
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
  updateZoomUi();
  syncGridOverlay();
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
  return paintState.activeTool || "brush";
}

function getSize() {
  return Math.max(1, Number(byId("paint-size")?.value || 6));
}

function getColor() {
  return byId("paint-color")?.value || "#0f766e";
}

function getBackColor() {
  return byId("paint-back-color")?.value || "#ffffff";
}

function getTextFont() {
  return byId("paint-text-font")?.value || "Manrope";
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
  clearFilterBase();
  clearShapeBase();
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function hexToRgb(hex) {
  const normalized = String(hex || "").replace("#", "");
  if (normalized.length !== 6) return { r: 15, g: 118, b: 110 };
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function pickCanvasColor(x, y) {
  const ctx = getCtx();
  const canvas = getCanvas();
  const colorInput = byId("paint-color");
  if (!ctx || !canvas || !colorInput) return;
  const px = Math.max(0, Math.min(canvas.width - 1, Math.floor(x)));
  const py = Math.max(0, Math.min(canvas.height - 1, Math.floor(y)));
  const data = ctx.getImageData(px, py, 1, 1).data;
  colorInput.value = rgbToHex(data[0], data[1], data[2]);
}

function floodFillAt(x, y) {
  const ctx = getCtx();
  const canvas = getCanvas();
  if (!ctx || !canvas) return;
  const width = canvas.width;
  const height = canvas.height;
  const startX = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const startY = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const idx = (startY * width + startX) * 4;
  const targetR = data[idx];
  const targetG = data[idx + 1];
  const targetB = data[idx + 2];
  const targetA = data[idx + 3];
  const fill = hexToRgb(getColor());
  if (targetR === fill.r && targetG === fill.g && targetB === fill.b && targetA === 255) return;

  const stack = [[startX, startY]];
  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    const [cx, cy] = current;
    if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
    const ci = (cy * width + cx) * 4;
    if (
      data[ci] !== targetR ||
      data[ci + 1] !== targetG ||
      data[ci + 2] !== targetB ||
      data[ci + 3] !== targetA
    ) {
      continue;
    }
    data[ci] = fill.r;
    data[ci + 1] = fill.g;
    data[ci + 2] = fill.b;
    data[ci + 3] = 255;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  ctx.putImageData(image, 0, 0);
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
  syncGridOverlay();
}

function fillBackground() {
  const ctx = getCtx();
  const canvas = getCanvas();
  if (!ctx || !canvas) return;
  ctx.save();
  ctx.fillStyle = getBackColor();
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
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = getBackColor();
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

function setupShapeStroke(ctx) {
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = getColor();
  ctx.lineWidth = getSize();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function drawShape(shape, x1, y1, x2, y2) {
  const ctx = getCtx();
  if (!ctx) return;
  ctx.save();
  setupShapeStroke(ctx);
  if (shape === "rect") {
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  } else if (shape === "ellipse") {
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const radiusX = Math.abs((x2 - x1) / 2);
    const radiusY = Math.abs((y2 - y1) / 2);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shape === "line") {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

function splineStart(x, y) {
  paintState.splineLastX = x;
  paintState.splineLastY = y;
  paintState.splineLastMidX = x;
  paintState.splineLastMidY = y;
}

function splineStrokeTo(x, y) {
  const ctx = getCtx();
  if (!ctx) return;
  const midX = (paintState.splineLastX + x) / 2;
  const midY = (paintState.splineLastY + y) / 2;
  ctx.save();
  setupShapeStroke(ctx);
  ctx.globalCompositeOperation = "source-over";
  ctx.beginPath();
  ctx.moveTo(paintState.splineLastMidX, paintState.splineLastMidY);
  ctx.quadraticCurveTo(paintState.splineLastX, paintState.splineLastY, midX, midY);
  ctx.stroke();
  ctx.restore();
  paintState.splineLastX = x;
  paintState.splineLastY = y;
  paintState.splineLastMidX = midX;
  paintState.splineLastMidY = midY;
}

function drawSplineCurve(controlX, controlY) {
  const ctx = getCtx();
  if (!ctx || !paintState.splineBaseImageData) return;
  ctx.putImageData(paintState.splineBaseImageData, 0, 0);
  ctx.save();
  setupShapeStroke(ctx);
  ctx.beginPath();
  ctx.moveTo(paintState.startX, paintState.startY);
  ctx.quadraticCurveTo(controlX, controlY, paintState.splineEndX, paintState.splineEndY);
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
  ctx.font = `${Math.max(12, getSize() * 4)}px "${getTextFont()}", Manrope, sans-serif`;
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
  clearSelectionIfAny();
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
  if (paintState.selectionMode) {
    paintState.selecting = true;
    paintState.selection = { x, y, w: 0, h: 0 };
    updateSelectionUi();
    return;
  }
  if (tool === "pipette") {
    pickCanvasColor(x, y);
    return;
  }
  if (tool === "fill") {
    pushUndoState();
    floodFillAt(x, y);
    return;
  }
  const shapeTool = paintState.shapeTool;
  if (shapeTool === "spline") {
    const ctx = getCtx();
    const canvas = getCanvas();
    if (!ctx || !canvas) return;
    if (paintState.splineStage === 0) {
      pushUndoState();
      paintState.drawing = true;
      paintState.startX = x;
      paintState.startY = y;
      paintState.shapeBaseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return;
    }
    if (paintState.splineStage === 1 && paintState.splineBaseImageData) {
      paintState.drawing = true;
      return;
    }
  }
  if (shapeTool === "rect" || shapeTool === "ellipse" || shapeTool === "line") {
    const ctx = getCtx();
    const canvas = getCanvas();
    if (!ctx || !canvas) return;
    pushUndoState();
    paintState.drawing = true;
    paintState.startX = x;
    paintState.startY = y;
    paintState.shapeBaseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return;
  }
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
  const { x, y } = getPointer(event);
  if (paintState.selectionMode && paintState.selecting && paintState.selection) {
    const sx = paintState.selection.x;
    const sy = paintState.selection.y;
    paintState.selection = {
      x: Math.min(sx, x),
      y: Math.min(sy, y),
      w: Math.abs(x - sx),
      h: Math.abs(y - sy),
    };
    updateSelectionUi();
    return;
  }
  if (!paintState.drawing) return;
  if (paintState.shapeTool === "spline") {
    if (paintState.splineStage === 0 && paintState.shapeBaseImageData) {
      const ctx = getCtx();
      if (!ctx) return;
      ctx.putImageData(paintState.shapeBaseImageData, 0, 0);
      drawShape("line", paintState.startX, paintState.startY, x, y);
      return;
    }
    if (paintState.splineStage === 1 && paintState.splineBaseImageData) {
      drawSplineCurve(x, y);
      return;
    }
    return;
  }
  if (
    (paintState.shapeTool === "rect" ||
      paintState.shapeTool === "ellipse" ||
      paintState.shapeTool === "line") &&
    paintState.shapeBaseImageData
  ) {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.putImageData(paintState.shapeBaseImageData, 0, 0);
    drawShape(paintState.shapeTool, paintState.startX, paintState.startY, x, y);
    return;
  }
  drawStroke(paintState.lastX, paintState.lastY, x, y);
  paintState.lastX = x;
  paintState.lastY = y;
}

function stopDrawing(event) {
  if (paintState.selectionMode && paintState.selecting) {
    paintState.selecting = false;
    if (!paintState.selection || paintState.selection.w < 1 || paintState.selection.h < 1) {
      clearSelection();
    }
    updateSelectionUi();
    return;
  }
  if (paintState.drawing && paintState.shapeTool === "spline" && event) {
    const { x, y } = getPointer(event);
    const ctx = getCtx();
    if (!ctx) {
      paintState.drawing = false;
      return;
    }
    if (paintState.splineStage === 0 && paintState.shapeBaseImageData) {
      ctx.putImageData(paintState.shapeBaseImageData, 0, 0);
      drawShape("line", paintState.startX, paintState.startY, x, y);
      paintState.splineEndX = x;
      paintState.splineEndY = y;
      paintState.splineBaseImageData = ctx.getImageData(0, 0, getCanvas().width, getCanvas().height);
      paintState.splineStage = 1;
      clearShapeBase();
      paintState.drawing = false;
      return;
    }
    if (paintState.splineStage === 1 && paintState.splineBaseImageData) {
      drawSplineCurve(x, y);
      clearSplineState();
      clearShapeBase();
      paintState.drawing = false;
      return;
    }
  }
  if (
    paintState.drawing &&
    (paintState.shapeTool === "rect" ||
      paintState.shapeTool === "ellipse" ||
      paintState.shapeTool === "line") &&
    paintState.shapeBaseImageData &&
    event
  ) {
    const { x, y } = getPointer(event);
    const ctx = getCtx();
    if (ctx) {
      ctx.putImageData(paintState.shapeBaseImageData, 0, 0);
      drawShape(paintState.shapeTool, paintState.startX, paintState.startY, x, y);
    }
  }
  clearShapeBase();
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

function isPaintPageActive() {
  const page = getPage();
  return Boolean(page && page.classList.contains("active"));
}

function isEditableTarget(target) {
  const element = target instanceof HTMLElement ? target : null;
  if (!element) return false;
  if (element.isContentEditable) return true;
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function deleteSelectionPixels() {
  const canvas = getCanvas();
  const ctx = getCtx();
  const selection = paintState.selection;
  if (!canvas || !ctx || !selection) return false;
  const x = Math.max(0, Math.floor(selection.x));
  const y = Math.max(0, Math.floor(selection.y));
  const w = Math.max(1, Math.floor(selection.w));
  const h = Math.max(1, Math.floor(selection.h));
  if (w <= 0 || h <= 0) return false;
  pushUndoState();
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = getBackColor();
  ctx.fillRect(x, y, Math.min(w, canvas.width - x), Math.min(h, canvas.height - y));
  ctx.restore();
  return true;
}

function onPaintKeyDown(event) {
  if (event.key !== "Delete") return;
  if (!isPaintPageActive()) return;
  if (isEditableTarget(event.target)) return;
  if (deleteSelectionPixels()) {
    event.preventDefault();
  }
}

export function paintOpenFileDialog() {
  byId("paint-open-input")?.click();
}

export function paintTogglePanel(panel) {
  if (!PAINT_PANELS.includes(panel)) return;
  const nextPanel = paintState.activePanel === panel ? "" : panel;
  clearSelectionIfAny();
  if (paintState.activePanel === "filters" && nextPanel !== "filters") {
    clearFilterBase();
  }
  paintState.activePanel = nextPanel;
  updatePanelUi();
}

export async function paintToggleFullscreen() {
  const page = getPage();
  if (!page) return;
  clearSelectionIfAny();
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

function previewFilters() {
  const ctx = getCtx();
  const canvas = getCanvas();
  if (!ctx || !canvas) return;
  if (!paintState.filterBaseImageData) {
    paintState.filterBaseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  const values = getFilterValues();
  const base = paintState.filterBaseImageData;
  if (!base) return;
  ctx.putImageData(base, 0, 0);
  if (!values.brightness && !values.contrast && !values.saturation) return;
  const offscreen = makeOffscreenFromImageData(base);
  ctx.save();
  ctx.filter = buildFilterString(values);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offscreen, 0, 0);
  ctx.restore();
}

export function paintApplyFilters() {
  const ctx = getCtx();
  const canvas = getCanvas();
  if (!ctx || !canvas) return;
  clearSelectionIfAny();
  const values = getFilterValues();
  if (!values.brightness && !values.contrast && !values.saturation) {
    clearFilterBase();
    return;
  }
  pushUndoState();
  previewFilters();
  clearFilterBase();
}

export function paintResetFilters() {
  const ctx = getCtx();
  clearSelectionIfAny();
  if (paintState.filterBaseImageData && ctx) {
    ctx.putImageData(paintState.filterBaseImageData, 0, 0);
  }
  ["paint-filter-brightness", "paint-filter-contrast", "paint-filter-saturation"].forEach((id) => {
    const input = byId(id);
    if (input) input.value = "0";
  });
  clearFilterBase();
}

export function paintSelectShape(shape) {
  const allowed = ["rect", "ellipse", "line", "spline"];
  if (!allowed.includes(shape)) return;
  clearSelectionIfAny();
  clearSplineState();
  paintState.shapeTool = paintState.shapeTool === shape ? "" : shape;
  if (paintState.shapeTool) {
    paintState.activeTool = "brush";
    updateToolUi();
  }
  updateShapeUi();
}

export function paintSetTool(tool) {
  if (!["brush", "eraser", "text", "pipette", "fill"].includes(tool)) return;
  paintState.activeTool = tool;
  clearSelectionIfAny();
  if (paintState.shapeTool) {
    paintState.shapeTool = "";
    clearSplineState();
    updateShapeUi();
  }
  updateToolUi();
}

export function paintToggleFontPanel() {
  if (getTool() !== "text") return;
  paintState.showFontPanel = !paintState.showFontPanel;
  updateToolUi();
}

export function paintToggleSelectionTool() {
  paintState.selectionMode = !paintState.selectionMode;
  if (paintState.selectionMode) {
    paintState.activeTool = "brush";
    if (paintState.shapeTool) {
      paintState.shapeTool = "";
      clearSplineState();
      updateShapeUi();
    }
  } else {
    deactivateSelectionMode();
    updateToolUi();
    return;
  }
  updateSelectionUi();
  updateToolUi();
}

export function paintZoomIn() {
  clearSelectionIfAny();
  paintState.zoom = Math.min(MAX_ZOOM, paintState.zoom + 0.25);
  updateZoomUi();
}

export function paintZoomOut() {
  clearSelectionIfAny();
  paintState.zoom = Math.max(MIN_ZOOM, paintState.zoom - 0.25);
  updateZoomUi();
}

export function paintZoomReset() {
  clearSelectionIfAny();
  paintState.zoom = 1;
  updateZoomUi();
}

export function paintToggleGrid() {
  clearSelectionIfAny();
  paintState.showGrid = !paintState.showGrid;
  updateGridUi();
}

export function paintCopySelection() {
  const canvas = getCanvas();
  const ctx = getCtx();
  if (!canvas || !ctx) return;
  if (paintState.selection && paintState.selection.w > 0 && paintState.selection.h > 0) {
    const sx = Math.max(0, Math.floor(paintState.selection.x));
    const sy = Math.max(0, Math.floor(paintState.selection.y));
    const sw = Math.max(1, Math.floor(paintState.selection.w));
    const sh = Math.max(1, Math.floor(paintState.selection.h));
    const offscreen = document.createElement("canvas");
    offscreen.width = sw;
    offscreen.height = sh;
    offscreen.getContext("2d")?.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    paintState.clipboardSnapshot = offscreen.toDataURL("image/png");
    paintState.clipboardMeta = { w: sw, h: sh };
    return;
  }
  paintState.clipboardSnapshot = getSnapshot();
  paintState.clipboardMeta = { w: canvas.width, h: canvas.height };
}

export function paintPasteClipboard() {
  if (!paintState.clipboardSnapshot) return;
  clearSelectionIfAny();
  pushUndoState();
  const img = new Image();
  img.onload = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const targetX = paintState.selection ? Math.floor(paintState.selection.x) : 0;
    const targetY = paintState.selection ? Math.floor(paintState.selection.y) : 0;
    ctx.drawImage(img, targetX, targetY);
  };
  img.src = paintState.clipboardSnapshot;
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
  clearSelectionIfAny();
  pushUndoState();
  fillBackground();
}

export function paintUndo() {
  if (!paintState.undoStack.length) return;
  clearSelectionIfAny();
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
  clearSelectionIfAny();
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
  clearSelectionIfAny();
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
  clearSelectionIfAny();
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
  clearSelectionIfAny();
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
  clearSelectionIfAny();
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

  ["paint-filter-brightness", "paint-filter-contrast", "paint-filter-saturation"].forEach((id) => {
    const inputEl = byId(id);
    if (!inputEl) return;
    inputEl.addEventListener("input", previewFilters);
  });

  const wrap = getCanvasWrap();
  if (wrap) {
    wrap.addEventListener("scroll", syncGridOverlay);
  }
  window.addEventListener("resize", syncGridOverlay);

  document.addEventListener("fullscreenchange", handlePaintFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handlePaintFullscreenChange);
  document.addEventListener("msfullscreenchange", handlePaintFullscreenChange);
  document.addEventListener("keydown", onPaintKeyDown);

  updatePanelUi();
  updateShapeUi();
  updateToolUi();
  updateZoomUi();
  updateGridUi();
  updateSelectionUi();
  handlePaintFullscreenChange();
}
