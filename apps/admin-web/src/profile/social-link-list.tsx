import { useEffect, useMemo, useState } from "react";
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
  if (state.status === "loading" || state.source !== session)
    return <p role={"status"}>{"リンクを読み込み中"}</p>;
  if (state.status === "error") return <p role={"alert"}>{"リンクを取得できませんでした"}</p>;
  return (
    <section>
      <h2>{"リンク"}</h2>
      {state.links.length === 0 ? (
        <p>{"リンクがありません"}</p>
      ) : (
        <ul aria-label={"リンク一覧"}>
          {state.links.map((link) => (
            <li key={link.id}>
              <span>{link.section === "engineering" ? "Engineering" : "Hobby"}</span>
              <span>{link.kind}</span>
              <span>{link.url}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
