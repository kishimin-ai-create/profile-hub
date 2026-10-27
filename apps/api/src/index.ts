import { Hono } from "hono";

const app = new Hono();

app.get("/health", (context) => context.json({ status: "ok" }));
app.notFound((context) =>
  context.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404),
);
app.onError((_error, context) => {
  process.stderr.write(`${JSON.stringify({ level: "error", message: "Unhandled API error" })}\n`);
  return context.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
});

export default app;
