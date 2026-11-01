import { useEffect, useMemo, useRef, useState } from "react";
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

export const SocialLinkList = ({ session }: { session: AdminSession }) => {
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  const [state, setState] = useState<State>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
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
  }, [request, session]);
  const remove = async (link: SocialLink) => {
    if (pending.current || !window.confirm(`「${link.url}」を完全に削除しますか？`)) return;
    pending.current = true;
    setBusy(true);
    setDeleteError(false);
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
  if (state.status === "loading" || state.source !== session)
    return <p role={"status"}>{"リンクを読み込み中"}</p>;
  if (state.status === "error") return <p role={"alert"}>{"リンクを取得できませんでした"}</p>;
  return (
    <section>
      <h2>{"リンク"}</h2>
      {deleteError && <p role={"alert"}>{"リンクを削除できませんでした"}</p>}
      {state.links.length === 0 ? (
        <p>{"リンクがありません"}</p>
      ) : (
        <ul aria-label={"リンク一覧"}>
          {state.links.map((link) => (
            <li key={link.id}>
              <span>{link.section === "engineering" ? "Engineering" : "Hobby"}</span>
              <span>{link.kind}</span>
              <span>{link.url}</span>
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
  );
};
