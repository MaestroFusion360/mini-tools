import { FEATURE_RUNTIME_STATE } from "../../core/state.js";

export const MAX_HISTORY = 25;
export const PAINT_PANELS = [
  "draw",
  "resize",
  "crop",
  "rotate",
  "mirror",
  "filters",
  "shapes",
  "zoom",
];
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
export const PAINT_DEFAULT_FONTS = [
  "Manrope",
  "Arial",
  "Arial Black",
  "Bahnschrift",
  "Calibri",
  "Cambria",
  "Candara",
  "Comic Sans MS",
  "Consolas",
  "Corbel",
  "Courier",
  "Courier New",
  "Franklin Gothic Medium",
  "Georgia",
  "Impact",
  "Lucida Console",
  "Lucida Sans Unicode",
  "Palatino Linotype",
  "Segoe UI",
  "Tahoma",
  "Times New Roman",
  "Verdana",
];

export const paintState = FEATURE_RUNTIME_STATE.paint;
