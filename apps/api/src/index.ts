import { Hono } from "hono";

const app = new Hono();

app.get("/health", (context) => context.json({ status: "ok" }));
app.notFound((context) =>
  context.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404),
);

export default app;
