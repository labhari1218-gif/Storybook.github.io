import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    ...devices["Pixel 7"],
    baseURL: "http://127.0.0.1:4321",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && npm run preview:test",
    port: 4321,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
