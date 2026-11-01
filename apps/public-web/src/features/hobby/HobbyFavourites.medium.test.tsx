import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { HobbyFavourites } from "./HobbyFavourites";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const show = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <HobbyFavourites />
    </QueryClientProvider>,
  );

test("shows favourites in API order with safe links", async () => {
  server.use(
    http.get("*/api/public/favourites", () =>
      HttpResponse.json({
        data: [
          {
            id: "1",
            name: "Music",
            description: "Listening",
            link: "https://example.com/music",
            displayOrder: 0,
          },
          {
            id: "2",
            name: "Craft",
            description: "Building",
            link: "https://example.com/craft",
            displayOrder: 1,
          },
        ],
      }),
    ),
  );
  show();
  const items = await screen.findAllByRole("listitem");
  expect(within(items[0]).getByRole("link", { name: "Music" })).toHaveAttribute(
    "href",
    "https://example.com/music",
  );
  expect(items[1]).toHaveTextContent("Craft");
  expect(within(items[0]).getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
});

test("shows a separate empty state", async () => {
  server.use(http.get("*/api/public/favourites", () => HttpResponse.json({ data: [] })));
  show();
  expect(await screen.findByText("お気に入りはまだありません。")).toBeInTheDocument();
});

test("rejects unsafe links", async () => {
  server.use(
    http.get("*/api/public/favourites", () =>
      HttpResponse.json({
        data: [
          {
            id: "1",
            name: "Unsafe",
            description: "",
            link: "javascript:alert(1)",
            displayOrder: 0,
          },
        ],
      }),
    ),
  );
  show();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
});
