/* eslint-disable testing-library/no-node-access -- Head metadata has no accessible role or text query. */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { PageMetadata } from "./PageMetadata";

describe("PageMetadata", () => {
  test("marks an unknown page as noindex and clears it for a known page", () => {
    const { rerender } = render(
      <PageMetadata title={"Not found"} description={"Missing"} noIndex />,
    );
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex",
    );
    rerender(<PageMetadata title={"Home"} description={"Home"} />);
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  test("replaces optional preview images when a different page renders", () => {
    const { rerender } = render(
      <PageMetadata
        title={"Engineering"}
        description={"仕事について"}
        image={"https://example.com/engineering.png"}
        canonicalUrl={"https://example.com/engineering"}
      />,
    );
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://example.com/engineering",
    );
    expect(document.head.querySelector('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "https://example.com/engineering",
    );
    expect(document.head.querySelector('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://example.com/engineering.png",
    );
    expect(document.head.querySelector('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    expect(document.head.querySelector('meta[name="twitter:image"]')).toHaveAttribute(
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
    expect(document.head.querySelector('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary",
    );
    expect(document.head.querySelector('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      "Hobby | profile-hub",
    );
    expect(document.head.querySelector('meta[name="twitter:description"]')).toHaveAttribute(
      "content",
      "趣味について",
    );
    expect(document.head.querySelector('meta[name="twitter:image"]')).toBeNull();
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:url"]')).toBeNull();
  });
});
