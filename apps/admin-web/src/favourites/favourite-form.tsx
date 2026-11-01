import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { sessionRenewedError } from "../api/authorized-request";

export type FavouriteInput = {
  name: string;
  description: string;
  link: string;
  displayOrder: number;
};
type Props = {
  save: (data: FavouriteInput) => Promise<void>;
  onSuccess: () => void;
  onDirty?: () => void;
};

export const FavouriteForm = ({ save, onSuccess, onDirty }: Props) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    const text = (key: string) => {
      const value = form.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    const link = text("link");
    try {
      const url = new URL(link);
      if (!/^https?:\/\//i.test(link) || (url.protocol !== "http:" && url.protocol !== "https:"))
        throw new Error("Invalid URL");
    } catch {
      setError("http または https の URL を入力してください");
      return;
    }
    const order = text("displayOrder");
    if (
      !text("name") ||
      !text("description") ||
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
      await save({
        name: text("name"),
        description: text("description"),
        link,
        displayOrder: Number(order),
      });
      onSuccess();
    } catch (failure) {
      setError(
        failure === sessionRenewedError
          ? "認証を更新しました。もう一度保存してください"
          : "お気に入りを保存できませんでした",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };
  return (
    <form
      onChange={onDirty}
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <fieldset disabled={pending}>
        <label>
          {"名前"}
          <input name={"name"} required maxLength={200} />
        </label>
        <label>
          {"説明"}
          <textarea name={"description"} required maxLength={4000} />
        </label>
        <label>
          {"URL"}
          <input name={"link"} required maxLength={2048} />
        </label>
        <label>
          {"表示順"}
          <input
            name={"displayOrder"}
            type={"number"}
            required
            min={-2147483648}
            max={2147483647}
          />
        </label>
        <button type={"submit"}>{"作成"}</button>
      </fieldset>
      {error && <p role={"alert"}>{error}</p>}
    </form>
  );
};
