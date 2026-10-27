/* eslint-disable testing-library/no-node-access -- Head metadata has no accessible role or text query. */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { PageMetadata } from "./PageMetadata";

describe("PageMetadata", () => {
  test("replaces optional preview images when a different page renders", () => {
    const { rerender } = render(
      <PageMetadata
        title={"Engineering"}
        description={"仕事について"}
        image={"https://example.com/engineering.png"}
      />,
    );
    expect(document.head.querySelector('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://example.com/engineering.png",
    );

    rerender(<PageMetadata title={"Hobby"} description={"趣味について"} />);

    expect(document.title).toBe("Hobby | profile-hub");
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "趣味について",
    );
    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
  });
});
