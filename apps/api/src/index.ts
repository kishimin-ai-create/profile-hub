import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDatabase } from "./infrastructures/db/database";
import { listFavourites } from "./public/favourites";

type Dependencies = { listFavourites: () => ReturnType<typeof listFavourites> };

/** Builds the API around its resource dependencies. */
export const createApp = (dependencies: Dependencies) => {
  const app = new Hono();

  app.get("/health", (context) => context.json({ status: "ok" }));
  app.get("/api/public/favourites", async (context) =>
    context.json({ data: await dependencies.listFavourites() }),
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

const app = createApp({ listFavourites: () => listFavourites(getDatabase()) });

export default app;
