import { expect, test } from "bun:test";

import app from "./index";

test("OpenAPI describes the public favourites response for client generation", async () => {
  const response = await app.request("/docs/json");

  expect(response.status).toBe(200);
  const document: unknown = await response.json();
  expect(document).toMatchObject({
    paths: {
      "/api/public/favourites": {
        get: {
          operationId: "listFavourites",
          responses: {
            "200": {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["data"],
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          required: ["id", "name", "description", "link", "displayOrder"],
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            description: { type: "string" },
                            link: { type: "string" },
                            displayOrder: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
});
