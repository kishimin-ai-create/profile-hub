import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";

const response = z.object({ data: z.array(z.object({ id: z.string() })) });
type State =
  | { status: "loading" }
  | { status: "error"; source: AdminSession }
  | { status: "ready"; source: AdminSession; portfolios: number; favourites: number };

export const DashboardCounts = ({ session }: { session: AdminSession }) => {
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const lifecycle = { active: true };
    const load = async () => {
      try {
        const portfolios = response.parse(
          await request<unknown>({ method: "GET", url: "/api/admin/portfolio" }),
        ).data.length;
        const favourites = response.parse(
          await request<unknown>({ method: "GET", url: "/api/admin/favourites" }),
        ).data.length;
        if (lifecycle.active)
          setState({ status: "ready", source: session, portfolios, favourites });
      } catch {
        if (lifecycle.active) setState({ status: "error", source: session });
      }
    };
    void load();
    return () => {
      lifecycle.active = false;
    };
  }, [attempt, request, session]);
  const current: State =
    state.status !== "loading" && state.source === session ? state : { status: "loading" };
  return (
    <section aria-label={"登録状況"}>
      <h2>{"登録状況"}</h2>
      {current.status === "loading" && <p role={"status"}>{"読み込み中"}</p>}
      {current.status === "error" && (
        <>
          <p role={"alert"}>{"登録件数を取得できませんでした"}</p>
          <button
            type={"button"}
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((value) => value + 1);
            }}
          >
            {"再試行"}
          </button>
        </>
      )}
      {current.status === "ready" && (
        <dl>
          <dt>{"作品"}</dt>
          <dd>{`${current.portfolios}件`}</dd>
          <dt>{"お気に入り"}</dt>
          <dd>{`${current.favourites}件`}</dd>
        </dl>
      )}
    </section>
  );
};
