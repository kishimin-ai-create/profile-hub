import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("only authenticated valid portfolio creation reaches persistence", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  const saved: unknown[] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
    createPortfolio: (input) => {
      saved.push(input);
      return Promise.resolve({
        ...input,
        id: "12",
        repositoryUrl: input.repositoryUrl ?? null,
        demoUrl: input.demoUrl ?? null,
        imageUrl: input.imageUrl ?? null,
      });
    },
  });
  const valid = {
    section: "engineering",
    name: "Project",
    summary: "Summary",
    technologies: ["Bun"],
    displayOrder: 1,
  };
  const request = (data: unknown, token?: string) =>
    app.request("/api/admin/portfolio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
  expect((await request(valid)).status).toBe(401);
  const token = await issueToken("42", 3, "access", secret);
  expect((await request({ ...valid, demoUrl: "javascript:alert(1)" }, token)).status).toBe(400);
  const malformed = await app.request("/api/admin/portfolio", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{",
  });
  expect(malformed.status).toBe(400);
  expect((await request({ ...valid, name: "x".repeat(70000) }, token)).status).toBe(413);
  expect(saved).toHaveLength(0);
  const response = await request(valid, token);
  expect(response.status).toBe(201);
  expect(await response.json()).toMatchObject({
    data: { id: "12", name: "Project", section: "engineering" },
  });
  expect(saved).toHaveLength(1);
});
