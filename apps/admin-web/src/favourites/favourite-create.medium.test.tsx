import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { createAdminRouter } from "../app/router/router";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

test("creating a favourite sends authenticated data and returns to the list", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const confirmation = vi.spyOn(window, "confirm");
  server.use(
    http.post("https://api.example.test/api/admin/favourites", async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      expect(await request.json()).toEqual({
        name: "Tea",
        description: "Green tea",
        link: "https://example.com",
        displayOrder: 1,
      });
      return HttpResponse.json({ data: { id: "1" } }, { status: 201 });
    }),
    http.get("https://api.example.test/api/admin/favourites", () =>
      HttpResponse.json({ data: [{ id: "1", name: "Tea", description: "Green tea" }] }),
    ),
  );
  const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/hobby/new"] }), {
    accessToken: () => "access",
    restore: () => Promise.resolve(false),
    login: () => Promise.resolve(false),
    logout: () => Promise.resolve(),
  });
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("名前"), "Tea");
  await user.type(screen.getByLabelText("説明"), "Green tea");
  await user.type(screen.getByLabelText("URL"), "https://example.com");
  await user.type(screen.getByLabelText("表示順"), "1");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(await screen.findByText("Tea")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/hobby");
  expect(confirmation).not.toHaveBeenCalled();
});

test("unsaved favourite input blocks navigation when the administrator cancels", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/hobby/new"] }), {
    accessToken: () => "access",
    restore: () => Promise.resolve(false),
    login: () => Promise.resolve(false),
    logout: () => Promise.resolve(),
  });
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("名前"), "Tea");
  await user.click(screen.getByRole("link", { name: "Dashboard" }));
  expect(window.confirm).toHaveBeenCalledOnce();
  expect(router.state.location.pathname).toBe("/hobby/new");
  expect(screen.getByLabelText("名前")).toHaveValue("Tea");
});
