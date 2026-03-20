import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const data = JSON.parse(readFileSync("i18n.json", "utf8"));

describe("i18n dictionary", () => {
  it("has en and ru locales", () => {
    expect(data.en).toBeTruthy();
    expect(data.ru).toBeTruthy();
  });

  it("contains weather status translations for both locales", () => {
    const keys = [
      "weatherCodeClear",
      "weatherCodeOvercast",
      "weatherCodeRain",
      "weatherCodeThunderstorm",
      "weatherSourceUnavailable",
    ];
    for (const key of keys) {
      expect(data.en[key]).toBeTypeOf("string");
      expect(data.ru[key]).toBeTypeOf("string");
      expect(data.en[key].length).toBeGreaterThan(0);
      expect(data.ru[key].length).toBeGreaterThan(0);
    }
  });
});

