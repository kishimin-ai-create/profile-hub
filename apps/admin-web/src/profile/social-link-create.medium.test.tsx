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

test("creates a section link through the authenticated API", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.post("https://api.example.test/api/admin/social-links", async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      expect(await request.json()).toEqual({
        section: "hobby",
        kind: "email",
        url: "mailto:test@example.com",
        displayOrder: 0,
      });
      return HttpResponse.json({ data: { id: "1" } }, { status: 201 });
    }),
    http.get("https://api.example.test/api/admin/social-links", () =>
      HttpResponse.json({
        data: [
          {
            id: "1",
            section: "hobby",
            kind: "email",
            url: "mailto:test@example.com",
            displayOrder: 0,
          },
        ],
      }),
    ),
    http.get("https://api.example.test/api/admin/skills", () => HttpResponse.json({ data: [] })),
    http.get("https://api.example.test/api/admin/profile", () => HttpResponse.json({ data: null })),
  );
  const router = createAdminRouter(
    createMemoryHistory({ initialEntries: ["/profile/links/new"] }),
    {
      accessToken: () => "access",
      restore: () => Promise.resolve(false),
      login: () => Promise.resolve(false),
      logout: () => Promise.resolve(),
    },
  );
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.selectOptions(await screen.findByLabelText("セクション"), "hobby");
  await user.type(screen.getByLabelText("種類"), "email");
  await user.type(screen.getByLabelText("URL"), "mailto:test@example.com");
  await user.type(screen.getByLabelText("表示順"), "0");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(await screen.findByText("mailto:test@example.com")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/profile");
});

test("rejects mailto for non-email links", async () => {
  const router = createAdminRouter(
    createMemoryHistory({ initialEntries: ["/profile/links/new"] }),
    {
      accessToken: () => "access",
      restore: () => Promise.resolve(false),
      login: () => Promise.resolve(false),
      logout: () => Promise.resolve(),
    },
  );
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.selectOptions(await screen.findByLabelText("セクション"), "hobby");
  await user.type(screen.getByLabelText("種類"), "website");
  await user.type(screen.getByLabelText("URL"), "mailto:test@example.com");
  await user.type(screen.getByLabelText("表示順"), "0");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("URL を確認してください");
});
