import { useEffect, useMemo, useRef, useState } from "react";
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
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const pending = useRef(false);
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
  const remove = async (skill: Skill) => {
    if (pending.current || !window.confirm(`「${skill.name}」を完全に削除しますか？`)) return;
    pending.current = true;
    setBusy(true);
    setDeleteError(false);
    try {
      await request({ method: "DELETE", url: `/api/admin/skills/${skill.id}` });
      setState((previous) =>
        previous.status === "ready" && previous.source === session
          ? { ...previous, skills: previous.skills.filter((entry) => entry.id !== skill.id) }
          : previous,
      );
    } catch {
      setDeleteError(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  if (state.status === "loading" || state.source !== session)
    return <p role={"status"}>{"スキルを読み込み中"}</p>;
  if (state.status === "error") return <p role={"alert"}>{"スキルを取得できませんでした"}</p>;
  return (
    <section>
      <h2>{"スキル"}</h2>
      {deleteError && <p role={"alert"}>{"スキルを削除できませんでした"}</p>}
      {state.skills.length === 0 ? (
        <p>{"スキルがありません"}</p>
      ) : (
        <ul aria-label={"スキル一覧"}>
          {state.skills.map((skill) => (
            <li key={skill.id}>
              {skill.name}
              <button
                type={"button"}
                disabled={busy}
                onClick={() => {
                  void remove(skill);
                }}
              >{`${skill.name} を削除`}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
