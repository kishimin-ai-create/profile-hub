import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { App } from "./App";

describe("App", () => {
  test("opens the login page from the application entry point", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "ログイン" })).toBeInTheDocument();
  });
});
