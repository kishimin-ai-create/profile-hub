import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { createAdminRouter } from "./router";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

const link = { id: "1", section: "engineering", kind: "website", url: "https://example.com", displayOrder: 0 };
const start = () => {
  const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/profile/links/1/edit"] }), {
    accessToken: () => "access",
    restore: () => Promise.resolve(false),
    login: () => Promise.resolve(false),
    logout: () => Promise.resolve(),
  });
  render(<RouterProvider router={router} />);
  return router;
};

test("edits a social link through the authenticated API", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/social-links", () => HttpResponse.json({ data: [link] })),
    http.get("https://api.example.test/api/admin/skills", () => HttpResponse.json({ data: [] })),
    http.get("https://api.example.test/api/admin/profile", () => HttpResponse.json({ data: null })),
    http.put("https://api.example.test/api/admin/social-links/1", async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      expect(await request.json()).toEqual({ section: "engineering", kind: "website", url: "https://new.example.com", displayOrder: 0 });
      return HttpResponse.json({ data: { id: "1" } });
    }),
  );
  const router = start();
  const user = userEvent.setup();
  const url = await screen.findByLabelText("URL");
  expect(url).toHaveValue(link.url);
  await user.clear(url);
  await user.type(url, "https://new.example.com");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(await screen.findByRole("heading", { name: "リンク" })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/profile");
});

test("reports a missing social link", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(http.get("https://api.example.test/api/admin/social-links", () => HttpResponse.json({ data: [] })));
  start();
  expect(await screen.findByRole("alert")).toHaveTextContent("リンクを取得できませんでした");
});

test("keeps unsaved link changes when navigation is cancelled", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(false);
  server.use(http.get("https://api.example.test/api/admin/social-links", () => HttpResponse.json({ data: [link] })));
  start();
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("URL"), "/changed");
  await user.click(screen.getByRole("link", { name: "Dashboard" }));
  expect(screen.getByLabelText("URL")).toHaveValue("https://example.com/changed");
});
