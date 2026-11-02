import { createApp, createConfiguredApp } from "../../api/src/index.ts";
import { getDatabase } from "../../api/src/infrastructures/db/database.ts";
import {
  favourites,
  portfolios,
  profiles,
  skills,
  socialLinks,
} from "../../api/src/infrastructures/db/schema.ts";
import { browserTestDatabaseUrl } from "./public-api-db.ts";

const memoryApp = () =>
  createApp({
    allowedOrigins: ["http://localhost:43122"],
    listFavourites: () =>
      Promise.resolve([
        {
          id: "1",
          name: "Music",
          description: "Listening",
          link: "https://example.com/music",
          displayOrder: 0,
        },
      ]),
    listPortfolios: (section) =>
      Promise.resolve(
        section === "hobby"
          ? [
              {
                id: "1",
                section: "hobby",
                name: "Hobby project",
                summary: "Made for fun",
                technologies: ["TypeScript"],
                repositoryUrl: null,
                demoUrl: null,
                imageUrl: null,
                displayOrder: 0,
              },
            ]
          : [
              {
                id: "2",
                section: "engineering",
                name: "Engineering project",
                summary: "Built for work",
                technologies: ["TypeScript"],
                repositoryUrl: null,
                demoUrl: null,
                imageUrl: null,
                displayOrder: 0,
              },
            ],
      ),
    getPublicProfile: () =>
      Promise.resolve({
        profile: { id: "1", name: "Example", title: "Developer", bio: "Hello", avatarUrl: null },
        skills: [],
        links: {
          engineering: [
            { id: "2", kind: "github", url: "https://github.com/example", displayOrder: 0 },
          ],
          hobby: [{ id: "1", kind: "x", url: "https://x.com/example", displayOrder: 0 }],
        },
      }),
    logRequest: () => {},
  });

const databaseUrl = browserTestDatabaseUrl(
  process.env.PUBLIC_E2E_DATABASE_URL,
  process.env.PUBLIC_E2E_REQUIRE_DATABASE === "1",
);
const app =
  databaseUrl === null
    ? memoryApp()
    : await (async () => {
        process.env.DATABASE_URL = databaseUrl;
        process.env.PUBLIC_ORIGIN = "http://localhost:43122";
        const database = getDatabase();
        const existing = await Promise.all([
          database.select().from(profiles).limit(1),
          database.select().from(skills).limit(1),
          database.select().from(favourites).limit(1),
          database.select().from(portfolios).limit(1),
          database.select().from(socialLinks).limit(1),
        ]);
        if (existing.some((rows) => rows.length > 0))
          throw new Error("Public browser test database must be empty");
        await database
          .insert(profiles)
          .values({ name: "Example", title: "Developer", bio: "Hello" });
        await database.insert(favourites).values({
          name: "Music",
          description: "Listening",
          link: "https://example.com/music",
          displayOrder: 0,
        });
        await database.insert(portfolios).values([
          {
            section: "hobby",
            name: "Hobby project",
            summary: "Made for fun",
            technologies: ["TypeScript"],
            displayOrder: 0,
          },
          {
            section: "engineering",
            name: "Engineering project",
            summary: "Built for work",
            technologies: ["TypeScript"],
            displayOrder: 0,
          },
        ]);
        await database.insert(socialLinks).values([
          { section: "hobby", kind: "x", url: "https://x.com/example", displayOrder: 0 },
          {
            section: "engineering",
            kind: "github",
            url: "https://github.com/example",
            displayOrder: 0,
          },
        ]);
        return createConfiguredApp();
      })();

Bun.serve({ hostname: "localhost", port: 43123, fetch: app.fetch });
