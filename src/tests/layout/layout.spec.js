import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { width: 320, height: 740 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 1366 },
  { width: 1440, height: 900 },
];

const PAGES = [
  { menuButton: "#menu-weather-btn", page: "#page-weather", bounds: true },
  { menuButton: "#menu-time-btn", page: "#page-time", bounds: true },
  { menuButton: "#menu-timer-btn", page: "#page-timer", bounds: true },
  { menuButton: "#menu-stopwatch-btn", page: "#page-stopwatch", bounds: true },
  { menuButton: "#menu-calendar-btn", page: "#page-calendar", bounds: true },
  { menuButton: "#menu-converter-btn", page: "#page-converter", bounds: true },
  { menuButton: "#menu-calc-btn", page: "#page-calc", bounds: true },
  { menuButton: "#menu-text-btn", page: "#page-text", bounds: true },
  { menuButton: "#menu-currency-btn", page: "#page-currency", bounds: true },
  { menuButton: "#menu-paint-btn", page: "#page-paint", bounds: false },
  { menuButton: "#menu-media-btn", page: "#page-media", bounds: false },
];

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const maxWidth = Math.max(root.scrollWidth, body?.scrollWidth || 0);
    return maxWidth - window.innerWidth;
  });

  expect(overflow).toBeLessThanOrEqual(1);
}

async function assertActiveLayoutBounds(page) {
  const bounds = await page.evaluate(() => {
    const active = document.querySelector(".page.active");
    if (!active) return [];

    const nodes = [
      ...active.querySelectorAll(".card, .menu-btn, button, input, select, textarea"),
    ];

    return nodes
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          visible: rect.width > 0 && rect.height > 0,
        };
      })
      .filter((n) => n.visible && n.width > 2);
  });

  for (const rect of bounds) {
    expect(rect.left).toBeGreaterThanOrEqual(-1);
    expect(rect.right).toBeLessThanOrEqual(page.viewportSize().width + 1);
  }
}

test.describe("layout smoke", () => {
  for (const viewport of VIEWPORTS) {
    test(`responsive layout ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.waitForSelector("#app .page.active");

      await assertNoHorizontalOverflow(page);
      await assertActiveLayoutBounds(page);

      for (const item of PAGES) {
        await page.click(item.menuButton);
        await expect(page.locator(`${item.page}.active`)).toBeVisible();
        await assertNoHorizontalOverflow(page);
        if (item.bounds) {
          await assertActiveLayoutBounds(page);
        }

        await page.click(`${item.page} .back-btn`);
        await expect(page.locator("#page-menu.active")).toBeVisible();
      }
    });
  }
});
