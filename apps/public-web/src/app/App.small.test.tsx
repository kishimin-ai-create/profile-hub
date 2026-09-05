import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { App } from "./App";

describe("App", () => {
  test("names every locale the public site is expected to serve", () => {
    render(<App />);

    expect(screen.getByText(/ja, en/)).toBeInTheDocument();
  });
});
