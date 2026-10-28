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

test("OpenAPI requires a section and describes portfolio response fields", async () => {
  const response = await app.request("/docs/json");
  const document: unknown = await response.json();

  expect(response.status).toBe(200);
  expect(document).toMatchObject({
    paths: {
      "/api/public/portfolio": {
        get: {
          operationId: "listPortfolios",
          parameters: [
            {
              name: "section",
              in: "query",
              required: true,
              schema: { enum: ["engineering", "hobby"] },
            },
          ],
          responses: {
            "200": {
              content: {
                "application/json": {
                  schema: {
                    properties: {
                      data: {
                        items: {
                          required: [
                            "id",
                            "section",
                            "name",
                            "summary",
                            "technologies",
                            "repositoryUrl",
                            "demoUrl",
                            "imageUrl",
                            "displayOrder",
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
            "400": { description: "Missing or invalid section" },
          },
        },
      },
    },
  });
});

test("OpenAPI describes nullable profile data and section-grouped links", async () => {
  const response = await app.request("/docs/json");
  const document: unknown = await response.json();

  expect(response.status).toBe(200);
  expect(document).toMatchObject({
    paths: {
      "/api/public/profile": {
        get: {
          operationId: "getPublicProfile",
          responses: {
            "200": {
              content: {
                "application/json": {
                  schema: {
                    properties: {
                      data: {
                        required: ["profile", "skills", "links"],
                        properties: {
                          profile: { anyOf: [{ type: "null" }, { type: "object" }] },
                          skills: { type: "array" },
                          links: { required: ["engineering", "hobby"] },
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

test("OpenAPI describes public API error envelopes", async () => {
  const response = await app.request("/docs/json");
  const document: unknown = await response.json();
  const serverError = {
    content: {
      "application/json": {
        schema: { properties: { error: { properties: { code: { const: "INTERNAL_ERROR" } } } } },
      },
    },
  };
  const forbidden = {
    content: {
      "application/json": {
        schema: { properties: { error: { properties: { code: { const: "FORBIDDEN" } } } } },
      },
    },
  };
  expect(document).toMatchObject({
    paths: {
      "/api/public/favourites": { get: { responses: { "403": forbidden, "500": serverError } } },
      "/api/public/profile": { get: { responses: { "403": forbidden, "500": serverError } } },
      "/api/public/portfolio": {
        get: {
          responses: {
            "400": {
              content: {
                "application/json": {
                  schema: {
                    properties: { error: { properties: { code: { const: "CLIENT_ERROR" } } } },
                  },
                },
              },
            },
            "403": forbidden,
            "500": serverError,
          },
        },
      },
    },
  });
});

test("OpenAPI describes administrator authentication and bearer boundaries", async () => {
  const response = await app.request("/docs/json");
  const document: unknown = await response.json();
  expect(response.status).toBe(200);
  expect(document).toMatchObject({
    components: { securitySchemes: { adminBearer: { type: "http", scheme: "bearer" } } },
    paths: {
      "/api/admin/auth/login": {
        post: {
          operationId: "loginAdmin",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { required: ["email", "password"] } } },
          },
          responses: { "200": {}, "400": {}, "401": {}, "413": {}, "429": {} },
        },
      },
      "/api/admin/auth/refresh": {
        post: {
          operationId: "refreshAdminSession",
          security: [{ adminBearer: [] }],
          responses: { "200": {}, "401": {} },
        },
      },
      "/api/admin/auth/me": {
        get: {
          operationId: "getAdminSession",
          security: [{ adminBearer: [] }],
          responses: { "200": {}, "401": {} },
        },
      },
      "/api/admin/auth/logout": {
        post: {
          operationId: "logoutAdmin",
          security: [{ adminBearer: [] }],
          responses: { "204": {}, "401": {} },
        },
      },
    },
  });
});

test("OpenAPI documents cookie-backed browser authentication without exposing refresh tokens", async () => {
  const response = await app.request("/docs/json");
  const document: unknown = await response.json();
  const accessResponse = { content: { "application/json": { schema: { required: ["data"], properties: { data: { required: ["accessToken"], properties: { accessToken: { type: "string" } }, additionalProperties: false } } } } } };
  expect(document).toMatchObject({
    components: { securitySchemes: { adminRefreshCookie: { type: "apiKey", in: "cookie", name: "__Host-admin_refresh" } } },
    paths: {
      "/api/admin/auth/browser/login": { post: { operationId: "loginAdminBrowser", responses: { "200": accessResponse, "401": {}, "403": {} } } },
      "/api/admin/auth/browser/refresh": { post: { operationId: "refreshAdminBrowser", security: [{ adminRefreshCookie: [] }], responses: { "200": accessResponse, "401": {}, "403": {} } } },
      "/api/admin/auth/browser/logout": { post: { operationId: "logoutAdminBrowser", security: [{ adminRefreshCookie: [] }], responses: { "204": {}, "401": {}, "403": {} } } },
    },
  });
});
