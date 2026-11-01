import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { ProfilePage } from "./profile-page";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

test("shows the current profile to an authenticated administrator", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/profile", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return HttpResponse.json({
        data: { id: "1", name: "Example", title: "Developer", bio: "Hello", avatarUrl: null },
      });
    }),
  );
  render(<ProfilePage session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("Example")).toBeInTheDocument();
  expect(screen.getByText("Developer")).toBeInTheDocument();
});

test("shows an empty state when no profile exists", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/profile", () => HttpResponse.json({ data: null })),
  );
  render(<ProfilePage session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("プロフィールがありません")).toBeInTheDocument();
});

test("shows an error when the profile cannot be loaded", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get(
      "https://api.example.test/api/admin/profile",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  render(<ProfilePage session={{ accessToken: () => "access" }} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("プロフィールを取得できませんでした");
});
