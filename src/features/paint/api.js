import { byId } from "../../core/dom.js";
import {
  MAX_HISTORY,
  MAX_ZOOM,
  MIN_ZOOM,
  PAINT_PANELS,
  paintState,
} from "./state.js";

const ZOOM_STEP = 0.1;
import {
  applyRasterTransform,
  buildFilterString,
  clearFilterBase,
  clearSelectionIfAny,
  clearSplineState,
  deactivateSelectionMode,
  fillBackground,
  getActiveSelectionBounds,
  getBackColor,
  getCanvas,
  getCanvasWrap,
  getCtx,
  getFilterValues,
  getPage,
  getSnapshot,
  getTool,
  handlePaintFullscreenChange,
  initPaintFontOptions,
  isPaintPageActive,
  loadImageFile,
  makeOffscreenFromImageData,
  onPaintKeyDown,
  onPointerDown,
  onPointerMove,
  pushUndoState,
  restoreSnapshot,
  stopDrawing,
  syncGridOverlay,
  syncPaintPageMode,
  syncResizeInputs,
  updateGridUi,
  updatePanelUi,
  updateSelectionUi,
  updateShapeUi,
  updateToolUi,
  updateZoomUi,
} from "./core.js";

export function paintOpenFileDialog() {
  byId("paint-open-input")?.click();
}

export function paintTogglePanel(panel) {
  if (!PAINT_PANELS.includes(panel)) return;
  const nextPanel = paintState.activePanel === panel ? "" : panel;
  const allowSelectionPanels = ["crop", "rotate", "mirror"];
  const shouldKeepSelection = allowSelectionPanels.includes(panel);
  if (!shouldKeepSelection) {
    clearSelectionIfAny();
  }
  if (paintState.activePanel === "filters" && nextPanel !== "filters") {
    clearFilterBase();
  }
  paintState.activePanel = nextPanel;
  updatePanelUi();
  updateToolUi();
}

export async function paintToggleFullscreen() {
  clearSelectionIfAny();
  paintState.fullscreen = !paintState.fullscreen;
  handlePaintFullscreenChange();
}

function previewFilters() {
  const ctx = getCtx();
  const canvas = getCanvas();
  if (!ctx || !canvas) return;
  if (!paintState.filterBaseImageData) {
    paintState.filterBaseImageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );
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

function resetFilterSliders() {
  [
    "paint-filter-brightness",
    "paint-filter-contrast",
    "paint-filter-saturation",
  ].forEach((id) => {
    const input = byId(id);
    if (input) input.value = "0";
  });
}

function updateFilterValueLabels() {
  const pairs = [
    ["paint-filter-brightness", "paint-filter-brightness-value"],
    ["paint-filter-contrast", "paint-filter-contrast-value"],
    ["paint-filter-saturation", "paint-filter-saturation-value"],
  ];
  pairs.forEach(([inputId, valueId]) => {
    const input = byId(inputId);
    const valueEl = byId(valueId);
    if (!input || !valueEl) return;
    const raw = Number(input.value);
    const value = Number.isFinite(raw) ? Math.round(raw) : 0;
    const prefix = value > 0 ? "+" : "";
    valueEl.textContent = `${prefix}${value}%`;
  });
}

function pushUndoFromFilterBase() {
  const base = paintState.filterBaseImageData;
  if (!base) return false;
  const offscreen = makeOffscreenFromImageData(base);
  const snapshot = offscreen.toDataURL("image/png");
  if (!snapshot) return false;
  paintState.undoStack.push(snapshot);
  if (paintState.undoStack.length > MAX_HISTORY) paintState.undoStack.shift();
  paintState.redoStack = [];
  return true;
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
  // When sliders are moved, preview is already rendered from filterBaseImageData.
  // Save original pre-filter image to undo and avoid a second apply pass.
  const usedBaseSnapshot = pushUndoFromFilterBase();
  if (!usedBaseSnapshot) {
    pushUndoState();
    previewFilters();
  }
  resetFilterSliders();
  updateFilterValueLabels();
  clearFilterBase();
}

export function paintResetFilters() {
  const ctx = getCtx();
  clearSelectionIfAny();
  if (paintState.filterBaseImageData && ctx) {
    ctx.putImageData(paintState.filterBaseImageData, 0, 0);
  }
  resetFilterSliders();
  updateFilterValueLabels();
  clearFilterBase();
}

export function paintSelectShape(shape) {
  const allowed = [
    "rect",
    "ellipse",
    "line",
    "spline",
    "star",
    "arrow-up",
    "arrow-down",
    "arrow-left",
    "arrow-right",
  ];
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
  if (!["pen", "brush", "eraser", "text", "pipette", "fill"].includes(tool)) {
    return;
  }
  const sizeInput = byId("paint-size");
  const previousTool = paintState.activeTool;
  const currentSize = Number(sizeInput?.value || 0);
  if (
    previousTool === "brush" &&
    Number.isFinite(currentSize) &&
    currentSize > 0
  ) {
    paintState.brushSize = currentSize;
  }

  paintState.activeTool = tool;
  if (tool === "pen") {
    if (sizeInput) sizeInput.value = "1";
  } else if (tool === "brush" && previousTool === "pen" && sizeInput) {
    const brushSize = Number(paintState.brushSize || 6);
    sizeInput.value = String(
      Number.isFinite(brushSize) && brushSize > 0 ? Math.round(brushSize) : 6,
    );
  }
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

export function paintToggleTextBold() {
  if (getTool() !== "text") return;
  paintState.textBold = !paintState.textBold;
  updateToolUi();
}

export function paintToggleTextItalic() {
  if (getTool() !== "text") return;
  paintState.textItalic = !paintState.textItalic;
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
  paintState.zoom = Math.min(MAX_ZOOM, paintState.zoom + ZOOM_STEP);
  updateZoomUi();
}

export function paintZoomOut() {
  clearSelectionIfAny();
  paintState.zoom = Math.max(MIN_ZOOM, paintState.zoom - ZOOM_STEP);
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
  if (
    paintState.selection &&
    paintState.selection.w > 0 &&
    paintState.selection.h > 0
  ) {
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
  const selection = paintState.selection
    ? {
        x: paintState.selection.x,
        y: paintState.selection.y,
      }
    : null;
  clearSelectionIfAny();
  pushUndoState();
  const img = new Image();
  img.onload = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const targetX = selection ? Math.floor(selection.x) : 0;
    const targetY = selection ? Math.floor(selection.y) : 0;
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
  link.download = "image.png";
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
  const selection = getActiveSelectionBounds(canvas);
  const x = selection
    ? selection.x
    : Math.max(0, Number(byId("paint-crop-x")?.value || 0));
  const y = selection
    ? selection.y
    : Math.max(0, Number(byId("paint-crop-y")?.value || 0));
  const w = selection
    ? selection.w
    : Math.max(1, Number(byId("paint-crop-w")?.value || canvas.width));
  const h = selection
    ? selection.h
    : Math.max(1, Number(byId("paint-crop-h")?.value || canvas.height));
  const sx = Math.min(canvas.width - 1, x);
  const sy = Math.min(canvas.height - 1, y);
  const sw = Math.max(1, Math.min(w, canvas.width - sx));
  const sh = Math.max(1, Math.min(h, canvas.height - sy));
  applyRasterTransform(
    (ctx, src) => ctx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh),
    sw,
    sh,
  );
  if (selection) {
    paintState.selection = { x: 0, y: 0, w: sw, h: sh };
    paintState.selecting = false;
    updateSelectionUi();
  } else {
    clearSelectionIfAny();
  }
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
  const selection = getActiveSelectionBounds(canvas);
  const rawAngle = Number(byId("paint-rotate-angle")?.value);
  const angle = Number.isFinite(rawAngle) ? rawAngle : 90;
  const normalized = ((angle % 360) + 360) % 360;
  if (selection) {
    const ctx = getCtx();
    if (!ctx) return;
    const src = document.createElement("canvas");
    src.width = canvas.width;
    src.height = canvas.height;
    src.getContext("2d")?.drawImage(canvas, 0, 0);
    const region = document.createElement("canvas");
    region.width = selection.w;
    region.height = selection.h;
    region
      .getContext("2d")
      ?.drawImage(
        src,
        selection.x,
        selection.y,
        selection.w,
        selection.h,
        0,
        0,
        selection.w,
        selection.h,
      );
    pushUndoState();
    ctx.drawImage(src, 0, 0);
    ctx.save();
    ctx.fillStyle = getBackColor();
    ctx.fillRect(selection.x, selection.y, selection.w, selection.h);
    ctx.translate(selection.x + selection.w / 2, selection.y + selection.h / 2);
    ctx.rotate((normalized * Math.PI) / 180);
    ctx.drawImage(
      region,
      -selection.w / 2,
      -selection.h / 2,
      selection.w,
      selection.h,
    );
    ctx.restore();
    updateSelectionUi();
    return;
  }
  clearSelectionIfAny();
  const swapSides = normalized === 90 || normalized === 270;
  const nextW = swapSides ? canvas.height : canvas.width;
  const nextH = swapSides ? canvas.width : canvas.height;
  applyRasterTransform(
    (ctx, src) => {
      ctx.save();
      ctx.translate(nextW / 2, nextH / 2);
      ctx.rotate((normalized * Math.PI) / 180);
      ctx.drawImage(src, -src.width / 2, -src.height / 2);
      ctx.restore();
    },
    nextW,
    nextH,
  );
}

export function paintApplyMirror() {
  const canvas = getCanvas();
  if (!canvas) return;
  const selection = getActiveSelectionBounds(canvas);
  const axisSelect = byId("paint-mirror-axis");
  const axis =
    axisSelect?.value === "vertical" || axisSelect?.value === "horizontal"
      ? axisSelect.value
      : paintState.nextMirrorAxis;
  if (selection) {
    const ctx = getCtx();
    if (!ctx) return;
    const src = document.createElement("canvas");
    src.width = canvas.width;
    src.height = canvas.height;
    src.getContext("2d")?.drawImage(canvas, 0, 0);
    const region = document.createElement("canvas");
    region.width = selection.w;
    region.height = selection.h;
    region
      .getContext("2d")
      ?.drawImage(
        src,
        selection.x,
        selection.y,
        selection.w,
        selection.h,
        0,
        0,
        selection.w,
        selection.h,
      );
    pushUndoState();
    ctx.drawImage(src, 0, 0);
    ctx.save();
    ctx.fillStyle = getBackColor();
    ctx.fillRect(selection.x, selection.y, selection.w, selection.h);
    if (axis === "vertical") {
      ctx.translate(selection.x, selection.y + selection.h);
      ctx.scale(1, -1);
    } else {
      ctx.translate(selection.x + selection.w, selection.y);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(region, 0, 0, selection.w, selection.h);
    ctx.restore();
    updateSelectionUi();
    return;
  }
  clearSelectionIfAny();
  applyRasterTransform(
    (ctx, src) => {
      ctx.save();
      if (axis === "vertical") {
        ctx.scale(1, -1);
        ctx.drawImage(src, 0, -src.height);
      } else {
        ctx.scale(-1, 1);
        ctx.drawImage(src, -src.width, 0);
      }
      ctx.restore();
    },
    canvas.width,
    canvas.height,
  );
  if (!axisSelect) {
    paintState.nextMirrorAxis =
      axis === "horizontal" ? "vertical" : "horizontal";
  }
}

export function initPaint() {
  const canvas = getCanvas();
  if (!canvas || paintState.canvasReady) return;
  paintState.canvasReady = true;
  if (!PAINT_PANELS.includes(paintState.activePanel)) {
    paintState.activePanel = "draw";
  }
  fillBackground();
  syncResizeInputs();

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointerleave", stopDrawing);
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  const input = byId("paint-open-input");
  if (input) {
    input.addEventListener("change", (event) => {
      const file = event.target?.files?.[0];
      // Opening a new image should start with clean filter controls.
      resetFilterSliders();
      updateFilterValueLabels();
      clearFilterBase();
      loadImageFile(file);
      input.value = "";
    });
  }

  [
    "paint-filter-brightness",
    "paint-filter-contrast",
    "paint-filter-saturation",
  ].forEach((id) => {
    const inputEl = byId(id);
    if (!inputEl) return;
    inputEl.addEventListener("input", () => {
      updateFilterValueLabels();
      previewFilters();
    });
  });
  updateFilterValueLabels();

  const wrap = getCanvasWrap();
  if (wrap) {
    wrap.addEventListener("scroll", syncGridOverlay);
  }
  window.addEventListener("resize", () => {
    syncGridOverlay();
    if (isPaintPageActive()) syncResizeInputs();
  });

  document.addEventListener("keydown", onPaintKeyDown);

  const page = getPage();
  if (page) {
    const observer = new MutationObserver(syncPaintPageMode);
    observer.observe(page, { attributes: true, attributeFilter: ["class"] });
  }

  updatePanelUi();
  updateShapeUi();
  updateToolUi();
  updateZoomUi();
  updateGridUi();
  updateSelectionUi();
  syncPaintPageMode();
  handlePaintFullscreenChange();
  initPaintFontOptions();
}
