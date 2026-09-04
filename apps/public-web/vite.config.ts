import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { configDefaults, coverageConfigDefaults, defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    include: ["src/**/*.{small,medium,large}.test.{ts,tsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    passWithNoTests: true,
    reporters: process.env.GITHUB_ACTIONS ? ["dot", "github-actions", "json"] : ["dot"],
    outputFile: "test-result.json",
    exclude: [...configDefaults.exclude, "e2e/**", "**/.storybook/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      // Thresholds are opt-in through the environment so a scaffold with no
      // tests yet does not fail the build, while CI can still demand a number.
      thresholds: process.env.COVERAGE_THRESHOLD
        ? {
            branches: Number(process.env.COVERAGE_THRESHOLD),
            functions: Number(process.env.COVERAGE_THRESHOLD),
            lines: Number(process.env.COVERAGE_THRESHOLD),
            statements: Number(process.env.COVERAGE_THRESHOLD),
          }
        : undefined,
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/api/endpoints/**",
        "src/gen/**",
        "src/models/**",
        "src/main.tsx",
        "src/tests/**",
        "**/*.stories.{ts,tsx}",
        ".storybook/**",
      ],
    },
  },
});
