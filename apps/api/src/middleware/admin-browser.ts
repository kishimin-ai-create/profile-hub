import { createMiddleware } from "hono/factory";

/** Returns only a canonical HTTP(S) origin. */
export function validatedAdminOrigin(adminOrigin: string | undefined): string | undefined {
  try {
    if (adminOrigin) {
      const url = new URL(adminOrigin);
      if ((url.protocol === "https:" || url.protocol === "http:") && url.origin === adminOrigin) {
        return adminOrigin;
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/** Rejects browser session requests outside the configured administrator origin. */
export function requireAdminBrowser(adminOrigin: string | undefined) {
  const validOrigin = validatedAdminOrigin(adminOrigin);
  return createMiddleware(async (context, next) => {
    if (
      !validOrigin ||
      context.req.header("Origin") !== validOrigin ||
      context.req.header("X-Admin-Request") !== "1"
    ) {
      return context.json({ error: { code: "FORBIDDEN", message: "Origin not allowed" } }, 403);
    }
    await next();
  });
}
