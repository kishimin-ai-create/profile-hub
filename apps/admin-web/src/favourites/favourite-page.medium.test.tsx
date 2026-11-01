import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { FavouritePage } from "./favourite-page";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
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

test("deletes a favourite only after confirmation", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  server.use(
    http.get("https://api.example.test/api/admin/favourites", () =>
      HttpResponse.json({ data: [{ id: "1", name: "Tea", description: "Green tea" }] }),
    ),
    http.delete("https://api.example.test/api/admin/favourites/1", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return new HttpResponse(null, { status: 204 });
    }),
  );
  render(<FavouritePage session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "Tea を削除" }));
  expect(await screen.findByText("お気に入りがありません")).toBeInTheDocument();
});

test("keeps a favourite when deletion fails", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  server.use(
    http.get("https://api.example.test/api/admin/favourites", () =>
      HttpResponse.json({ data: [{ id: "1", name: "Tea", description: "Green tea" }] }),
    ),
    http.delete(
      "https://api.example.test/api/admin/favourites/1",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  render(<FavouritePage session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "Tea を削除" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("お気に入りを削除できませんでした");
  expect(screen.getByText("Tea")).toBeInTheDocument();
});

test("does not delete a favourite when confirmation is cancelled", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const remove = vi.fn<() => void>();
  server.use(
    http.get("https://api.example.test/api/admin/favourites", () =>
      HttpResponse.json({ data: [{ id: "1", name: "Tea", description: "Green tea" }] }),
    ),
    http.delete("https://api.example.test/api/admin/favourites/1", () => {
      remove();
      return new HttpResponse(null, { status: 204 });
    }),
  );
  render(<FavouritePage session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "Tea を削除" }));
  expect(remove).not.toHaveBeenCalled();
  expect(screen.getByText("Tea")).toBeInTheDocument();
});

test("reorders all favourites through the authenticated API", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/favourites", () =>
      HttpResponse.json({
        data: [
          { id: "1", name: "Tea", description: "Green" },
          { id: "2", name: "Coffee", description: "Black" },
        ],
      }),
    ),
    http.patch("https://api.example.test/api/admin/favourites/order", async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      expect(await request.json()).toEqual({ ids: ["2", "1"] });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  render(<FavouritePage session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "Coffee を上へ" }));
  await waitFor(() => {
    const items = within(screen.getByRole("list", { name: "お気に入り一覧" })).getAllByRole(
      "listitem",
    );
    expect(items[0]).toHaveTextContent("Coffee");
    expect(items[1]).toHaveTextContent("Tea");
  });
});

test("keeps the displayed order if reordering fails", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/favourites", () =>
      HttpResponse.json({
        data: [
          { id: "1", name: "Tea", description: "Green" },
          { id: "2", name: "Coffee", description: "Black" },
        ],
      }),
    ),
    http.patch(
      "https://api.example.test/api/admin/favourites/order",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  render(<FavouritePage session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "Coffee を上へ" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "お気に入りの順序を変更できませんでした",
  );
  const items = within(screen.getByRole("list", { name: "お気に入り一覧" })).getAllByRole(
    "listitem",
  );
  expect(items[0]).toHaveTextContent("Tea");
});
