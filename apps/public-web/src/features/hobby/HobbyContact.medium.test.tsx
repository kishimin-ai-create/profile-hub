import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { HobbyContact } from "./HobbyContact";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const show = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <HobbyContact />
    </QueryClientProvider>,
  );

test("shows only the configured hobby X link", async () => {
  server.use(
    http.get("*/api/public/profile", () =>
      HttpResponse.json({
        data: {
          links: {
            engineering: [{ kind: "x", url: "https://engineering.example" }],
            hobby: [
              { kind: "github", url: "https://other.example" },
              { kind: "x", url: "https://x.com/example" },
            ],
          },
        },
      }),
    ),
  );
  show();
  const link = await screen.findByRole("link", { name: "X" });
  expect(link).toHaveAttribute("href", "https://x.com/example");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getAllByRole("link")).toHaveLength(1);
});

test("shows an empty state when X is not configured", async () => {
  server.use(
    http.get("*/api/public/profile", () =>
      HttpResponse.json({ data: { links: { engineering: [], hobby: [] } } }),
    ),
  );
  show();
  expect(await screen.findByText("連絡先はまだありません。")).toBeInTheDocument();
});

test("rejects a dangerous URL returned by the API", async () => {
  server.use(
    http.get("*/api/public/profile", () =>
      HttpResponse.json({
        data: { links: { engineering: [], hobby: [{ kind: "x", url: "javascript:alert(1)" }] } },
      }),
    ),
  );
  show();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "X" })).not.toBeInTheDocument();
});
