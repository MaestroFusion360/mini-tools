import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "src/tests/layout",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx http-server . -p 4173 -c-1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
