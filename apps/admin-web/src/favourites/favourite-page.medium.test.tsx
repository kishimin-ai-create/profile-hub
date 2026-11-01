import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { FavouritePage } from "./favourite-page";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

test("shows favourites returned to an authenticated administrator", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/favourites", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return HttpResponse.json({
        data: [
          {
            id: "1",
            name: "Tea",
            description: "Green tea",
            link: "https://example.com",
            displayOrder: 1,
          },
        ],
      });
    }),
  );
  render(<FavouritePage session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("Tea")).toBeInTheDocument();
  expect(screen.getByText("Green tea")).toBeInTheDocument();
});

test("shows an error when favourite loading fails", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get(
      "https://api.example.test/api/admin/favourites",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  render(<FavouritePage session={{ accessToken: () => "access" }} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("お気に入りを取得できませんでした");
});

test("shows an empty state when there are no favourites", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/favourites", () =>
      HttpResponse.json({ data: [] }),
    ),
  );
  render(<FavouritePage session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("お気に入りがありません")).toBeInTheDocument();
});

test("rejects a malformed favourite response", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/favourites", () =>
      HttpResponse.json({ data: [{ name: "Tea" }] }),
    ),
  );
  render(<FavouritePage session={{ accessToken: () => "access" }} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("お気に入りを取得できませんでした");
});
