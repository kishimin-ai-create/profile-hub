import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { SocialLinkList } from "./social-link-list";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
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

const link = {
  id: "1",
  section: "engineering",
  kind: "website",
  url: "https://example.com",
  displayOrder: 0,
};

test.each([
  { confirmation: true, status: 204, expected: "リンクがありません" },
  { confirmation: true, status: 500, expected: "リンクを削除できませんでした" },
  { confirmation: false, status: 204, expected: "https://example.com" },
])(
  "handles link deletion with confirmation=$confirmation and status=$status",
  async ({ confirmation, status, expected }) => {
    vi.stubEnv("VITE_API_URL", "https://api.example.test");
    vi.spyOn(window, "confirm").mockReturnValue(confirmation);
    const remove = vi.fn<() => void>();
    server.use(
      http.get("https://api.example.test/api/admin/social-links", () =>
        HttpResponse.json({ data: [link] }),
      ),
      http.delete("https://api.example.test/api/admin/social-links/1", ({ request }) => {
        expect(request.headers.get("Authorization")).toBe("Bearer access");
        remove();
        return new HttpResponse(null, { status });
      }),
    );
    render(<SocialLinkList session={{ accessToken: () => "access" }} />);
    await userEvent.click(
      await screen.findByRole("button", { name: "https://example.com を削除" }),
    );
    expect(await screen.findByText(expected)).toBeInTheDocument();
    expect(remove).toHaveBeenCalledTimes(confirmation ? 1 : 0);
    expect(screen.queryByText(link.url) !== null).toBe(status === 500 || !confirmation);
  },
);
