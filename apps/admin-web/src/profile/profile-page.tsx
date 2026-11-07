import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";
import { profileSchema } from "./profile-schema";
type Profile = z.infer<typeof profileSchema>["data"];
type State =
  | { status: "loading" }
  | { status: "error"; source: AdminSession }
  | { status: "ready"; source: AdminSession; profile: Profile };

export const ProfilePage = ({ session }: { session: AdminSession }) => {
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const lifecycle = { active: true };
    void request<unknown>({ method: "GET", url: "/api/admin/profile" }).then(
      (result) => {
        const parsed = profileSchema.safeParse(result);
        if (lifecycle.active)
          setState(
            parsed.success
              ? { status: "ready", source: session, profile: parsed.data.data }
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
        <section>
          <h1>{"プロフィール"}</h1>
          {state.profile ? (
            <dl>
              <dt>{"名前"}</dt>
              <dd>{state.profile.name}</dd>
              <dt>{"肩書き"}</dt>
              <dd>{state.profile.title}</dd>
              <dt>{"自己紹介"}</dt>
              <dd>{state.profile.bio}</dd>
              <dt>{"画像 URL"}</dt>
              <dd>{state.profile.avatarUrl}</dd>
            </dl>
          ) : (
            <p>{"プロフィールがありません"}</p>
          )}
        </section>
      )}
    </>
  );
};
