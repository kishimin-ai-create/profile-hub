import { useBlocker } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";
import { FavouriteForm } from "./favourite-form";
import type { FavouriteInput } from "./favourite-form";

const schema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      link: z.string(),
      displayOrder: z.number(),
    }),
  ),
});
type State =
  | { status: "loading" }
  | { status: "error"; source: AdminSession; id: string }
  | { status: "ready"; source: AdminSession; id: string; data: FavouriteInput };

export const FavouriteEditPage = ({
  session,
  id,
  onSuccess,
}: {
  session: AdminSession;
  id: string;
  onSuccess: () => void;
}) => {
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  const dirty = useRef(false);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useBlocker({
    shouldBlockFn: () => dirty.current && !window.confirm("未保存の変更を破棄しますか？"),
    enableBeforeUnload: () => dirty.current,
  });
  useEffect(() => {
    const lifecycle = { active: true };
    void request<unknown>({ method: "GET", url: "/api/admin/favourites" }).then(
      (result) => {
        const parsed = schema.safeParse(result);
        const row = parsed.success ? parsed.data.data.find((entry) => entry.id === id) : undefined;
        if (lifecycle.active)
          setState(
            row
              ? { status: "ready", source: session, id, data: row }
              : { status: "error", source: session, id },
          );
      },
      () => {
        if (lifecycle.active) setState({ status: "error", source: session, id });
      },
    );
    return () => {
      lifecycle.active = false;
    };
  }, [attempt, id, request, session]);
  if (state.status === "loading" || state.source !== session || state.id !== id)
    return <p role={"status"}>{"読み込み中"}</p>;
  if (state.status === "error")
    return (
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
    );
  return (
    <>
      <h1>{"お気に入りを編集"}</h1>
      <FavouriteForm
        initial={state.data}
        onDirty={() => {
          dirty.current = true;
        }}
        save={async (data) => {
          await request({ method: "PUT", url: `/api/admin/favourites/${id}`, data });
        }}
        onSuccess={() => {
          dirty.current = false;
          onSuccess();
        }}
      />
    </>
  );
};
