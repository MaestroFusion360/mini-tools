import { beforeEach, describe, expect, it, vi } from "vitest";
import { FEATURE_RUNTIME_STATE } from "../core/state.js";
import {
  initPaint,
  paintSetTool,
  paintToggleGrid,
  paintTogglePanel,
  paintZoomIn,
  paintZoomOut,
  paintZoomReset,
} from "../features/paint.js";

function getDefaultPaintState() {
  return {
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
    fullscreen: false,
    textBold: false,
    textItalic: false,
    autoSizedToViewport: false,
  };
}

function mountPaintDom() {
  document.body.innerHTML = `
    <div class="page active" id="page-paint">
      <input id="paint-open-input" type="file" />
      <div id="paint-top-hover-zone"></div>
      <div class="paint-controls"></div>
      <div id="paint-panel-draw"></div>
      <div id="paint-panel-resize"></div>
      <div id="paint-panel-crop"></div>
      <div id="paint-panel-rotate"></div>
      <div id="paint-panel-mirror"></div>
      <div id="paint-panel-filters"></div>
      <div id="paint-panel-shapes"></div>
      <div id="paint-panel-zoom"></div>
      <button id="paint-panel-draw-btn"></button>
      <button id="paint-panel-resize-btn"></button>
      <button id="paint-panel-crop-btn"></button>
      <button id="paint-panel-rotate-btn"></button>
      <button id="paint-panel-mirror-btn"></button>
      <button id="paint-panel-filters-btn"></button>
      <button id="paint-panel-shapes-btn"></button>
      <button id="paint-panel-zoom-btn"></button>
      <button id="paint-tool-brush-btn"></button>
      <button id="paint-tool-eraser-btn"></button>
      <button id="paint-tool-text-btn"></button>
      <button id="paint-tool-pipette-btn"></button>
      <button id="paint-tool-fill-btn"></button>
      <button id="paint-shape-rect-btn"></button>
      <button id="paint-shape-ellipse-btn"></button>
      <button id="paint-shape-line-btn"></button>
      <button id="paint-shape-spline-btn"></button>
      <button id="paint-shape-star-btn"></button>
      <button id="paint-shape-arrow-up-btn"></button>
      <button id="paint-shape-arrow-down-btn"></button>
      <button id="paint-shape-arrow-left-btn"></button>
      <button id="paint-shape-arrow-right-btn"></button>
      <button id="paint-select-btn"></button>
      <button id="paint-grid-btn"></button>
      <button id="paint-fullscreen-btn"></button>
      <button id="paint-text-fonts-btn"></button>
      <button id="paint-text-bold-btn"></button>
      <button id="paint-text-italic-btn"></button>
      <div id="paint-text-wrap"></div>
      <div id="paint-font-wrap"></div>
      <div id="paint-text-style-wrap"></div>
      <input id="paint-text" value="" />
      <select id="paint-text-font"></select>
      <input id="paint-size" type="number" value="6" />
      <input id="paint-color" type="color" value="#0f766e" />
      <input id="paint-back-color" type="color" value="#ffffff" />
      <input id="paint-filter-brightness" type="range" value="0" />
      <input id="paint-filter-contrast" type="range" value="0" />
      <input id="paint-filter-saturation" type="range" value="0" />
      <input id="paint-resize-w" type="number" value="640" />
      <input id="paint-resize-h" type="number" value="360" />
      <input id="paint-crop-x" type="number" value="0" />
      <input id="paint-crop-y" type="number" value="0" />
      <input id="paint-crop-w" type="number" value="300" />
      <input id="paint-crop-h" type="number" value="200" />
      <input id="paint-rotate-angle" type="number" value="90" />
      <select id="paint-mirror-axis">
        <option value="horizontal">horizontal</option>
        <option value="vertical">vertical</option>
      </select>
      <span id="paint-zoom-label"></span>
      <div id="paint-canvas-wrap">
        <canvas id="paint-canvas" width="640" height="360"></canvas>
        <div id="paint-grid-overlay"></div>
        <div id="paint-selection-overlay" class="is-hidden"></div>
      </div>
    </div>
  `;

  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    ellipse: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    putImageData: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray([255, 255, 255, 255]),
      width: 1,
      height: 1,
    })),
    fillText: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    lineWidth: 1,
    lineCap: "round",
    lineJoin: "round",
    strokeStyle: "#000000",
    fillStyle: "#ffffff",
    globalCompositeOperation: "source-over",
    filter: "none",
  };

  const canvas = document.getElementById("paint-canvas");
  canvas.getContext = vi.fn(() => ctx);
  canvas.toDataURL = vi.fn(() => "data:image/png;base64,aaa");
  canvas.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: 640,
    bottom: 360,
    width: 640,
    height: 360,
  });

  const wrap = document.getElementById("paint-canvas-wrap");
  wrap.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: 640,
    bottom: 360,
    width: 640,
    height: 360,
  });
}

describe("paint unit", () => {
  beforeEach(() => {
    Object.assign(FEATURE_RUNTIME_STATE.paint, getDefaultPaintState());
    vi.stubGlobal("requestAnimationFrame", (cb) => {
      cb();
      return 1;
    });
    if (!globalThis.MutationObserver) {
      vi.stubGlobal(
        "MutationObserver",
        class {
          observe() {}
          disconnect() {}
        },
      );
    }
    mountPaintDom();
    initPaint();
  });

  it("toggles draw panel visibility and button state", () => {
    paintTogglePanel("draw");
    expect(
      document
        .getElementById("paint-panel-draw")
        ?.classList.contains("is-hidden"),
    ).toBe(false);
    expect(
      document
        .getElementById("paint-panel-draw-btn")
        ?.getAttribute("aria-pressed"),
    ).toBe("true");

    paintTogglePanel("draw");
    expect(
      document
        .getElementById("paint-panel-draw")
        ?.classList.contains("is-hidden"),
    ).toBe(true);
    expect(
      document
        .getElementById("paint-panel-draw-btn")
        ?.getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("updates active tool button for eraser", () => {
    paintSetTool("eraser");
    expect(
      document
        .getElementById("paint-tool-eraser-btn")
        ?.classList.contains("active"),
    ).toBe(true);
    expect(
      document
        .getElementById("paint-tool-eraser-btn")
        ?.getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      document
        .getElementById("paint-tool-brush-btn")
        ?.classList.contains("active"),
    ).toBe(false);
  });

  it("changes zoom label on zoom in/out/reset", () => {
    expect(document.getElementById("paint-zoom-label")?.textContent).toBe(
      "100%",
    );
    paintZoomIn();
    expect(document.getElementById("paint-zoom-label")?.textContent).toBe(
      "125%",
    );
    paintZoomOut();
    expect(document.getElementById("paint-zoom-label")?.textContent).toBe(
      "100%",
    );
    paintZoomReset();
    expect(document.getElementById("paint-zoom-label")?.textContent).toBe(
      "100%",
    );
  });

  it("toggles grid class and aria state", () => {
    paintToggleGrid();
    expect(
      document
        .getElementById("paint-canvas-wrap")
        ?.classList.contains("paint-grid-enabled"),
    ).toBe(true);
    expect(
      document.getElementById("paint-grid-btn")?.getAttribute("aria-pressed"),
    ).toBe("true");

    paintToggleGrid();
    expect(
      document
        .getElementById("paint-canvas-wrap")
        ?.classList.contains("paint-grid-enabled"),
    ).toBe(false);
    expect(
      document.getElementById("paint-grid-btn")?.getAttribute("aria-pressed"),
    ).toBe("false");
  });
});
