import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { SkillList } from "./skill-list";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

test("shows ordered skills from the authenticated API", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/skills", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return HttpResponse.json({ data: [{ id: "1", name: "TypeScript", displayOrder: 0 }] });
    }),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("TypeScript")).toBeInTheDocument();
});

test("reports skill loading errors", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get(
      "https://api.example.test/api/admin/skills",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("スキルを取得できませんでした");
});

test("shows an empty skill list", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/skills", () => HttpResponse.json({ data: [] })),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("スキルがありません")).toBeInTheDocument();
});

test("deletes a skill after confirmation", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  server.use(
    http.get("https://api.example.test/api/admin/skills", () =>
      HttpResponse.json({ data: [{ id: "1", name: "TypeScript", displayOrder: 0 }] }),
    ),
    http.delete("https://api.example.test/api/admin/skills/1", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return new HttpResponse(null, { status: 204 });
    }),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "TypeScript を削除" }));
  expect(await screen.findByText("スキルがありません")).toBeInTheDocument();
});

test("retains the skill if deletion fails", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  server.use(
    http.get("https://api.example.test/api/admin/skills", () =>
      HttpResponse.json({ data: [{ id: "1", name: "TypeScript", displayOrder: 0 }] }),
    ),
    http.delete(
      "https://api.example.test/api/admin/skills/1",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "TypeScript を削除" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("スキルを削除できませんでした");
  expect(screen.getByText("TypeScript")).toBeInTheDocument();
});
