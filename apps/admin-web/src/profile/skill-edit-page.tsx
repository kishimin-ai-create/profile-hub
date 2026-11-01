import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";
import { SkillCreatePage } from "./skill-create-page";

const schema = z.object({
  data: z.array(z.object({ id: z.string(), name: z.string(), displayOrder: z.number().int() })),
});
type Skill = z.infer<typeof schema>["data"][number];
type State =
  | { status: "loading" }
  | { status: "error"; source: AdminSession; id: string }
  | { status: "ready"; source: AdminSession; id: string; skill: Skill };
export const SkillEditPage = ({
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
  useEffect(() => {
    const lifecycle = { active: true };
    void request<unknown>({ method: "GET", url: "/api/admin/skills" }).then(
      (result) => {
        const parsed = schema.safeParse(result);
        const skill = parsed.success
          ? parsed.data.data.find((entry) => entry.id === id)
          : undefined;
        if (lifecycle.active)
          setState(
            skill
              ? { status: "ready", source: session, id, skill }
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
  }, [id, request, session]);
  if (state.status === "loading" || state.source !== session || state.id !== id)
    return <p role={"status"}>{"読み込み中"}</p>;
  if (state.status === "error") return <p role={"alert"}>{"スキルを取得できませんでした"}</p>;
  return <SkillCreatePage initial={state.skill} session={session} onSuccess={onSuccess} />;
};
