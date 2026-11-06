import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { SectionProjects } from "./SectionProjects";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const project = {
  id: "1",
  section: "engineering",
  name: "Work",
  summary: "Summary",
  technologies: ["TypeScript"],
  repositoryUrl: null,
  demoUrl: null,
  imageUrl: null,
};
const show = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SectionProjects section={"engineering"} />
    </QueryClientProvider>,
  );

test("requests and shows engineering projects", async () => {
  server.use(
    http.get("*/api/public/portfolio", ({ request }) => {
      expect(new URL(request.url).searchParams.get("section")).toBe("engineering");
      return HttpResponse.json({ data: [project] });
    }),
  );
  show();
  expect(await screen.findByRole("heading", { name: "Work" })).toBeInTheDocument();
});

test("identifies each project's repository and demo links", async () => {
  server.use(
    http.get("*/api/public/portfolio", () =>
      HttpResponse.json({
        data: [
          {
            ...project,
            repositoryUrl: "https://example.com/work",
            demoUrl: "https://example.com/demo",
          },
          { ...project, id: "2", name: "Other", demoUrl: "https://example.com/other" },
        ],
      }),
    ),
  );
  show();
  expect(await screen.findByRole("link", { name: "Work のリポジトリ" })).toHaveAttribute(
    "href",
    "https://example.com/work",
  );
  expect(screen.getByRole("link", { name: "Work のデモ" })).toHaveAttribute(
    "href",
    "https://example.com/demo",
  );
  expect(screen.getByRole("link", { name: "Other のデモ" })).toHaveAttribute(
    "href",
    "https://example.com/other",
  );
});

test("renders HTTP URLs accepted by portfolio administration", async () => {
  server.use(
    http.get("*/api/public/portfolio", () =>
      HttpResponse.json({
        data: [{ ...project, demoUrl: "https:example.test/demo" }],
      }),
    ),
  );
  show();
  expect(await screen.findByRole("link", { name: "Work のデモ" })).toHaveAttribute(
    "href",
    "https://example.test/demo",
  );
});

test("does not display a hobby project on engineering", async () => {
  server.use(
    http.get("*/api/public/portfolio", () =>
      HttpResponse.json({ data: [{ ...project, section: "hobby" }] }),
    ),
  );
  show();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Work" })).not.toBeInTheDocument();
});

test("shows a project image and hides it when it cannot load", async () => {
  server.use(
    http.get("*/api/public/portfolio", () =>
      HttpResponse.json({ data: [{ ...project, imageUrl: "https://example.com/image.png" }] }),
    ),
  );
  show();
  const image = await screen.findByRole("img", { name: "Work の画像" });
  expect(image).toHaveAttribute("src", "https://example.com/image.png");
  fireEvent.error(image);
  expect(screen.queryByRole("img", { name: "Work の画像" })).not.toBeInTheDocument();
});

test.each(["repositoryUrl", "demoUrl", "imageUrl"])("rejects an unsafe %s", async (field) => {
  server.use(
    http.get("*/api/public/portfolio", () =>
      HttpResponse.json({ data: [{ ...project, [field]: "javascript:alert(1)" }] }),
    ),
  );
  show();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
});
