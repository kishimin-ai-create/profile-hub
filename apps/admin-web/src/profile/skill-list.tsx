import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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

export const SkillList = ({
  session,
  renderEdit,
}: {
  session: AdminSession;
  renderEdit?: (skill: Skill) => ReactNode;
}) => {
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<{ source: AdminSession } | null>(null);
  const [reorderError, setReorderError] = useState<{ source: AdminSession } | null>(null);
  const [notice, setNotice] = useState<{ source: AdminSession; text: string } | null>(null);
  const pending = useRef(false);
  const generation = useRef(0);
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
      generation.current += 1;
    };
  }, [attempt, request, session]);
  const remove = async (skill: Skill) => {
    if (pending.current || !window.confirm(`「${skill.name}」を完全に削除しますか？`)) return;
    pending.current = true;
    const operationGeneration = generation.current;
    setBusy(true);
    setDeleteError(null);
    setNotice(null);
    try {
      await request({ method: "DELETE", url: `/api/admin/skills/${skill.id}` });
      setState((previous) =>
        previous.status === "ready" && previous.source === session
          ? { ...previous, skills: previous.skills.filter((entry) => entry.id !== skill.id) }
          : previous,
      );
      setNotice({ source: session, text: `${skill.name} を削除しました` });
    } catch {
      if (generation.current === operationGeneration) setDeleteError({ source: session });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const move = async (skill: Skill, direction: -1 | 1) => {
    if (pending.current || state.status !== "ready" || state.source !== session) return;
    const from = state.skills.findIndex((entry) => entry.id === skill.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= state.skills.length) return;
    const skills = state.skills.map((entry, index) =>
      index === from
        ? (state.skills[to] ?? entry)
        : index === to
          ? (state.skills[from] ?? entry)
          : entry,
    );
    pending.current = true;
    const operationGeneration = generation.current;
    setBusy(true);
    setReorderError(null);
    setNotice(null);
    try {
      await request({
        method: "PATCH",
        url: "/api/admin/skills/order",
        data: { ids: skills.map((entry) => entry.id) },
      });
      setState((previous) =>
        previous.status === "ready" && previous.source === session
          ? { ...previous, skills }
          : previous,
      );
      setNotice({ source: session, text: `${skill.name} の順序を変更しました` });
    } catch {
      if (generation.current === operationGeneration) setReorderError({ source: session });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const loading = state.status === "loading" || state.source !== session;
  return (
    <>
      <span role={"status"}>
        {loading
          ? "スキルを読み込み中"
          : state.status === "ready" && notice?.source === session
            ? notice.text
            : ""}
      </span>
      {!loading && state.status === "error" && (
        <div>
          <p role={"alert"}>{"スキルを取得できませんでした"}</p>
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
      )}
      {!loading && state.status === "ready" && (
        <section>
          <h2>{"スキル"}</h2>
          {deleteError?.source === session && (
            <p role={"alert"}>{"スキルを削除できませんでした"}</p>
          )}
          {reorderError?.source === session && (
            <p role={"alert"}>{"スキルの順序を変更できませんでした"}</p>
          )}
          {state.skills.length === 0 ? (
            <p>{"スキルがありません"}</p>
          ) : (
            <ul aria-label={"スキル一覧"}>
              {state.skills.map((skill, index) => (
                <li key={skill.id}>
                  {skill.name}
                  {renderEdit?.(skill)}
                  <button
                    type={"button"}
                    disabled={busy || index === 0}
                    onClick={() => {
                      void move(skill, -1);
                    }}
                  >{`${skill.name} を上へ`}</button>
                  <button
                    type={"button"}
                    disabled={busy || index === state.skills.length - 1}
                    onClick={() => {
                      void move(skill, 1);
                    }}
                  >{`${skill.name} を下へ`}</button>
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
      )}
    </>
  );
};
