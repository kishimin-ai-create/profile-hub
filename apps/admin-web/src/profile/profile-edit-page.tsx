import { useBlocker } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { createAuthorizedRequest } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";
import { ProfileForm } from "./profile-form";
import type { ProfileInput } from "./profile-form";
import { profileSchema } from "./profile-schema";

type State =
  | { status: "loading" }
  | { status: "error"; source: AdminSession }
  | { status: "ready"; source: AdminSession; data: ProfileInput };
export const ProfileEditPage = ({
  session,
  onSuccess,
}: {
  session: AdminSession;
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
    void request<unknown>({ method: "GET", url: "/api/admin/profile" }).then(
      (result) => {
        const parsed = profileSchema.safeParse(result);
        if (!lifecycle.active) return;
        if (!parsed.success) {
          setState({ status: "error", source: session });
          return;
        }
        setState({
          status: "ready",
          source: session,
          data: parsed.data.data ?? { name: "", title: null, bio: null, avatarUrl: null },
        });
      },
      () => {
        if (lifecycle.active) setState({ status: "error", source: session });
      },
    );
    return () => {
      lifecycle.active = false;
    };
  }, [attempt, request, session]);
  const loading = state.status === "loading" || state.source !== session;
  return (
    <>
      <span role={"status"}>{loading ? "読み込み中" : ""}</span>
      {!loading && state.status === "error" && (
        <>
          <p role={"alert"}>{"プロフィールを取得できませんでした"}</p>
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
      {!loading && state.status === "ready" && (
        <>
          <h1>{"プロフィールを編集"}</h1>
          <ProfileForm
            initial={state.data}
            onDirty={() => {
              dirty.current = true;
            }}
            save={async (data) => {
              await request({ method: "PUT", url: "/api/admin/profile", data });
            }}
            onSuccess={() => {
              dirty.current = false;
              onSuccess();
            }}
          />
        </>
      )}
    </>
  );
};
