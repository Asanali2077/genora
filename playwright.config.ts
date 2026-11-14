import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: process.env.BASE_URL ?? `http://localhost:${PORT}`, ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, trace: "off", screenshot: "only-on-failure" },
  webServer: process.env.BASE_URL ? undefined : { command: `npx next dev -p ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: true, timeout: 120_000 },
});
