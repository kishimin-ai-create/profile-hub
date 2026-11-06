import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

export const LoadingState = () => <p role={"status"}>{"読み込み中…"}</p>;

export const ErrorState = ({
  onRetry,
  retrying = false,
  message = "データを読み込めませんでした。もう一度お試しください。",
}: {
  onRetry: () => void;
  retrying?: boolean;
  message?: string;
}) => (
  <div className={"error-state"}>
    <p role={"alert"}>{message}</p>
    <button type={"button"} onClick={onRetry} disabled={retrying}>
      {"再試行"}
    </button>
  </div>
);

type QueryStateProps = {
  query: Pick<UseQueryResult, "status" | "fetchStatus"> & {
    isRefetchError?: boolean;
    refetch: () => Promise<unknown>;
  };
  children: ReactNode;
};

export const QueryState = ({ query, children }: QueryStateProps) => {
  const message =
    query.status === "pending"
      ? query.fetchStatus === "fetching"
        ? "読み込み中…"
        : "データを待っています。"
      : query.fetchStatus === "paused"
        ? query.status === "success" || query.isRefetchError
          ? "更新を待っています。"
          : "データを待っています。"
        : query.fetchStatus === "fetching"
          ? query.status === "success" || query.isRefetchError
            ? "更新中…"
            : "読み込み中…"
          : "";
  return (
    <>
      {(query.status === "success" || (query.status === "error" && query.isRefetchError)) &&
        children}
      {query.status === "error" && (
        <ErrorState
          onRetry={() => {
            void query.refetch();
          }}
          retrying={query.fetchStatus !== "idle"}
          message={
            query.isRefetchError
              ? "更新に失敗しました。表示中の内容は古い可能性があります。"
              : undefined
          }
        />
      )}
      <span role={"status"}>{message}</span>
    </>
  );
};
