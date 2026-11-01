import { useBlocker } from "@tanstack/react-router";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { createAuthorizedRequest, sessionRenewedError } from "../api/authorized-request";
import type { AdminSession } from "../api/authorized-request";

export type SocialLink = {
  id: string;
  section: "engineering" | "hobby";
  kind: string;
  url: string;
  displayOrder: number;
};
export const SocialLinkFormPage = ({
  session,
  onSuccess,
  initial,
}: {
  session: AdminSession;
  onSuccess: () => void;
  initial?: SocialLink;
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
    const text = (key: string) => {
      const value = form.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    const section = z.enum(["engineering", "hobby"]).safeParse(text("section"));
    const kind = text("kind");
    const url = text("url");
    const order = text("displayOrder");
    const isEmail =
      kind === "email" && /^mailto:/i.test(url) && z.email().safeParse(url.slice(7)).success;
    const isWeb = (() => {
      try {
        const parsed = new URL(url);
        return (
          /^https?:\/\//i.test(url) && (parsed.protocol === "http:" || parsed.protocol === "https:")
        );
      } catch {
        return false;
      }
    })();
    if (!isEmail && !isWeb) {
      setError("URL を確認してください");
      return;
    }
    if (
      !section.success ||
      !kind ||
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
        url: initial ? `/api/admin/social-links/${initial.id}` : "/api/admin/social-links",
        data: { section: section.data, kind, url, displayOrder: Number(order) },
      });
      dirty.current = false;
      onSuccess();
    } catch (failure) {
      setError(
        failure === sessionRenewedError
          ? "認証を更新しました。もう一度保存してください"
          : "リンクを保存できませんでした",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };
  return (
    <>
      <h1>{initial ? "リンクを編集" : "リンクを作成"}</h1>
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
            {"セクション"}
            <select name={"section"} required defaultValue={initial?.section ?? ""}>
              <option value={""}>{"選択してください"}</option>
              <option value={"engineering"}>{"Engineering"}</option>
              <option value={"hobby"}>{"Hobby"}</option>
            </select>
          </label>
          <label>
            {"種類"}
            <input name={"kind"} required maxLength={100} defaultValue={initial?.kind} />
          </label>
          <label>
            {"URL"}
            <input name={"url"} required maxLength={2048} defaultValue={initial?.url} />
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
