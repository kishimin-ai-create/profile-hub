import { createMiddleware } from "hono/factory";

import { authenticateSession } from "../auth/session";
import type { SessionClaims } from "../auth/token";

export type AdminEnvironment = { Variables: { adminSession: SessionClaims } };

/** Requires a current administrator access token. */
export function adminGuard(secret: string, findVersion: (id: string) => Promise<number | null>) {
  return createMiddleware<AdminEnvironment>(async (context, next) => {
    const authorization = context.req.header("Authorization");
    const match = authorization?.match(/^Bearer ([^\s]+)$/i);
    const session = match && (await authenticateSession(match[1], "access", secret, findVersion));
    if (!session) {
      return context.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        401,
      );
    }
    context.set("adminSession", session);
    await next();
  });
}
