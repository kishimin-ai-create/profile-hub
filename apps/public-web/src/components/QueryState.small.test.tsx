import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { PublicQueryProvider } from "../providers/PublicQueryProvider";
import { QueryState } from "./QueryState";

const Example = ({ load }: { load: () => Promise<string> }) => {
  const query = useQuery({ queryKey: ["example"], queryFn: load });
  return <QueryState query={query}><p>{query.data}</p></QueryState>;
};

describe("QueryState", () => {
  test("announces loading while the first response is pending", () => {
    const load = () => new Promise<string>(() => {});
    render(<PublicQueryProvider><Example load={load} /></PublicQueryProvider>);

    expect(screen.getByRole("status")).toHaveTextContent("読み込み中");
  });

  test("announces failure without error details and retries on request", async () => {
    const user = userEvent.setup();
    const load = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error("private diagnostic")).mockResolvedValue("公開データ");
    render(<PublicQueryProvider><Example load={load} /></PublicQueryProvider>);

    expect(await screen.findByRole("alert")).toHaveTextContent("読み込めませんでした");
    expect(screen.queryByText("private diagnostic")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("公開データ")).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
