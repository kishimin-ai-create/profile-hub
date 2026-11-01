import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { sessionRenewedError } from "../api/authorized-request";

export type ProfileInput = {
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
};
type Props = {
  initial: ProfileInput;
  save: (data: ProfileInput) => Promise<void>;
  onSuccess: () => void;
  onDirty?: () => void;
};

export const ProfileForm = ({ initial, save, onSuccess, onDirty }: Props) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const urlError = error === "http または https の URL を入力してください";
  const submitting = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    const text = (key: string) => {
      const value = form.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    const avatarUrl = text("avatarUrl");
    if (avatarUrl) {
      try {
        const url = new URL(avatarUrl);
        if (
          !/^https?:\/\//i.test(avatarUrl) ||
          (url.protocol !== "http:" && url.protocol !== "https:")
        )
          throw new Error("Invalid URL");
      } catch {
        setError("http または https の URL を入力してください");
        return;
      }
    }
    const name = text("name");
    if (!name) {
      setError("名前を入力してください");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await save({
        name,
        title: text("title") || null,
        bio: text("bio") || null,
        avatarUrl: avatarUrl || null,
      });
      onSuccess();
    } catch (failure) {
      setError(
        failure === sessionRenewedError
          ? "認証を更新しました。もう一度保存してください"
          : "プロフィールを保存できませんでした",
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
          <input name={"name"} required maxLength={200} defaultValue={initial.name} />
        </label>
        <label>
          {"肩書き"}
          <input name={"title"} maxLength={200} defaultValue={initial.title ?? ""} />
        </label>
        <label>
          {"自己紹介"}
          <textarea name={"bio"} maxLength={4000} defaultValue={initial.bio ?? ""} />
        </label>
        <label>
          {"画像 URL"}
          <input
            name={"avatarUrl"}
            maxLength={2048}
            defaultValue={initial.avatarUrl ?? ""}
            aria-invalid={urlError || undefined}
            aria-describedby={urlError ? errorId : undefined}
          />
        </label>
        <button type={"submit"}>{"保存"}</button>
      </fieldset>
      {error && (
        <p id={errorId} role={"alert"}>
          {error}
        </p>
      )}
    </form>
  );
};
