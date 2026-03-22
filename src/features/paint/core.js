import { byId } from "../../core/dom.js";
import {
  MAX_HISTORY,
  MAX_ZOOM,
  MIN_ZOOM,
  PAINT_PANELS,
  paintState,
} from "./state.js";
import { initPaintFontOptions } from "./fonts.js";
import {
  buildFilterString,
  floodFillOnCanvas,
  makeOffscreenFromImageData,
  rgbToHex,
} from "./pixels.js";

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

function getActiveSelectionBounds(canvas = getCanvas()) {
  if (!canvas || !paintState.selection) return null;
  const rawX = Number(paintState.selection.x);
  const rawY = Number(paintState.selection.y);
  const rawW = Number(paintState.selection.w);
  const rawH = Number(paintState.selection.h);
  if (!Number.isFinite(rawX) || !Number.isFinite(rawY) || !Number.isFinite(rawW) || !Number.isFinite(rawH)) {
    return null;
  }
  const x = Math.max(0, Math.floor(rawX));
  const y = Math.max(0, Math.floor(rawY));
  const w = Math.max(1, Math.floor(rawW));
  const h = Math.max(1, Math.floor(rawH));
  if (x >= canvas.width || y >= canvas.height) return null;
  const clampedW = Math.max(1, Math.min(w, canvas.width - x));
  const clampedH = Math.max(1, Math.min(h, canvas.height - y));
  return { x, y, w: clampedW, h: clampedH };
}

function updateZoomUi() {
  const canvas = getCanvas();
  const label = getZoomLabel();
  if (canvas) {
    if (isPaintFullscreen() && paintState.zoom === 1) {
      canvas.style.width = "auto";
      canvas.style.height = "auto";
    } else {
      const nextWidth = Math.max(1, Math.round(canvas.width * paintState.zoom));
      const nextHeight = Math.max(1, Math.round(canvas.height * paintState.zoom));
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
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
    ["star", byId("paint-shape-star-btn")],
    ["arrow-up", byId("paint-shape-arrow-up-btn")],
    ["arrow-down", byId("paint-shape-arrow-down-btn")],
    ["arrow-left", byId("paint-shape-arrow-left-btn")],
    ["arrow-right", byId("paint-shape-arrow-right-btn")],
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
  const showTextUi = tool === "text" && (paintState.activePanel === "" || paintState.activePanel === "draw");
  const brushBtn = byId("paint-tool-brush-btn");
  const eraserBtn = byId("paint-tool-eraser-btn");
  const textBtn = byId("paint-tool-text-btn");
  const pipetteBtn = byId("paint-tool-pipette-btn");
  const fillBtn = byId("paint-tool-fill-btn");
  const textWrap = byId("paint-text-wrap");
  const fontBtn = byId("paint-text-fonts-btn");
  const fontWrap = byId("paint-font-wrap");
  const textStyleWrap = byId("paint-text-style-wrap");
  const textBoldBtn = byId("paint-text-bold-btn");
  const textItalicBtn = byId("paint-text-italic-btn");
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
    textWrap.classList.toggle("is-hidden", !showTextUi);
  }
  if (fontBtn) {
    paintState.showFontPanel = false;
    fontBtn.classList.add("is-hidden");
    fontBtn.classList.remove("active");
    fontBtn.setAttribute("aria-pressed", "false");
  }
  if (fontWrap) {
    fontWrap.classList.toggle("is-hidden", !showTextUi);
  }
  if (textStyleWrap) {
    textStyleWrap.classList.toggle("is-hidden", !showTextUi);
  }
  if (textBoldBtn) {
    const isActive = tool === "text" && paintState.textBold;
    textBoldBtn.classList.toggle("active", isActive);
    textBoldBtn.setAttribute("aria-pressed", isActive ? "true" : "false");
  }
  if (textItalicBtn) {
    const isActive = tool === "text" && paintState.textItalic;
    textItalicBtn.classList.toggle("active", isActive);
    textItalicBtn.setAttribute("aria-pressed", isActive ? "true" : "false");
  }
}

function getPage() {
  return byId("page-paint");
}

function getFullscreenButton() {
  return byId("paint-fullscreen-btn");
}

function isPaintFullscreen() {
  return paintState.fullscreen;
}

function updateFullscreenUi() {
  const page = getPage();
  const button = getFullscreenButton();
  const isActive = isPaintFullscreen();
  if (page) {
    page.classList.toggle("paint-fullscreen", isActive);
  }
  document.body.classList.toggle("paint-immersive-active", isActive);
  if (!button) return;
  button.classList.toggle("active", isActive);
  button.setAttribute("aria-pressed", isActive ? "true" : "false");
}

function syncPaintPageMode() {
  const isActive = isPaintPageActive();
  document.body.classList.toggle("paint-page-active", isActive);
  if (isActive) {
    requestAnimationFrame(() => {
      autoResizeCanvasToViewport();
      syncResizeInputs();
      syncGridOverlay();
    });
  }
  if (!isActive && paintState.fullscreen) {
    paintState.fullscreen = false;
    updateFullscreenUi();
  }
}

function handlePaintFullscreenChange() {
  updateFullscreenUi();
  updateZoomUi();
  syncGridOverlay();
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

function getTextWeight() {
  return paintState.textBold ? 700 : 400;
}

function getTextStyle() {
  return paintState.textItalic ? "italic" : "normal";
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
  floodFillOnCanvas(ctx, canvas, x, y, getColor());
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
  updateZoomUi();
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

function autoResizeCanvasToViewport() {
  const canvas = getCanvas();
  const wrap = getCanvasWrap();
  if (!canvas || !wrap) return;
  if (paintState.autoSizedToViewport) return;
  if (
    canvas.width !== 640 ||
    canvas.height !== 360 ||
    paintState.undoStack.length ||
    paintState.redoStack.length
  ) {
    paintState.autoSizedToViewport = true;
    return;
  }
  const availableWidth = Math.max(240, Math.floor(wrap.clientWidth - 16));
  const availableHeight = Math.max(180, Math.floor(wrap.clientHeight - 16));
  if (availableWidth !== canvas.width || availableHeight !== canvas.height) {
    setCanvasSize(availableWidth, availableHeight);
    fillBackground();
  }
  paintState.autoSizedToViewport = true;
  syncResizeInputs();
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
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.max(1, Math.abs(x2 - x1));
  const height = Math.max(1, Math.abs(y2 - y1));
  const right = left + width;
  const bottom = top + height;
  const centerX = left + width / 2;
  const centerY = top + height / 2;

  const strokePolygon = (points) => {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.stroke();
  };

  const drawStar = () => {
    const outerRx = width / 2;
    const outerRy = height / 2;
    const innerRatio = 0.5;
    const points = [];
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const isOuter = i % 2 === 0;
      const rx = isOuter ? outerRx : outerRx * innerRatio;
      const ry = isOuter ? outerRy : outerRy * innerRatio;
      points.push([centerX + Math.cos(angle) * rx, centerY + Math.sin(angle) * ry]);
    }
    strokePolygon(points);
  };

  const drawArrow = (direction) => {
    const head = Math.max(6, Math.min(width, height) * 0.42);
    if (direction === "up") {
      strokePolygon([
        [centerX, top],
        [right, top + head],
        [centerX + width * 0.22, top + head],
        [centerX + width * 0.22, bottom],
        [centerX - width * 0.22, bottom],
        [centerX - width * 0.22, top + head],
        [left, top + head],
      ]);
      return;
    }
    if (direction === "down") {
      strokePolygon([
        [centerX, bottom],
        [right, bottom - head],
        [centerX + width * 0.22, bottom - head],
        [centerX + width * 0.22, top],
        [centerX - width * 0.22, top],
        [centerX - width * 0.22, bottom - head],
        [left, bottom - head],
      ]);
      return;
    }
    if (direction === "left") {
      strokePolygon([
        [left, centerY],
        [left + head, top],
        [left + head, centerY - height * 0.22],
        [right, centerY - height * 0.22],
        [right, centerY + height * 0.22],
        [left + head, centerY + height * 0.22],
        [left + head, bottom],
      ]);
      return;
    }
    strokePolygon([
      [right, centerY],
      [right - head, top],
      [right - head, centerY - height * 0.22],
      [left, centerY - height * 0.22],
      [left, centerY + height * 0.22],
      [right - head, centerY + height * 0.22],
      [right - head, bottom],
    ]);
  };

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
  } else if (shape === "star") {
    drawStar();
  } else if (shape === "arrow-up") {
    drawArrow("up");
  } else if (shape === "arrow-down") {
    drawArrow("down");
  } else if (shape === "arrow-left") {
    drawArrow("left");
  } else if (shape === "arrow-right") {
    drawArrow("right");
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
  const fontSize = Math.max(12, getSize() * 4);
  ctx.font = `${getTextStyle()} ${getTextWeight()} ${fontSize}px "${getTextFont()}", Manrope, sans-serif`;
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
  if (
    shapeTool === "rect" ||
    shapeTool === "ellipse" ||
    shapeTool === "line" ||
    shapeTool === "star" ||
    shapeTool === "arrow-up" ||
    shapeTool === "arrow-down" ||
    shapeTool === "arrow-left" ||
    shapeTool === "arrow-right"
  ) {
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
      paintState.shapeTool === "line" ||
      paintState.shapeTool === "star" ||
      paintState.shapeTool === "arrow-up" ||
      paintState.shapeTool === "arrow-down" ||
      paintState.shapeTool === "arrow-left" ||
      paintState.shapeTool === "arrow-right") &&
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
      // Keep original canvas as spline base so final result does not include
      // the preview chord line (which made curves look closed).
      paintState.splineBaseImageData = paintState.shapeBaseImageData;
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
      paintState.shapeTool === "line" ||
      paintState.shapeTool === "star" ||
      paintState.shapeTool === "arrow-up" ||
      paintState.shapeTool === "arrow-down" ||
      paintState.shapeTool === "arrow-left" ||
      paintState.shapeTool === "arrow-right") &&
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
  if (event.key === "Escape" && isPaintFullscreen()) {
    paintState.fullscreen = false;
    handlePaintFullscreenChange();
    event.preventDefault();
    return;
  }
  if (event.key !== "Delete") return;
  if (!isPaintPageActive()) return;
  if (isEditableTarget(event.target)) return;
  if (deleteSelectionPixels()) {
    event.preventDefault();
  }
}

export {
  applyRasterTransform,
  autoResizeCanvasToViewport,
  buildFilterString,
  clearFilterBase,
  clearSelectionIfAny,
  clearShapeBase,
  clearSplineState,
  deactivateSelectionMode,
  drawShape,
  drawSplineCurve,
  drawStroke,
  fillBackground,
  floodFillAt,
  getActiveSelectionBounds,
  getBackColor,
  getCanvas,
  getCanvasWrap,
  getCtx,
  getFilterValues,
  getPage,
  getPointer,
  getSnapshot,
  getTool,
  handlePaintFullscreenChange,
  initPaintFontOptions,
  isPaintFullscreen,
  isPaintPageActive,
  loadImageFile,
  makeOffscreenFromImageData,
  onPaintKeyDown,
  onPointerDown,
  onPointerMove,
  pickCanvasColor,
  pushUndoState,
  restoreSnapshot,
  setCanvasSize,
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
};

