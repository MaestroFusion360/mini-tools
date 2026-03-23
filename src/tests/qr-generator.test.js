import { beforeEach, describe, expect, it } from "vitest";
import {
  buildQrImageUrl,
  clearQrCode,
  generateQrCode,
  initQrGenerator,
} from "../features/qr-generator.js";

function mountQrDom() {
  document.body.innerHTML = `
    <span id="menu-qr"></span>
    <h2 id="title-qr"></h2>
    <label id="qr-input-label"></label>
    <textarea id="qr-input"></textarea>
    <select id="qr-size">
      <option value="160">160 x 160</option>
      <option value="220" selected>220 x 220</option>
    </select>
    <button id="qr-generate-btn"></button>
    <button id="qr-clear-btn"></button>
    <button id="qr-download-btn"></button>
    <div id="qr-status"></div>
    <div id="qr-preview-wrap" class="is-hidden"></div>
    <img id="qr-image" />
  `;
}

describe("qr generator module", () => {
  beforeEach(() => {
    mountQrDom();
    initQrGenerator();
  });

  it("builds encoded qr url", () => {
    const url = buildQrImageUrl("hello world", 220);
    expect(url).toContain("size=220x220");
    expect(url).toContain("hello%20world");
  });

  it("normalizes invalid qr size values", () => {
    expect(buildQrImageUrl("x", -10)).toContain("size=100x100");
    expect(buildQrImageUrl("x", "999999")).toContain("size=1000x1000");
    expect(buildQrImageUrl("x", "12.34")).toContain("size=100x100");
  });

  it("generates qr image and shows preview after image load", () => {
    document.getElementById("qr-input").value = "https://example.com";
    document.getElementById("qr-size").value = "160";
    generateQrCode();

    const image = document.getElementById("qr-image");
    const preview = document.getElementById("qr-preview-wrap");
    expect(preview.classList.contains("is-hidden")).toBe(true);
    image.dispatchEvent(new Event("load"));
    expect(image.getAttribute("src")).toContain("size=160x160");
    expect(preview.classList.contains("is-hidden")).toBe(false);
  });

  it("clears qr state and hides preview", () => {
    document.getElementById("qr-input").value = "abc";
    generateQrCode();
    clearQrCode();

    const image = document.getElementById("qr-image");
    const preview = document.getElementById("qr-preview-wrap");
    expect(image.getAttribute("src")).toBe(null);
    expect(preview.classList.contains("is-hidden")).toBe(true);
  });
});
