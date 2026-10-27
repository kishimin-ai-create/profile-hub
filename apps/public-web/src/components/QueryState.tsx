import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

export const LoadingState = () => <p role={"status"}>{"読み込み中…"}</p>;

export const ErrorState = ({
  onRetry,
  retrying = false,
}: {
  onRetry: () => void;
  retrying?: boolean;
}) => (
  <div className={"error-state"}>
    <p role={"alert"}>{"データを読み込めませんでした。もう一度お試しください。"}</p>
    <button type={"button"} onClick={onRetry} disabled={retrying}>
      {"再試行"}
    </button>
  </div>
);

type QueryStateProps = {
  query: Pick<UseQueryResult, "status" | "fetchStatus"> & { refetch: () => Promise<unknown> };
  children: ReactNode;
};

export const QueryState = ({ query, children }: QueryStateProps) => {
  if (query.status === "pending") {
    return query.fetchStatus === "fetching" ? (
      <LoadingState />
    ) : (
      <p role={"status"}>{"データを待っています。"}</p>
    );
  }
  if (query.status === "error") {
    return (
      <ErrorState
        onRetry={() => {
          void query.refetch();
        }}
        retrying={query.fetchStatus === "fetching"}
      />
    );
  }
  return (
    <>
      {children}
      {query.fetchStatus === "fetching" && <p role={"status"}>{"更新中…"}</p>}
    </>
  );
};
