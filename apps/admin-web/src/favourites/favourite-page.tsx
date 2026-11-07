import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";

const responseSchema = z.object({
  data: z.array(z.object({ id: z.string(), name: z.string(), description: z.string() })),
});
type Favourite = z.infer<typeof responseSchema>["data"][number];
type State =
  | { status: "loading" }
  | { status: "error"; source: AdminSession }
  | { status: "ready"; source: AdminSession; rows: Favourite[] };

export const FavouritePage = ({
  session,
  renderEdit,
}: {
  session: AdminSession;
  renderEdit?: (row: Favourite) => ReactNode;
}) => {
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [reorderError, setReorderError] = useState(false);
  const [notice, setNotice] = useState<{ source: AdminSession; text: string } | null>(null);
  const pending = useRef(false);
  useEffect(() => {
    const lifecycle = { active: true };
    void request<unknown>({ method: "GET", url: "/api/admin/favourites" }).then(
      (result) => {
        const parsed = responseSchema.safeParse(result);
        if (lifecycle.active)
          setState(
            parsed.success
              ? { status: "ready", source: session, rows: parsed.data.data }
              : { status: "error", source: session },
          );
      },
      () => {
        if (lifecycle.active) setState({ status: "error", source: session });
      },
    );
    return () => {
      lifecycle.active = false;
    };
  }, [attempt, request, session]);
  const remove = async (row: Favourite) => {
    if (pending.current || !window.confirm(`「${row.name}」を完全に削除しますか？`)) return;
    pending.current = true;
    setBusy(true);
    setDeleteError(false);
    setNotice(null);
    try {
      await request({ method: "DELETE", url: `/api/admin/favourites/${row.id}` });
      setState((previous) =>
        previous.status === "ready" && previous.source === session
          ? { ...previous, rows: previous.rows.filter((entry) => entry.id !== row.id) }
          : previous,
      );
      setNotice({ source: session, text: `${row.name} を削除しました` });
    } catch {
      setDeleteError(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const move = async (row: Favourite, direction: -1 | 1) => {
    if (pending.current || state.status !== "ready" || state.source !== session) return;
    const from = state.rows.findIndex((entry) => entry.id === row.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= state.rows.length) return;
    const rows = state.rows.map((entry, index) =>
      index === from
        ? (state.rows[to] ?? entry)
        : index === to
          ? (state.rows[from] ?? entry)
          : entry,
    );
    pending.current = true;
    setBusy(true);
    setReorderError(false);
    setNotice(null);
    try {
      await request({
        method: "PATCH",
        url: "/api/admin/favourites/order",
        data: { ids: rows.map((entry) => entry.id) },
      });
      setState((previous) =>
        previous.status === "ready" && previous.source === session
          ? { ...previous, rows }
          : previous,
      );
      setNotice({ source: session, text: `${row.name} の順序を変更しました` });
    } catch {
      setReorderError(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const loading = state.status === "loading" || state.source !== session;
  return (
    <>
      <span role={"status"}>
        {loading
          ? "読み込み中"
          : state.status === "ready" && notice?.source === session
            ? notice.text
            : ""}
      </span>
      {!loading && state.status === "error" && (
        <div>
          <p role={"alert"}>{"お気に入りを取得できませんでした"}</p>
          <button
            type={"button"}
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((value) => value + 1);
            }}
          >
            {"再試行"}
          </button>
        </div>
      )}
      {!loading && state.status === "ready" && (
        <section>
          <h1>{"お気に入り"}</h1>
          {deleteError && <p role={"alert"}>{"お気に入りを削除できませんでした"}</p>}
          {reorderError && <p role={"alert"}>{"お気に入りの順序を変更できませんでした"}</p>}
          {state.rows.length === 0 ? (
            <p>{"お気に入りがありません"}</p>
          ) : (
            <ul aria-label={"お気に入り一覧"}>
              {state.rows.map((row, index) => (
                <li key={row.id}>
                  <h2>{row.name}</h2>
                  <p>{row.description}</p>
                  {renderEdit?.(row)}
                  <button
                    type={"button"}
                    disabled={busy || index === 0}
                    onClick={() => {
                      void move(row, -1);
                    }}
                  >{`${row.name} を上へ`}</button>
                  <button
                    type={"button"}
                    disabled={busy || index === state.rows.length - 1}
                    onClick={() => {
                      void move(row, 1);
                    }}
                  >{`${row.name} を下へ`}</button>
                  <button
                    type={"button"}
                    disabled={busy}
                    onClick={() => {
                      void remove(row);
                    }}
                  >{`${row.name} を削除`}</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
};
