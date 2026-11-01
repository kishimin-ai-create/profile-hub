import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { HomeProfile } from "./HomeProfile";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const showProfile = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <HomeProfile />
    </QueryClientProvider>,
  );

test("shows the public profile summary", async () => {
  server.use(http.get("*/api/public/profile", () => HttpResponse.json({ data: { profile: { id: "1", name: "Example", title: "Engineer", bio: "Hello", avatarUrl: null }, skills: [], links: {} } })));
  showProfile();
  expect(await screen.findByText("Example")).toBeInTheDocument();
  expect(screen.getByText("Engineer")).toBeInTheDocument();
  expect(screen.getByText("Hello")).toBeInTheDocument();
});

test("handles a missing profile", async () => {
  server.use(http.get("*/api/public/profile", () => HttpResponse.json({ data: { profile: null, skills: [], links: {} } })));
  showProfile();
  expect(await screen.findByText("プロフィールはまだありません。" )).toBeInTheDocument();
});

test("reports an API error", async () => {
  server.use(http.get("*/api/public/profile", () => new HttpResponse(null, { status: 500 })));
  showProfile();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
});
