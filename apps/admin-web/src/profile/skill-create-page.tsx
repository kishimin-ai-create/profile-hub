import { useBlocker } from "@tanstack/react-router";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { createAuthorizedRequest, sessionRenewedError } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";

export const SkillCreatePage = ({
  session,
  onSuccess,
  initial,
}: {
  session: AdminSession;
  onSuccess: () => void;
  initial?: { id: string; name: string; displayOrder: number };
}) => {
  const dirty = useRef(false);
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useBlocker({
    shouldBlockFn: () => dirty.current && !window.confirm("未保存の変更を破棄しますか？"),
    enableBeforeUnload: () => dirty.current,
  });
  const request = createAuthorizedRequest(session);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    const rawName = form.get("name");
    const rawOrder = form.get("displayOrder");
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const order = typeof rawOrder === "string" ? rawOrder.trim() : "";
    if (
      !name ||
      !order ||
      !Number.isInteger(Number(order)) ||
      Number(order) < -2147483648 ||
      Number(order) > 2147483647
    ) {
      setError("入力内容を確認してください");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await request({
        method: initial ? "PUT" : "POST",
        url: initial ? `/api/admin/skills/${initial.id}` : "/api/admin/skills",
        data: { name, displayOrder: Number(order) },
      });
      dirty.current = false;
      onSuccess();
    } catch (failure) {
      setError(
        failure === sessionRenewedError
          ? "認証を更新しました。もう一度保存してください"
          : "スキルを保存できませんでした",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };
  return (
    <>
      <h1>{initial ? "スキルを編集" : "スキルを作成"}</h1>
      <form
        onChange={() => {
          dirty.current = true;
        }}
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <fieldset disabled={pending}>
          <label>
            {"スキル名"}
            <input name={"name"} required maxLength={200} defaultValue={initial?.name} />
          </label>
          <label>
            {"表示順"}
            <input
              name={"displayOrder"}
              type={"number"}
              required
              min={-2147483648}
              max={2147483647}
              defaultValue={initial?.displayOrder}
            />
          </label>
          <button type={"submit"}>{initial ? "保存" : "作成"}</button>
        </fieldset>
        {error && <p role={"alert"}>{error}</p>}
      </form>
    </>
  );
};
