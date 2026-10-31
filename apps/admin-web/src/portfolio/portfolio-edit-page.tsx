import { useBlocker } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { createAuthorizedRequest } from "../api/authorized-request";
import { PortfolioCreate } from "./portfolio-create";

const detailSchema = z.object({
  data: z.object({
    id: z.string(),
    section: z.enum(["engineering", "hobby"]),
    name: z.string(),
    summary: z.string(),
    technologies: z.array(z.string()),
    displayOrder: z.number().int(),
    repositoryUrl: z.string().nullable(),
    demoUrl: z.string().nullable(),
    imageUrl: z.string().nullable(),
  }),
});
type Detail = z.infer<typeof detailSchema>["data"];
type State = { status: "loading" } | { status: "error" } | { status: "ready"; data: Detail };
type Props = { id: string; session: { accessToken: () => string | null }; onSuccess: () => void };

export const PortfolioEditPage = ({ id, session, onSuccess }: Props) => {
  const [state, setState] = useState<State>({ status: "loading" });
  const dirty = useRef(false);
  useBlocker({
    shouldBlockFn: () => dirty.current && !window.confirm("未保存の変更を破棄しますか？"),
    enableBeforeUnload: () => dirty.current,
  });
  const request = useMemo(() => createAuthorizedRequest(session), [session]);
  useEffect(() => {
    const lifecycle = { active: true };
    void request<unknown>({ method: "GET", url: `/api/admin/portfolio/${id}` }).then(
      (value) => {
        const parsed = detailSchema.safeParse(value);
        if (lifecycle.active)
          setState(
            parsed.success && parsed.data.data.id === id
              ? { status: "ready", data: parsed.data.data }
              : { status: "error" },
          );
      },
      () => {
        if (lifecycle.active) setState({ status: "error" });
      },
    );
    return () => {
      lifecycle.active = false;
    };
  }, [id, request]);
  if (state.status === "loading") return <p>{"読み込み中"}</p>;
  if (state.status === "error") return <p role={"alert"}>{"作品を取得できませんでした"}</p>;
  const { data } = state;
  return (
    <PortfolioCreate
      initial={{
        ...data,
        repositoryUrl: data.repositoryUrl ?? undefined,
        demoUrl: data.demoUrl ?? undefined,
        imageUrl: data.imageUrl ?? undefined,
      }}
      onDirty={() => {
        dirty.current = true;
      }}
      save={async (value) => {
        await request({ method: "PUT", url: `/api/admin/portfolio/${id}`, data: value });
      }}
      onSuccess={() => {
        dirty.current = false;
        onSuccess();
      }}
    />
  );
};
