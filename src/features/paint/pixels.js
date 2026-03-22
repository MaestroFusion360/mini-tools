export function makeOffscreenFromImageData(imageData) {
  const offscreen = document.createElement("canvas");
  offscreen.width = imageData.width;
  offscreen.height = imageData.height;
  offscreen.getContext("2d")?.putImageData(imageData, 0, 0);
  return offscreen;
}

export function buildFilterString({ brightness, contrast, saturation }) {
  return `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`;
}

export function rgbToHex(r, g, b) {
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

export function floodFillOnCanvas(ctx, canvas, x, y, fillHexColor) {
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
  const fill = hexToRgb(fillHexColor);
  if (targetR === fill.r && targetG === fill.g && targetB === fill.b && targetA === 255) {
    return;
  }

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
