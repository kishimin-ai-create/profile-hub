import { useBlocker } from "@tanstack/react-router";
import { useRef } from "react";
import { createAuthorizedRequest } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";
import { FavouriteForm } from "./favourite-form";

export const FavouriteCreatePage = ({
  session,
  onSuccess,
}: {
  session: AdminSession;
  onSuccess: () => void;
}) => {
  const dirty = useRef(false);
  useBlocker({
    shouldBlockFn: () => dirty.current && !window.confirm("未保存の変更を破棄しますか？"),
    enableBeforeUnload: () => dirty.current,
  });
  const request = createAuthorizedRequest(session);
  return (
    <>
      <h1>{"お気に入りを作成"}</h1>
      <FavouriteForm
        onDirty={() => {
          dirty.current = true;
        }}
        save={async (data) => {
          await request({ method: "POST", url: "/api/admin/favourites", data });
        }}
        onSuccess={() => {
          dirty.current = false;
          onSuccess();
        }}
      />
    </>
  );
};
