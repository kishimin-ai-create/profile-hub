import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { PublicQueryProvider } from "../providers/PublicQueryProvider";
import { QueryState } from "./QueryState";

const Example = ({ load }: { load: () => Promise<string> }) => {
  const query = useQuery({ queryKey: ["example"], queryFn: load });
  return (
    <QueryState query={query}>
      <p>{query.data}</p>
    </QueryState>
  );
};

describe("QueryState", () => {
  test("reports a paused refresh while keeping existing content", () => {
    render(
      <QueryState
        query={{ status: "success", fetchStatus: "paused", refetch: () => Promise.resolve() }}
      >
        <p>{"公開データ"}</p>
      </QueryState>,
    );
    expect(screen.getByText("公開データ")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("更新を待っています");
  });
  test("announces background refreshes through an existing status region", () => {
    const query = {
      status: "success" as const,
      fetchStatus: "idle" as const,
      refetch: () => Promise.resolve(),
    };
    const { rerender } = render(
      <QueryState query={query}>
        <p>{"公開データ"}</p>
      </QueryState>,
    );
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    rerender(
      <QueryState query={{ ...query, fetchStatus: "fetching" }}>
        <p>{"公開データ"}</p>
      </QueryState>,
    );
    expect(status).toHaveTextContent("更新中");
    expect(screen.getByText("公開データ")).toBeInTheDocument();
    rerender(
      <QueryState query={query}>
        <p>{"公開データ"}</p>
      </QueryState>,
    );
    expect(status).toBeEmptyDOMElement();
  });
  test("keeps existing content visible when a background refresh fails", async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("公開データ")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce("更新データ");
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const RefreshExample = () => {
      const query = useQuery({ queryKey: ["refresh"], queryFn: load });
      return (
        <>
          <button
            type={"button"}
            onClick={() => {
              void query.refetch();
            }}
          >
            {"更新"}
          </button>
          <QueryState query={query}>
            <p>{query.data}</p>
          </QueryState>
        </>
      );
    };
    render(
      <QueryClientProvider client={client}>
        <RefreshExample />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("公開データ")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "更新" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("公開データ")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(await screen.findByText("更新データ")).toBeInTheDocument();
  });
  test("announces a paused initial query without claiming an active request", () => {
    render(
      <QueryState
        query={{ status: "pending", fetchStatus: "paused", refetch: () => Promise.resolve() }}
      >
        {null}
      </QueryState>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("データを待っています");
  });

  test("retains successful content during a background refresh", () => {
    render(
      <QueryState
        query={{ status: "success", fetchStatus: "fetching", refetch: () => Promise.resolve() }}
      >
        <p>{"公開データ"}</p>
      </QueryState>,
    );
    expect(screen.getByText("公開データ")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("更新中");
  });

  test("prevents another retry while one is already fetching", () => {
    render(
      <QueryState
        query={{ status: "error", fetchStatus: "fetching", refetch: () => Promise.resolve() }}
      >
        {null}
      </QueryState>,
    );
    expect(screen.getByRole("button", { name: "再試行" })).toBeDisabled();
  });

  test("announces loading while the first response is pending", () => {
    const load = () => new Promise<string>(() => {});
    render(
      <PublicQueryProvider>
        <Example load={load} />
      </PublicQueryProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("読み込み中");
  });

  test("announces failure without error details and retries on request", async () => {
    const user = userEvent.setup();
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("private diagnostic"))
      .mockResolvedValue("公開データ");
    render(
      <PublicQueryProvider>
        <Example load={load} />
      </PublicQueryProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("読み込めませんでした");
    expect(screen.queryByText("private diagnostic")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "再試行" }));

    expect(await screen.findByText("公開データ")).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
