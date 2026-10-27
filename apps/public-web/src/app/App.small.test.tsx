import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { App } from "./App";

describe("App", () => {
  test("opens the home route without authentication", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
  });
});
