import { defineConfig } from "orval";
import { readOpenApiUrl } from "./orval-url";

const OPENAPI_URL = readOpenApiUrl();

export default defineConfig({
  adminApi: {
    input: {
      target: OPENAPI_URL,
      filters: { tags: ["Admin authentication"] },
    },
    output: {
      mode: "single",
      target: "src/gen/admin-auth.ts",
      client: "react-query",
      httpClient: "axios",
      formatter: "prettier",
      override: {
        mutator: {
          path: "src/api/mutator/custom-instance.ts",
          name: "customInstance",
        },
      },
    },
  },
  adminApiZod: {
    input: {
      target: OPENAPI_URL,
      filters: { tags: ["Admin authentication"] },
    },
    output: {
      mode: "single",
      client: "zod",
      target: "src/gen/admin-auth",
      fileExtension: ".zod.ts",
      formatter: "prettier",
    },
  },
});
