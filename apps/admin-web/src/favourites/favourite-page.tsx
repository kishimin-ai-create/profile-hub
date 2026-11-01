import { useEffect, useMemo, useState } from "react";
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

export const FavouritePage = ({ session }: { session: AdminSession }) => {
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  const [state, setState] = useState<State>({ status: "loading" });
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
  }, [request, session]);
  if (state.status === "loading" || state.source !== session)
    return <p role={"status"}>{"読み込み中"}</p>;
  if (state.status === "error") return <p role={"alert"}>{"お気に入りを取得できませんでした"}</p>;
  return (
    <section>
      <h1>{"お気に入り"}</h1>
      {state.rows.length === 0 ? (
        <p>{"お気に入りがありません"}</p>
      ) : (
        <ul aria-label={"お気に入り一覧"}>
          {state.rows.map((row) => (
            <li key={row.id}>
              <h2>{row.name}</h2>
              <p>{row.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
