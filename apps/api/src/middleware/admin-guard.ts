import { createMiddleware } from "hono/factory";

import { authenticateSession } from "../auth/session";

/** Requires a current administrator access token. */
export function adminGuard(secret: string, findVersion: (id: string) => Promise<number | null>) {
  return createMiddleware(async (context, next) => {
    const authorization = context.req.header("Authorization");
    const match = authorization?.match(/^Bearer ([^\s]+)$/i);
    const session = match && (await authenticateSession(match[1], "access", secret, findVersion));
    if (!session) {
      return context.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        401,
      );
    }
    await next();
  });
}
