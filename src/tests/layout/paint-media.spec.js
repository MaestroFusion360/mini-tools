import { expect, test } from "@playwright/test";

function createSilentWavBuffer(durationMs = 120) {
  const sampleRate = 8000;
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.max(1, Math.floor((sampleRate * durationMs) / 1000));
  const dataSize = numSamples * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

async function getCanvasInkCount(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById("paint-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return -1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return -1;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let inkPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (!(r === 255 && g === 255 && b === 255 && a === 255)) {
        inkPixels += 1;
      }
    }
    return inkPixels;
  });
}

test.describe("paint and media behavior", () => {
  test("paint draw + undo/redo changes bitmap", async ({ page }) => {
    await page.goto("/");
    await page.click("#menu-paint-btn");
    await expect(page.locator("#page-paint.active")).toBeVisible();

    const canvas = page.locator("#paint-canvas");
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    const before = await getCanvasInkCount(page);

    const startX = box.x + box.width * 0.25;
    const startY = box.y + box.height * 0.25;
    const endX = box.x + box.width * 0.7;
    const endY = box.y + box.height * 0.7;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    const afterDraw = await getCanvasInkCount(page);
    expect(afterDraw).toBeGreaterThan(before);

    await page.click("#paint-undo-btn");
    const afterUndo = await getCanvasInkCount(page);
    expect(afterUndo).toBe(before);

    await page.click("#paint-redo-btn");
    const afterRedo = await getCanvasInkCount(page);
    expect(afterRedo).toBeGreaterThan(afterUndo);
  });

  test("media playlist load + next + clear", async ({ page }) => {
    await page.goto("/");
    await page.click("#menu-media-btn");
    await expect(page.locator("#page-media.active")).toBeVisible();

    const files = [
      {
        name: "sample-a.wav",
        mimeType: "audio/wav",
        buffer: createSilentWavBuffer(120),
      },
      {
        name: "sample-b.wav",
        mimeType: "audio/wav",
        buffer: createSilentWavBuffer(140),
      },
    ];

    await page.setInputFiles("#media-files-input", files);

    const options = page.locator("#media-playlist option");
    await expect(options).toHaveCount(2);
    await expect(page.locator("#media-playlist")).toBeEnabled();
    await expect(page.locator("#media-now-playing")).toContainText("sample-a.wav");

    await page.click("#media-next-btn");
    await expect(page.locator("#media-now-playing")).toContainText("sample-b.wav");

    await page.click("#media-clear-btn");
    await expect(page.locator("#media-playlist")).toBeDisabled();
    await expect(page.locator("#media-playlist option")).toHaveCount(1);
    await expect(page.locator("#media-now-playing")).not.toContainText("sample-a.wav");
    await expect(page.locator("#media-now-playing")).not.toContainText("sample-b.wav");
  });
});
