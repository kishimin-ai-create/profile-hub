import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { describeRoute, openAPIRouteHandler } from "hono-openapi";
import type { OpenAPIV3_1 as OpenApi } from "openapi-types";

import { getDatabase } from "./infrastructures/db/database";
import { findSessionVersion } from "./infrastructures/db/session-version";
import { type AdminEnvironment, adminGuard } from "./middleware/admin-guard";
import { type RequestLog, requestLogger } from "./middleware/request-log";
import { listFavourites } from "./public/favourites";
import { listPortfolios, type PortfolioSection } from "./public/portfolios";
import { getPublicProfile } from "./public/profile";

type Dependencies = {
  adminSecret?: string;
  findAdminSessionVersion?: (id: string) => Promise<number | null>;
  listFavourites: () => ReturnType<typeof listFavourites>;
  listPortfolios: (section: PortfolioSection) => ReturnType<typeof listPortfolios>;
  getPublicProfile: () => ReturnType<typeof getPublicProfile>;
  allowedOrigins?: readonly string[];
  logRequest?: (event: RequestLog) => void;
};

const linkSchema: OpenApi.SchemaObject = {
  type: "object",
  required: ["id", "kind", "url", "displayOrder"],
  properties: {
    id: { type: "string" },
    kind: { type: "string" },
    url: { type: "string" },
    displayOrder: { type: "integer" },
  },
};

const errorResponse = (
  description: string,
  code: string,
  message: string,
): OpenApi.ResponseObject => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", const: code },
              message: { type: "string", const: message },
            },
          },
        },
      },
    },
  },
});
const forbiddenResponse = errorResponse(
  "Origin not allowed",
  "FORBIDDEN",
  "Origin or method not allowed",
);
const serverErrorResponse = errorResponse(
  "Unexpected server error",
  "INTERNAL_ERROR",
  "Internal server error",
);
const clientErrorResponse = errorResponse(
  "Missing or invalid section",
  "CLIENT_ERROR",
  "Invalid request",
);

/** Builds the API around its resource dependencies. */
export const createApp = (dependencies: Dependencies) => {
  const app = new Hono<AdminEnvironment>();

  app.use(
    "*",
    requestLogger(
      dependencies.logRequest ?? ((event) => process.stdout.write(`${JSON.stringify(event)}\n`)),
    ),
  );

  app.use(
    "*",
    secureHeaders({
      strictTransportSecurity: false,
      crossOriginResourcePolicy: "cross-origin",
      xFrameOptions: false,
      contentSecurityPolicy: {
        defaultSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'none'"],
        frameAncestors: ["'none'"],
      },
    }),
  );

  app.use("*", async (context, next) => {
    context.header("Vary", "Origin", { append: true });
    const origin = context.req.header("Origin");
    if (!origin) {
      return next();
    }
    const requestedMethod = context.req.header("Access-Control-Request-Method");
    const isPreflight = context.req.method === "OPTIONS" && requestedMethod !== undefined;
    const allowedMethods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"];
    if (isPreflight) {
      context.header("Vary", "Access-Control-Request-Method", { append: true });
    }
    if (
      !dependencies.allowedOrigins?.includes(origin) ||
      (isPreflight && !allowedMethods.includes(requestedMethod))
    ) {
      return context.json(
        { error: { code: "FORBIDDEN", message: "Origin or method not allowed" } },
        403,
      );
    }
    context.header("Access-Control-Allow-Origin", origin);
    if (isPreflight) {
      context.header("Access-Control-Allow-Methods", allowedMethods.join(", "));
      context.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
      return context.body(null, 204);
    }
    return next();
  });

  app.use(
    "/api/admin/*",
    adminGuard(
      dependencies.adminSecret ?? "",
      dependencies.findAdminSessionVersion ?? (() => Promise.resolve(null)),
    ),
  );
  app.get("/api/admin/auth/me", (context) => {
    context.header("Cache-Control", "no-store");
    return context.json({ data: { id: context.get("adminSession").sub } });
  });
  app.get("/health", (context) => context.json({ status: "ok" }));
  app.get(
    "/api/public/favourites",
    describeRoute({
      operationId: "listFavourites",
      tags: ["Public"],
      responses: {
        403: forbiddenResponse,
        500: serverErrorResponse,
        200: {
          description: "Favourites in display order",
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
    }),
    async (context) => context.json({ data: await dependencies.listFavourites() }),
  );
  app.get(
    "/api/public/profile",
    describeRoute({
      operationId: "getPublicProfile",
      tags: ["Public"],
      responses: {
        403: forbiddenResponse,
        500: serverErrorResponse,
        200: {
          description: "Profile, ordered skills, and section-specific links",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data"],
                properties: {
                  data: {
                    type: "object",
                    required: ["profile", "skills", "links"],
                    properties: {
                      profile: {
                        anyOf: [
                          { type: "null" },
                          {
                            type: "object",
                            required: ["id", "name", "title", "bio", "avatarUrl"],
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              title: { type: ["string", "null"] },
                              bio: { type: ["string", "null"] },
                              avatarUrl: { type: ["string", "null"] },
                            },
                          },
                        ],
                      },
                      skills: {
                        type: "array",
                        items: {
                          type: "object",
                          required: ["id", "name", "displayOrder"],
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            displayOrder: { type: "integer" },
                          },
                        },
                      },
                      links: {
                        type: "object",
                        required: ["engineering", "hobby"],
                        properties: {
                          engineering: { type: "array", items: linkSchema },
                          hobby: { type: "array", items: linkSchema },
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
    }),
    async (context) => context.json({ data: await dependencies.getPublicProfile() }),
  );
  app.get(
    "/api/public/portfolio",
    describeRoute({
      operationId: "listPortfolios",
      tags: ["Public"],
      parameters: [
        {
          name: "section",
          in: "query",
          required: true,
          schema: { type: "string", enum: ["engineering", "hobby"] },
        },
      ],
      responses: {
        200: {
          description: "Portfolios in display order for the requested section",
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
                      properties: {
                        id: { type: "string" },
                        section: { type: "string", enum: ["engineering", "hobby"] },
                        name: { type: "string" },
                        summary: { type: "string" },
                        technologies: { type: "array", items: { type: "string" } },
                        repositoryUrl: { type: ["string", "null"] },
                        demoUrl: { type: ["string", "null"] },
                        imageUrl: { type: ["string", "null"] },
                        displayOrder: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: clientErrorResponse,
        403: forbiddenResponse,
        500: serverErrorResponse,
      },
    }),
    async (context) => {
      const section = context.req.query("section");
      if (section !== "engineering" && section !== "hobby") {
        return context.json({ error: { code: "CLIENT_ERROR", message: "Invalid request" } }, 400);
      }
      return context.json({ data: await dependencies.listPortfolios(section) });
    },
  );
  app.get(
    "/docs/json",
    openAPIRouteHandler(app, {
      documentation: { info: { title: "profile-hub API", version: "0.0.0" } },
    }),
  );
  app.notFound((context) =>
    context.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404),
  );
  app.onError((error, context) => {
    if (error instanceof HTTPException && error.status >= 400 && error.status < 500) {
      return context.json(
        { error: { code: "CLIENT_ERROR", message: "Invalid request" } },
        error.status,
      );
    }
    process.stderr.write(`${JSON.stringify({ level: "error", message: "Unhandled API error" })}\n`);
    return context.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      500,
    );
  });

  return app;
};

const app = createApp({
  adminSecret: process.env["JWT_SECRET"],
  findAdminSessionVersion: (id) => findSessionVersion(getDatabase(), id),
  listFavourites: () => listFavourites(getDatabase()),
  listPortfolios: (section) => listPortfolios(getDatabase(), section),
  getPublicProfile: () => getPublicProfile(getDatabase()),
  allowedOrigins: [process.env["PUBLIC_ORIGIN"], process.env["ADMIN_ORIGIN"]].filter(
    (origin): origin is string => Boolean(origin),
  ),
});

export default app;
