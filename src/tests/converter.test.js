import { beforeEach, describe, expect, it } from "vitest";
import {
  convertUnit,
  initConverter,
  swapConvUnits,
  updateConvUnits,
} from "../features/converter.js";

function mountConverterDom() {
  document.body.innerHTML = `
    <h2 id="title-converter"></h2>
    <label for="conv-precision"></label>
    <select id="conv-type">
      <option value="length">Length</option>
      <option value="area">Area</option>
      <option value="volume">Volume</option>
      <option value="weight">Weight</option>
      <option value="speed">Speed</option>
      <option value="temperature">Temperature</option>
      <option value="pressure">Pressure</option>
      <option value="energy">Energy</option>
      <option value="data">Data</option>
      <option value="power">Power</option>
      <option value="time">Time</option>
      <option value="angle">Angle</option>
    </select>
    <input id="conv-val" type="text" value="1" />
    <input id="conv-precision" type="range" min="2" max="12" value="6" />
    <span id="conv-precision-value"></span>
    <select id="conv-from"></select>
    <select id="conv-to"></select>
    <div id="conv-presets"></div>
    <div id="conv-result"></div>
  `;
}

describe("converter modes", () => {
  beforeEach(() => {
    localStorage.clear();
    mountConverterDom();
    initConverter();
  });

  it("renders defaults and computes length conversion", () => {
    const result = document.getElementById("conv-result")?.innerHTML || "";
    expect(result).toContain("=");
    expect(result).toContain("km");
  });

  it("supports all converter categories", () => {
    const typeSelect = document.getElementById("conv-type");
    const fromSelect = document.getElementById("conv-from");
    const toSelect = document.getElementById("conv-to");

    [
      "length",
      "area",
      "volume",
      "weight",
      "speed",
      "temperature",
      "pressure",
      "energy",
      "data",
      "power",
      "time",
      "angle",
    ].forEach((mode) => {
      typeSelect.value = mode;
      updateConvUnits();
      expect(fromSelect.options.length).toBeGreaterThan(0);
      expect(toSelect.options.length).toBeGreaterThan(0);
      expect(
        document.getElementById("conv-presets")?.children.length,
      ).toBeGreaterThan(0);
    });
  });

  it("converts temperatures across modes", () => {
    document.getElementById("conv-type").value = "temperature";
    updateConvUnits();

    document.getElementById("conv-from").value = "F";
    document.getElementById("conv-to").value = "C";
    document.getElementById("conv-val").value = "32";
    convertUnit();

    const result = document.getElementById("conv-result")?.textContent || "";
    expect(result).toContain("0");
    expect(result).toContain("°C");
  });

  it("swaps units and recalculates", () => {
    document.getElementById("conv-type").value = "length";
    updateConvUnits();

    document.getElementById("conv-from").value = "km";
    document.getElementById("conv-to").value = "m";
    swapConvUnits();

    expect(document.getElementById("conv-from")?.value).toBe("m");
    expect(document.getElementById("conv-to")?.value).toBe("km");
  });

  it("does not show reverse rate when input value is zero", () => {
    document.getElementById("conv-type").value = "weight";
    updateConvUnits();
    document.getElementById("conv-val").value = "0";
    convertUnit();

    const result = document.getElementById("conv-result")?.textContent || "";
    expect(result.includes("rateLabel")).toBe(false);
  });

  it("uses scientific notation for tiny values", () => {
    document.getElementById("conv-type").value = "energy";
    updateConvUnits();
    document.getElementById("conv-from").value = "j";
    document.getElementById("conv-to").value = "kwh";
    document.getElementById("conv-val").value = "1";
    document.getElementById("conv-precision").value = "8";
    convertUnit();

    const result = document.getElementById("conv-result")?.textContent || "";
    expect(result.toLowerCase()).toContain("e-");
  });

  it("converts pressure values with expected magnitude", () => {
    document.getElementById("conv-type").value = "pressure";
    updateConvUnits();
    document.getElementById("conv-from").value = "bar";
    document.getElementById("conv-to").value = "psi";
    document.getElementById("conv-val").value = "1";
    convertUnit();

    const result = document.getElementById("conv-result")?.textContent || "";
    expect(result).toContain("14.");
  });

  it("converts data units", () => {
    document.getElementById("conv-type").value = "data";
    updateConvUnits();
    document.getElementById("conv-from").value = "mbit";
    document.getElementById("conv-to").value = "mbyte";
    document.getElementById("conv-val").value = "8";
    convertUnit();

    const result = document.getElementById("conv-result")?.textContent || "";
    expect(result).toContain("1");
  });

  it("converts power units", () => {
    document.getElementById("conv-type").value = "power";
    updateConvUnits();
    document.getElementById("conv-from").value = "kw";
    document.getElementById("conv-to").value = "w";
    document.getElementById("conv-val").value = "1";
    convertUnit();

    const result = document.getElementById("conv-result")?.textContent || "";
    expect(result).toMatch(/1[,\s]?000/);
  });

  it("converts time units", () => {
    document.getElementById("conv-type").value = "time";
    updateConvUnits();
    document.getElementById("conv-from").value = "h";
    document.getElementById("conv-to").value = "min";
    document.getElementById("conv-val").value = "1";
    convertUnit();

    const result = document.getElementById("conv-result")?.textContent || "";
    expect(result).toContain("60");
  });

  it("converts angle units", () => {
    document.getElementById("conv-type").value = "angle";
    updateConvUnits();
    document.getElementById("conv-from").value = "deg";
    document.getElementById("conv-to").value = "rad";
    document.getElementById("conv-val").value = "180";
    convertUnit();

    const result = document.getElementById("conv-result")?.textContent || "";
    expect(result).toContain("3.141");
  });

  it("accepts comma decimal input", () => {
    document.getElementById("conv-type").value = "length";
    updateConvUnits();
    document.getElementById("conv-from").value = "m";
    document.getElementById("conv-to").value = "cm";
    document.getElementById("conv-val").value = "1,5";
    convertUnit();

    const result = document.getElementById("conv-result")?.textContent || "";
    expect(result).toContain("150");
  });

  it("keeps selected units on language re-apply", () => {
    document.getElementById("conv-type").value = "time";
    updateConvUnits();
    document.getElementById("conv-from").value = "h";
    document.getElementById("conv-to").value = "week";
    updateConvUnits();

    expect(document.getElementById("conv-from")?.value).toBe("h");
    expect(document.getElementById("conv-to")?.value).toBe("week");
  });
});
