import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDatabase } from "./infrastructures/db/database";
import { listFavourites } from "./public/favourites";
import { listPortfolios, type PortfolioSection } from "./public/portfolios";
import { getPublicProfile } from "./public/profile";

type Dependencies = {
  listFavourites: () => ReturnType<typeof listFavourites>;
  listPortfolios: (section: PortfolioSection) => ReturnType<typeof listPortfolios>;
  getPublicProfile: () => ReturnType<typeof getPublicProfile>;
};

/** Builds the API around its resource dependencies. */
export const createApp = (dependencies: Dependencies) => {
  const app = new Hono();

  app.get("/health", (context) => context.json({ status: "ok" }));
  app.get("/api/public/favourites", async (context) =>
    context.json({ data: await dependencies.listFavourites() }),
  );
  app.get("/api/public/profile", async (context) =>
    context.json({ data: await dependencies.getPublicProfile() }),
  );
  app.get("/api/public/portfolio", async (context) => {
    const section = context.req.query("section");
    if (section !== "engineering" && section !== "hobby") {
      return context.json({ error: { code: "CLIENT_ERROR", message: "Invalid request" } }, 400);
    }
    return context.json({ data: await dependencies.listPortfolios(section) });
  });
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
  listFavourites: () => listFavourites(getDatabase()),
  listPortfolios: (section) => listPortfolios(getDatabase(), section),
  getPublicProfile: () => getPublicProfile(getDatabase()),
});

export default app;
