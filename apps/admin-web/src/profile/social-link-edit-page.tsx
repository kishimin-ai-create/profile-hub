import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";
import { SocialLinkFormPage } from "./social-link-form-page";

const schema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      section: z.enum(["engineering", "hobby"]),
      kind: z.string(),
      url: z.string(),
      displayOrder: z.number().int(),
    }),
  ),
});
type SocialLink = z.infer<typeof schema>["data"][number];
type State =
  | { status: "loading" }
  | { status: "error"; source: AdminSession; id: string }
  | { status: "ready"; source: AdminSession; id: string; link: SocialLink };

export const SocialLinkEditPage = ({
  session,
  id,
  onSuccess,
}: {
  session: AdminSession;
  id: string;
  onSuccess: () => void;
}) => {
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const lifecycle = { active: true };
    void request<unknown>({ method: "GET", url: "/api/admin/social-links" }).then(
      (result) => {
        const parsed = schema.safeParse(result);
        const link = parsed.success ? parsed.data.data.find((entry) => entry.id === id) : undefined;
        if (lifecycle.active)
          setState(
            link
              ? { status: "ready", source: session, id, link }
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
        <p role={"alert"}>{"リンクを取得できませんでした"}</p>
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
  return <SocialLinkFormPage initial={state.link} session={session} onSuccess={onSuccess} />;
};
