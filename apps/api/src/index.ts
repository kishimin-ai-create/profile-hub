import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { describeRoute, openAPIRouteHandler } from "hono-openapi";
import type { OpenAPIV3_1 as OpenApi } from "openapi-types";
import { z } from "zod";

import { loginAdmin } from "./auth/login";
import { verifyPassword } from "./auth/password";
import { refreshSession } from "./auth/refresh-session";
import { findAdminByEmail } from "./infrastructures/db/admin-account";
import { getDatabase } from "./infrastructures/db/database";
import { consumeLoginAttempt } from "./infrastructures/db/login-throttle";
import { findSessionVersion, revokeSession } from "./infrastructures/db/session-version";
import { requireAdminBrowser, validatedAdminOrigin } from "./middleware/admin-browser";
import { type AdminEnvironment, adminGuard } from "./middleware/admin-guard";
import { type RequestLog, requestLogger } from "./middleware/request-log";
import { listFavourites } from "./public/favourites";
import { listPortfolios, type PortfolioSection } from "./public/portfolios";
import { getPublicProfile } from "./public/profile";

type Dependencies = {
  adminOrigin?: string;
  loginAdmin?: (email: string, password: string) => ReturnType<typeof loginAdmin>;
  adminSecret?: string;
  findAdminSessionVersion?: (id: string) => Promise<number | null>;
  revokeAdminSession?: (id: string, version: number) => Promise<boolean>;
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
const authErrorResponse = errorResponse(
  "Authentication required",
  "UNAUTHORIZED",
  "Authentication required",
);
const tokenResponse: OpenApi.ResponseObject = {
  description: "Replacement administrator tokens",
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "object",
            required: ["accessToken", "refreshToken"],
            properties: {
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
            },
          },
        },
      },
    },
  },
};

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
    const isAdminOrigin = origin === validatedAdminOrigin(dependencies.adminOrigin);
    if (isAdminOrigin) {
      context.header("Access-Control-Allow-Credentials", "true");
    }
    if (isPreflight) {
      context.header("Access-Control-Allow-Methods", allowedMethods.join(", "));
      context.header(
        "Access-Control-Allow-Headers",
        isAdminOrigin
          ? "Authorization, Content-Type, X-Admin-Request"
          : "Authorization, Content-Type",
      );
      return context.body(null, 204);
    }
    return next();
  });

  app.post(
    "/api/admin/auth/browser/refresh",
    requireAdminBrowser(dependencies.adminOrigin),
    async (context) => {
      context.header("Cache-Control", "no-store");
      const token = getCookie(context, "__Host-admin_refresh");
      const { adminSecret, findAdminSessionVersion, revokeAdminSession } = dependencies;
      if (!token || !adminSecret || !findAdminSessionVersion || !revokeAdminSession) {
        return context.json(
          { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
          401,
        );
      }
      const tokens = await refreshSession(
        token,
        adminSecret,
        findAdminSessionVersion,
        revokeAdminSession,
      );
      if (!tokens)
        return context.json(
          { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
          401,
        );
      setCookie(context, "__Host-admin_refresh", tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: 604800,
      });
      return context.json({ data: { accessToken: tokens.accessToken } });
    },
  );

  app.post(
    "/api/admin/auth/browser/login",
    requireAdminBrowser(dependencies.adminOrigin),
    bodyLimit({ maxSize: 4096 }),
    async (context) => {
      context.header("Cache-Control", "no-store");
      let input: unknown;
      try {
        input = await context.req.json();
      } catch {
        return context.json({ error: { code: "CLIENT_ERROR", message: "Invalid request" } }, 400);
      }
      const parsed = z
        .object({ email: z.string().email().max(320), password: z.string().min(1).max(1024) })
        .strict()
        .safeParse(input);
      if (!parsed.success)
        return context.json({ error: { code: "CLIENT_ERROR", message: "Invalid request" } }, 400);
      const result = await dependencies.loginAdmin?.(parsed.data.email, parsed.data.password);
      if (result?.status === "limited") {
        context.header("Retry-After", "60");
        return context.json({ error: { code: "RATE_LIMITED", message: "Too many attempts" } }, 429);
      }
      if (!result || result.status === "invalid")
        return context.json(
          { error: { code: "UNAUTHORIZED", message: "Invalid email or password" } },
          401,
        );
      setCookie(context, "__Host-admin_refresh", result.tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        maxAge: 604800,
      });
      return context.json({ data: { accessToken: result.tokens.accessToken } });
    },
  );

  app.post(
    "/api/admin/auth/login",
    describeRoute({
      operationId: "loginAdmin",
      tags: ["Admin authentication"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              additionalProperties: false,
              properties: {
                email: { type: "string", format: "email", maxLength: 320 },
                password: { type: "string", minLength: 1, maxLength: 1024 },
              },
            },
          },
        },
      },
      responses: {
        200: tokenResponse,
        400: errorResponse("Invalid request", "CLIENT_ERROR", "Invalid request"),
        401: errorResponse("Invalid credentials", "UNAUTHORIZED", "Invalid email or password"),
        403: forbiddenResponse,
        413: { description: "Request body too large" },
        429: errorResponse("Too many attempts", "RATE_LIMITED", "Too many attempts"),
        500: serverErrorResponse,
      },
    }),
    bodyLimit({ maxSize: 4096 }),
    async (context) => {
      context.header("Cache-Control", "no-store");
      let input: unknown;
      try {
        input = await context.req.json();
      } catch {
        return context.json({ error: { code: "CLIENT_ERROR", message: "Invalid request" } }, 400);
      }
      const parsed = z
        .object({ email: z.string().email().max(320), password: z.string().min(1).max(1024) })
        .strict()
        .safeParse(input);
      if (!parsed.success) {
        return context.json({ error: { code: "CLIENT_ERROR", message: "Invalid request" } }, 400);
      }
      if (!dependencies.loginAdmin) {
        return context.json(
          { error: { code: "UNAUTHORIZED", message: "Invalid email or password" } },
          401,
        );
      }
      const result = await dependencies.loginAdmin(parsed.data.email, parsed.data.password);
      if (result.status === "limited") {
        context.header("Retry-After", "60");
        return context.json({ error: { code: "RATE_LIMITED", message: "Too many attempts" } }, 429);
      }
      if (result.status === "invalid") {
        return context.json(
          { error: { code: "UNAUTHORIZED", message: "Invalid email or password" } },
          401,
        );
      }
      return context.json({ data: result.tokens });
    },
  );

  app.post(
    "/api/admin/auth/refresh",
    describeRoute({
      operationId: "refreshAdminSession",
      tags: ["Admin authentication"],
      security: [{ adminBearer: [] }],
      description: "Requires a refresh token.",
      responses: {
        200: tokenResponse,
        401: authErrorResponse,
        403: forbiddenResponse,
        500: serverErrorResponse,
      },
    }),
    async (context) => {
      context.header("Cache-Control", "no-store");
      const match = context.req.header("Authorization")?.match(/^Bearer ([^\s]+)$/i);
      const { adminSecret, findAdminSessionVersion, revokeAdminSession } = dependencies;
      if (!match || !adminSecret || !findAdminSessionVersion || !revokeAdminSession) {
        return context.json(
          { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
          401,
        );
      }
      const tokens = await refreshSession(
        match[1],
        adminSecret,
        findAdminSessionVersion,
        revokeAdminSession,
      );
      if (!tokens) {
        return context.json(
          { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
          401,
        );
      }
      return context.json({ data: tokens });
    },
  );

  app.use(
    "/api/admin/*",
    adminGuard(
      dependencies.adminSecret ?? "",
      dependencies.findAdminSessionVersion ?? (() => Promise.resolve(null)),
    ),
  );
  app.get(
    "/api/admin/auth/me",
    describeRoute({
      operationId: "getAdminSession",
      tags: ["Admin authentication"],
      security: [{ adminBearer: [] }],
      responses: {
        200: {
          description: "Current administrator",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["data"],
                properties: {
                  data: {
                    type: "object",
                    required: ["id"],
                    properties: { id: { type: "string" } },
                  },
                },
              },
            },
          },
        },
        401: authErrorResponse,
        403: forbiddenResponse,
        500: serverErrorResponse,
      },
    }),
    (context) => {
      context.header("Cache-Control", "no-store");
      return context.json({ data: { id: context.get("adminSession").sub } });
    },
  );
  app.post(
    "/api/admin/auth/logout",
    describeRoute({
      operationId: "logoutAdmin",
      tags: ["Admin authentication"],
      security: [{ adminBearer: [] }],
      responses: {
        204: { description: "Session revoked" },
        401: authErrorResponse,
        403: forbiddenResponse,
        500: serverErrorResponse,
      },
    }),
    async (context) => {
      const session = context.get("adminSession");
      const revoked = await dependencies.revokeAdminSession?.(session.sub, session.version);
      context.header("Cache-Control", "no-store");
      if (!revoked) {
        return context.json(
          { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
          401,
        );
      }
      return context.body(null, 204);
    },
  );
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
      documentation: {
        info: { title: "profile-hub API", version: "0.0.0" },
        components: {
          securitySchemes: { adminBearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
        },
      },
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
  adminOrigin: process.env["ADMIN_ORIGIN"],
  loginAdmin: (email, password) =>
    loginAdmin(email, password, {
      consumeAttempt: () => consumeLoginAttempt(getDatabase()),
      findAccount: (value) => findAdminByEmail(getDatabase(), value),
      verifyPassword,
      advanceSession: (id, version) => revokeSession(getDatabase(), id, version),
      dummyHash:
        "$argon2id$v=19$m=65536,t=2,p=1$/Ljqdtjb+NTnEzU6E6d7bPgVNN5FayXFRhPwCWntnfA$2E8icwtAyRdRGo9XygluUTG2zeN1zPQE7VvtK8WDrak",
      secret: process.env["JWT_SECRET"] ?? "",
    }),
  adminSecret: process.env["JWT_SECRET"],
  findAdminSessionVersion: (id) => findSessionVersion(getDatabase(), id),
  revokeAdminSession: (id, version) => revokeSession(getDatabase(), id, version),
  listFavourites: () => listFavourites(getDatabase()),
  listPortfolios: (section) => listPortfolios(getDatabase(), section),
  getPublicProfile: () => getPublicProfile(getDatabase()),
  allowedOrigins: [process.env["PUBLIC_ORIGIN"], process.env["ADMIN_ORIGIN"]].filter(
    (origin): origin is string => Boolean(origin),
  ),
});

export default app;
