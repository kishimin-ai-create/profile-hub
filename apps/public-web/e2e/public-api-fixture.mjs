import { createApp } from "../../api/src/index.ts";

const app = createApp({
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
        : [],
    ),
  getPublicProfile: () =>
    Promise.resolve({
      profile: { id: "1", name: "Example", title: "Developer", bio: "Hello", avatarUrl: null },
      skills: [],
      links: {
        engineering: [],
        hobby: [{ id: "1", kind: "x", url: "https://x.com/example", displayOrder: 0 }],
      },
    }),
  logRequest: () => {},
});

Bun.serve({ hostname: "localhost", port: 43123, fetch: app.fetch });
