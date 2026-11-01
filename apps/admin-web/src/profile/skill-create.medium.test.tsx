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

test("creates a skill through the authenticated API and returns to profile", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/social-links", () =>
      HttpResponse.json({ data: [] }),
    ),
    http.post("https://api.example.test/api/admin/skills", async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      expect(await request.json()).toEqual({ name: "TypeScript", displayOrder: 0 });
      return HttpResponse.json({ data: { id: "1" } }, { status: 201 });
    }),
    http.get("https://api.example.test/api/admin/skills", () =>
      HttpResponse.json({ data: [{ id: "1", name: "TypeScript", displayOrder: 0 }] }),
    ),
    http.get("https://api.example.test/api/admin/profile", () => HttpResponse.json({ data: null })),
  );
  const router = createAdminRouter(
    createMemoryHistory({ initialEntries: ["/profile/skills/new"] }),
    {
      accessToken: () => "access",
      restore: () => Promise.resolve(false),
      login: () => Promise.resolve(false),
      logout: () => Promise.resolve(),
    },
  );
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("スキル名"), "TypeScript");
  await user.type(screen.getByLabelText("表示順"), "0");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(await screen.findByText("TypeScript")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/profile");
});

test("keeps unsaved skill input when navigation is cancelled", async () => {
  const confirmation = vi.spyOn(window, "confirm").mockReturnValue(false);
  const router = createAdminRouter(
    createMemoryHistory({ initialEntries: ["/profile/skills/new"] }),
    {
      accessToken: () => "access",
      restore: () => Promise.resolve(false),
      login: () => Promise.resolve(false),
      logout: () => Promise.resolve(),
    },
  );
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("スキル名"), "TypeScript");
  await user.click(screen.getByRole("link", { name: "Dashboard" }));
  expect(confirmation).toHaveBeenCalledOnce();
  expect(screen.getByLabelText("スキル名")).toHaveValue("TypeScript");
});

test("keeps input when a skill cannot be saved", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.post(
      "https://api.example.test/api/admin/skills",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  const router = createAdminRouter(
    createMemoryHistory({ initialEntries: ["/profile/skills/new"] }),
    {
      accessToken: () => "access",
      restore: () => Promise.resolve(false),
      login: () => Promise.resolve(false),
      logout: () => Promise.resolve(),
    },
  );
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("スキル名"), "TypeScript");
  await user.type(screen.getByLabelText("表示順"), "0");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("スキルを保存できませんでした");
  expect(screen.getByLabelText("スキル名")).toHaveValue("TypeScript");
});
