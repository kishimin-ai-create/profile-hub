import { defineConfig, devices } from "@playwright/test";

// Must match `server.port` in vite.config.ts, or the webServer readiness check
// waits on a port the dev server never binds.
const localFrontendUrl = process.env.LOCAL_FRONTEND_URL ?? "http://localhost:3002";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? localFrontendUrl;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer:
    process.env.PLAYWRIGHT_BASE_URL === undefined
      ? {
          command: "bun run dev",
          reuseExistingServer: !process.env.CI,
          url: baseURL,
        }
      : undefined,
});
