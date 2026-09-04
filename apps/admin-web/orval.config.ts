import { defineConfig } from "orval";
import { readOpenApiUrl } from "./orval-url";

const OPENAPI_URL = readOpenApiUrl();

export default defineConfig({
  adminApi: {
    input: {
      target: OPENAPI_URL,
    },
    output: {
      mode: "tags-split",
      target: "src/api/endpoints/admin-api.ts",
      schemas: "src/models",
      client: "react-query",
      httpClient: "axios",
      clean: true,
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
    },
    output: {
      mode: "tags-split",
      client: "zod",
      target: "src/api/endpoints/zod",
      fileExtension: ".zod.ts",
      formatter: "prettier",
    },
  },
});
