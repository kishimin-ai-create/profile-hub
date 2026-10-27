import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

app.get("/health", (context) => context.json({ status: "ok" }));
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
  return context.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
});

export default app;
