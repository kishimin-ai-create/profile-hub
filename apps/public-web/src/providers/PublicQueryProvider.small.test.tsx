import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { PublicQueryProvider } from "./PublicQueryProvider";

describe("PublicQueryProvider", () => {
  test("retains fresh public query data across child remounts", async () => {
    const load = vi.fn<() => Promise<string>>().mockResolvedValue("公開データ");
    const Probe = () => {
      const query = useQuery({ queryKey: ["example"], queryFn: load });
      return <p>{query.data}</p>;
    };

    const { rerender } = render(<PublicQueryProvider><Probe /></PublicQueryProvider>);
    expect(await screen.findByText("公開データ")).toBeInTheDocument();
    rerender(<PublicQueryProvider>{null}</PublicQueryProvider>);
    rerender(<PublicQueryProvider><Probe /></PublicQueryProvider>);

    expect(await screen.findByText("公開データ")).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
  });
});
