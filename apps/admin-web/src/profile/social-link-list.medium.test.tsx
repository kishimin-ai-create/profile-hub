import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { SocialLinkList } from "./social-link-list";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

test("shows each link with its section from the authenticated API", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/social-links", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return HttpResponse.json({
        data: [
          {
            id: "1",
            section: "engineering",
            kind: "website",
            url: "https://example.com",
            displayOrder: 0,
          },
          {
            id: "2",
            section: "hobby",
            kind: "email",
            url: "mailto:test@example.com",
            displayOrder: 0,
          },
        ],
      });
    }),
  );
  render(<SocialLinkList session={{ accessToken: () => "access" }} />);
  const items = await screen.findAllByRole("listitem");
  expect(within(items[0]).getByText("Engineering")).toBeInTheDocument();
  expect(within(items[1]).getByText("Hobby")).toBeInTheDocument();
});

test("reports link loading errors", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get(
      "https://api.example.test/api/admin/social-links",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  render(<SocialLinkList session={{ accessToken: () => "access" }} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("リンクを取得できませんでした");
});

test("shows an empty link list", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/social-links", () =>
      HttpResponse.json({ data: [] }),
    ),
  );
  render(<SocialLinkList session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("リンクがありません")).toBeInTheDocument();
});
