import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "public-api.large.test.ts",
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:43122", trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    { command: "bun run e2e/public-api-fixture.mjs", url: "http://localhost:43123/api/public/profile", reuseExistingServer: false },
    { command: "bun run dev -- --port 43122 --strictPort", url: "http://localhost:43122", reuseExistingServer: false, env: { VITE_API_URL: "http://localhost:43123" } },
  ],
});
