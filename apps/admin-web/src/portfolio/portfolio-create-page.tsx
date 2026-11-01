import { useBlocker } from "@tanstack/react-router";
import { useRef } from "react";
import { createAuthorizedRequest } from "../api/authorized-request";
import { PortfolioCreate } from "./portfolio-create";

type Props = { session: { accessToken: () => string | null }; onSuccess: () => void };

export const PortfolioCreatePage = ({ session, onSuccess }: Props) => {
  const dirty = useRef(false);
  useBlocker({
    shouldBlockFn: () => dirty.current && !window.confirm("未保存の変更を破棄しますか？"),
    enableBeforeUnload: () => dirty.current,
  });
  const request = createAuthorizedRequest(session);
  return (
    <PortfolioCreate
      onDirty={() => {
        dirty.current = true;
      }}
      save={async (data) => {
        await request({ method: "POST", url: "/api/admin/portfolio", data });
      }}
      onSuccess={() => {
        dirty.current = false;
        onSuccess();
      }}
    />
  );
};
