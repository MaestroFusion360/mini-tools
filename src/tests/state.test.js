import { describe, expect, it } from "vitest";
import {
  getStored,
  getStoredJson,
  setStored,
  setStoredJson,
} from "../core/state.js";

describe("state storage helpers", () => {
  it("stores and reads plain values", () => {
    localStorage.clear();
    setStored("k", "v");
    expect(getStored("k", "x")).toBe("v");
    expect(getStored("missing", "x")).toBe("x");
  });

  it("stores and reads JSON values with fallback", () => {
    localStorage.clear();
    setStoredJson("obj", { a: 1 });
    expect(getStoredJson("obj", null)).toEqual({ a: 1 });
    localStorage.setItem("bad", "{not-json");
    expect(getStoredJson("bad", [])).toEqual([]);
  });
});
