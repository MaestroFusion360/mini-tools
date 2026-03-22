import { byId } from "../../core/dom.js";
import { PAINT_DEFAULT_FONTS } from "./state.js";

function dedupeFonts(fonts) {
  const seen = new Set();
  const result = [];
  fonts.forEach((fontName) => {
    const name = String(fontName || "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(name);
  });
  return result;
}

function setPaintFontOptions(fonts) {
  const select = byId("paint-text-font");
  if (!select) return;
  const prev = String(select.value || "").trim();
  const uniqueFonts = dedupeFonts(fonts);
  if (!uniqueFonts.length) return;
  select.replaceChildren();
  uniqueFonts.forEach((fontName) => {
    const option = document.createElement("option");
    option.value = fontName;
    option.textContent = fontName;
    select.append(option);
  });
  const nextValue = uniqueFonts.some((name) => name === prev)
    ? prev
    : uniqueFonts[0];
  if (nextValue) {
    select.value = nextValue;
  }
}

async function getLocalFontFamilies() {
  if (typeof window.queryLocalFonts !== "function") return [];
  try {
    const fonts = await window.queryLocalFonts();
    return dedupeFonts(
      fonts.map((fontFace) => (fontFace?.family ? String(fontFace.family) : "")),
    ).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export async function initPaintFontOptions() {
  setPaintFontOptions(PAINT_DEFAULT_FONTS);
  const localFonts = await getLocalFontFamilies();
  if (!localFonts.length) return;
  setPaintFontOptions([...PAINT_DEFAULT_FONTS, ...localFonts]);
}
