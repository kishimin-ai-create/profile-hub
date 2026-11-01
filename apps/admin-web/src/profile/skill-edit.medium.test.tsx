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

test("edits an existing skill and returns to profile", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const state = { name: "TypeScript" };
  server.use(
    http.get("https://api.example.test/api/admin/skills", () =>
      HttpResponse.json({ data: [{ id: "1", name: state.name, displayOrder: 0 }] }),
    ),
    http.get("https://api.example.test/api/admin/profile", () => HttpResponse.json({ data: null })),
    http.put("https://api.example.test/api/admin/skills/1", async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      expect(await request.json()).toEqual({ name: "Bun", displayOrder: 0 });
      state.name = "Bun";
      return HttpResponse.json({ data: { id: "1" } });
    }),
  );
  const router = createAdminRouter(
    createMemoryHistory({ initialEntries: ["/profile/skills/1/edit"] }),
    {
      accessToken: () => "access",
      restore: () => Promise.resolve(false),
      login: () => Promise.resolve(false),
      logout: () => Promise.resolve(),
    },
  );
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  const name = await screen.findByLabelText("スキル名");
  expect(name).toHaveValue("TypeScript");
  await user.clear(name);
  await user.type(name, "Bun");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(await screen.findByText("Bun")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/profile");
});

test("reports a missing skill instead of opening an empty form", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/skills", () => HttpResponse.json({ data: [] })),
  );
  const router = createAdminRouter(
    createMemoryHistory({ initialEntries: ["/profile/skills/1/edit"] }),
    {
      accessToken: () => "access",
      restore: () => Promise.resolve(false),
      login: () => Promise.resolve(false),
      logout: () => Promise.resolve(),
    },
  );
  render(<RouterProvider router={router} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("スキルを取得できませんでした");
});
