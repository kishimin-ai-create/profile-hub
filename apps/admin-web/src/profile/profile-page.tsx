import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";

const profileSchema = z.object({
  data: z
    .object({
      id: z.string(),
      name: z.string(),
      title: z.string().nullable(),
      bio: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    })
    .nullable(),
});
type Profile = z.infer<typeof profileSchema>["data"];
type State =
  | { status: "loading" }
  | { status: "error"; source: AdminSession }
  | { status: "ready"; source: AdminSession; profile: Profile };

export const ProfilePage = ({ session }: { session: AdminSession }) => {
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  const [state, setState] = useState<State>({ status: "loading" });
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
  }, [request, session]);
  if (state.status === "loading" || state.source !== session)
    return <p role={"status"}>{"読み込み中"}</p>;
  if (state.status === "error") return <p role={"alert"}>{"プロフィールを取得できませんでした"}</p>;
  return (
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
  );
};
