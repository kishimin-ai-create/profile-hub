import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { DashboardCounts } from "./dashboard-counts";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

test("announces while dashboard counts are loading", () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(http.get("https://api.example.test/api/admin/portfolio", () => new Promise(() => {})));
  render(<DashboardCounts session={{ accessToken: () => "access" }} />);
  expect(screen.getByRole("status")).toHaveTextContent("読み込み中");
});

test("shows portfolio and favourite counts from authenticated responses", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/portfolio", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return HttpResponse.json({ data: [{ id: "1" }, { id: "2" }] });
    }),
    http.get("https://api.example.test/api/admin/favourites", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return HttpResponse.json({ data: [{ id: "1" }] });
    }),
  );
  render(<DashboardCounts session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("2件")).toBeInTheDocument();
  expect(screen.getByText("1件")).toBeInTheDocument();
});

test("retries a failed count request and displays empty counts", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const calls = { count: 0 };
  let releaseRetry = () => {};
  const retry = new Promise<void>((resolve) => {
    releaseRetry = resolve;
  });
  server.use(
    http.get("https://api.example.test/api/admin/portfolio", async () => {
      calls.count += 1;
      if (calls.count === 1) return new HttpResponse(null, { status: 500 });
      await retry;
      return HttpResponse.json({ data: [] });
    }),
    http.get("https://api.example.test/api/admin/favourites", () =>
      HttpResponse.json({ data: [] }),
    ),
  );
  render(<DashboardCounts session={{ accessToken: () => "access" }} />);
  const status = screen.getByRole("status");
  expect(await screen.findByRole("alert")).toHaveTextContent("登録件数を取得できませんでした");
  expect(status).toBeInTheDocument();
  expect(status).toBeEmptyDOMElement();
  await userEvent.click(screen.getByRole("button", { name: "再試行" }));
  expect(status).toHaveTextContent("読み込み中");
  releaseRetry();
  expect(await screen.findAllByText("0件")).toHaveLength(2);
  expect(status).toBeEmptyDOMElement();
});
