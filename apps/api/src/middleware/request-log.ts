import type { MiddlewareHandler } from "hono";

export type RequestLog = { method: string; status: number; durationMs: number };

/** Records minimal request metadata without retaining URLs or headers. */
export function requestLogger(write: (event: RequestLog) => void): MiddlewareHandler {
  return async (context, next) => {
    const started = performance.now();
    await next();
    const knownMethods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
    write({
      method: knownMethods.includes(context.req.method) ? context.req.method : "OTHER",
      status: context.res.status,
      durationMs: Math.max(0, Math.round(performance.now() - started)),
    });
  };
}
