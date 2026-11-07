import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";

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
  | { status: "error"; source: AdminSession }
  | { status: "ready"; source: AdminSession; links: SocialLink[] };

export const SocialLinkList = ({
  session,
  renderEdit,
}: {
  session: AdminSession;
  renderEdit?: (link: SocialLink) => ReactNode;
}) => {
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [reorderError, setReorderError] = useState(false);
  const [notice, setNotice] = useState<{ source: AdminSession; text: string } | null>(null);
  const pending = useRef(false);
  useEffect(() => {
    const lifecycle = { active: true };
    void request<unknown>({ method: "GET", url: "/api/admin/social-links" }).then(
      (result) => {
        const parsed = schema.safeParse(result);
        if (lifecycle.active)
          setState(
            parsed.success
              ? { status: "ready", source: session, links: parsed.data.data }
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
  const remove = async (link: SocialLink) => {
    if (pending.current || !window.confirm(`「${link.url}」を完全に削除しますか？`)) return;
    pending.current = true;
    setBusy(true);
    setDeleteError(false);
    setNotice(null);
    try {
      await request({ method: "DELETE", url: `/api/admin/social-links/${link.id}` });
      setState((previous) =>
        previous.status === "ready" && previous.source === session
          ? { ...previous, links: previous.links.filter((entry) => entry.id !== link.id) }
          : previous,
      );
    } catch {
      setDeleteError(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const move = async (link: SocialLink, direction: -1 | 1) => {
    if (pending.current || state.status !== "ready" || state.source !== session) return;
    const section = state.links.filter((entry) => entry.section === link.section);
    const from = section.findIndex((entry) => entry.id === link.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= section.length) return;
    const other = section[to];
    if (!other) return;
    const reordered = section.map((entry, index) =>
      index === from ? other : index === to ? link : entry,
    );
    const links = state.links.map((entry) =>
      entry.id === link.id ? other : entry.id === other.id ? link : entry,
    );
    pending.current = true;
    setBusy(true);
    setReorderError(false);
    setNotice(null);
    try {
      await request({
        method: "PATCH",
        url: "/api/admin/social-links/order",
        data: { section: link.section, ids: reordered.map((entry) => entry.id) },
      });
      setState((previous) =>
        previous.status === "ready" && previous.source === session
          ? { ...previous, links }
          : previous,
      );
      setNotice({ source: session, text: `${link.url} の順序を変更しました` });
    } catch {
      setReorderError(true);
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
          ? "リンクを読み込み中"
          : state.status === "ready" && notice?.source === session
            ? notice.text
            : ""}
      </span>
      {!loading && state.status === "error" && (
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
      )}
      {!loading && state.status === "ready" && (
        <section>
          <h2>{"リンク"}</h2>
          {deleteError && <p role={"alert"}>{"リンクを削除できませんでした"}</p>}
          {reorderError && <p role={"alert"}>{"リンクの順序を変更できませんでした"}</p>}
          {state.links.length === 0 ? (
            <p>{"リンクがありません"}</p>
          ) : (
            <ul aria-label={"リンク一覧"}>
              {state.links.map((link) => (
                <li key={link.id}>
                  <span>{link.section === "engineering" ? "Engineering" : "Hobby"}</span>
                  <span>{link.kind}</span>
                  <span>{link.url}</span>
                  {renderEdit?.(link)}
                  <button
                    type={"button"}
                    disabled={
                      busy ||
                      state.links.filter((entry) => entry.section === link.section)[0]?.id ===
                        link.id
                    }
                    onClick={() => {
                      void move(link, -1);
                    }}
                  >{`${link.url} を上へ`}</button>
                  <button
                    type={"button"}
                    disabled={
                      busy ||
                      state.links.filter((entry) => entry.section === link.section).at(-1)?.id ===
                        link.id
                    }
                    onClick={() => {
                      void move(link, 1);
                    }}
                  >{`${link.url} を下へ`}</button>
                  <button
                    type={"button"}
                    disabled={busy}
                    onClick={() => {
                      void remove(link);
                    }}
                  >{`${link.url} を削除`}</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
};
