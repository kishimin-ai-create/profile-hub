import { defineConfig, devices } from "@playwright/test";

const frontend = "http://localhost:43112";
const api = "http://localhost:43113";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "auth-session.large.spec.ts",
  workers: 1,
  reporter: "list",
  use: { baseURL: frontend, trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    { command: "bun run e2e/auth-api-fixture.mjs", url: `${api}/health`, reuseExistingServer: false },
    { command: "bun run dev -- --port 43112 --strictPort", url: frontend, reuseExistingServer: false, env: { VITE_API_URL: api } },
  ],
});
