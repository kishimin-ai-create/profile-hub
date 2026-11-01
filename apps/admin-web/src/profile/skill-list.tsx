import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";

const schema = z.object({
  data: z.array(z.object({ id: z.string(), name: z.string(), displayOrder: z.number().int() })),
});
type Skill = z.infer<typeof schema>["data"][number];
type State =
  | { status: "loading" }
  | { status: "error"; source: AdminSession }
  | { status: "ready"; source: AdminSession; skills: Skill[] };

export const SkillList = ({ session }: { session: AdminSession }) => {
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    const lifecycle = { active: true };
    void request<unknown>({ method: "GET", url: "/api/admin/skills" }).then(
      (result) => {
        const parsed = schema.safeParse(result);
        if (lifecycle.active)
          setState(
            parsed.success
              ? { status: "ready", source: session, skills: parsed.data.data }
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
    return <p role={"status"}>{"スキルを読み込み中"}</p>;
  if (state.status === "error") return <p role={"alert"}>{"スキルを取得できませんでした"}</p>;
  return (
    <section>
      <h2>{"スキル"}</h2>
      {state.skills.length === 0 ? (
        <p>{"スキルがありません"}</p>
      ) : (
        <ul aria-label={"スキル一覧"}>
          {state.skills.map((skill) => (
            <li key={skill.id}>{skill.name}</li>
          ))}
        </ul>
      )}
    </section>
  );
};
