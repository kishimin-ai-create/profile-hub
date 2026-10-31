import { defineConfig, devices } from "@playwright/test";

const frontend = "https://localhost:43112";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "auth-session.large.spec.ts",
  workers: 1,
  reporter: "list",
  use: { baseURL: frontend, trace: "on-first-retry", ignoreHTTPSErrors: true },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "bun run e2e/auth-api-fixture.mjs",
    url: frontend,
    reuseExistingServer: false,
    ignoreHTTPSErrors: true,
  },
});
