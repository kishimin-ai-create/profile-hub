import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { sessionRenewedError } from "../api/authorized-request";

const sectionSchema = z.enum(["engineering", "hobby"]);
export type PortfolioInput = {
  section: "engineering" | "hobby";
  name: string;
  summary: string;
  technologies: string[];
  displayOrder: number;
  repositoryUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
};
type Props = {
  save: (value: PortfolioInput) => Promise<void>;
  onSuccess: () => void;
  onDirty?: () => void;
  initial?: PortfolioInput;
};

export const PortfolioCreate = ({ save, onSuccess, onDirty, initial }: Props) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"failed" | "renewed" | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const submitting = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    const text = (key: string) => {
      const value = data.get(key);
      return typeof value === "string" ? value.trim() : "";
    };
    const section = sectionSchema.safeParse(text("section"));
    const technologyText = text("technologies");
    const technologies =
      initial && technologyText === initial.technologies.join(", ")
        ? initial.technologies
        : technologyText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    const order = text("displayOrder");
    const links = ["repositoryUrl", "demoUrl", "imageUrl"];
    const invalidUrl = links.find((key) => {
      const value = text(key);
      if (!value) return false;
      try {
        const url = new URL(value);
        return url.protocol !== "http:" && url.protocol !== "https:";
      } catch {
        return true;
      }
    });
    setUrlError(invalidUrl ?? null);
    if (invalidUrl) return;
    if (
      !section.success ||
      !text("name") ||
      !text("summary") ||
      !technologies.length ||
      !order ||
      !Number.isInteger(Number(order))
    ) {
      setError("failed");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await save({
        section: section.data,
        name: text("name"),
        summary: text("summary"),
        technologies,
        displayOrder: Number(order),
        ...(text("repositoryUrl") ? { repositoryUrl: text("repositoryUrl") } : {}),
        ...(text("demoUrl") ? { demoUrl: text("demoUrl") } : {}),
        ...(text("imageUrl") ? { imageUrl: text("imageUrl") } : {}),
      });
      onSuccess();
    } catch (failure) {
      setError(failure === sessionRenewedError ? "renewed" : "failed");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };
  return (
    <>
      <h1>{initial ? "作品を編集" : "作品を作成"}</h1>
      <form
        onChange={onDirty}
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <fieldset disabled={pending}>
          <legend>{"作品情報"}</legend>
          <label htmlFor={"section"}>{"セクション"}</label>

          <select id={"section"} name={"section"} defaultValue={initial?.section ?? ""} required>
            <option value={""}>{"選択してください"}</option>
            <option value={"engineering"}>{"engineering"}</option>
            <option value={"hobby"}>{"hobby"}</option>
          </select>

          <label htmlFor={"name"}>{"作品名"}</label>

          <input
            id={"name"}
            name={"name"}
            defaultValue={initial?.name ?? ""}
            maxLength={200}
            required
          />

          <label htmlFor={"summary"}>{"概要"}</label>

          <textarea
            id={"summary"}
            name={"summary"}
            defaultValue={initial?.summary ?? ""}
            maxLength={4000}
            required
          />

          <label htmlFor={"technologies"}>{"技術（カンマ区切り）"}</label>

          <input
            id={"technologies"}
            name={"technologies"}
            defaultValue={initial?.technologies.join(", ") ?? ""}
            required
          />

          <label htmlFor={"repositoryUrl"}>{"リポジトリ URL"}</label>

          <input
            id={"repositoryUrl"}
            name={"repositoryUrl"}
            defaultValue={initial?.repositoryUrl ?? ""}
            maxLength={2048}
            aria-invalid={urlError === "repositoryUrl"}
            aria-describedby={urlError === "repositoryUrl" ? "url-error" : undefined}
          />

          <label htmlFor={"demoUrl"}>{"デモ URL"}</label>

          <input
            id={"demoUrl"}
            name={"demoUrl"}
            defaultValue={initial?.demoUrl ?? ""}
            maxLength={2048}
            aria-invalid={urlError === "demoUrl"}
            aria-describedby={urlError === "demoUrl" ? "url-error" : undefined}
          />

          <label htmlFor={"imageUrl"}>{"画像 URL"}</label>

          <input
            id={"imageUrl"}
            name={"imageUrl"}
            defaultValue={initial?.imageUrl ?? ""}
            maxLength={2048}
            aria-invalid={urlError === "imageUrl"}
            aria-describedby={urlError === "imageUrl" ? "url-error" : undefined}
          />

          {urlError && (
            <p id={"url-error"} role={"alert"}>
              {"http または https の URL を入力してください"}
            </p>
          )}

          <label htmlFor={"displayOrder"}>{"表示順"}</label>

          <input
            id={"displayOrder"}
            name={"displayOrder"}
            defaultValue={initial?.displayOrder ?? ""}
            type={"number"}
            min={-2147483648}
            max={2147483647}
            required
          />

          {error && (
            <p role={"alert"}>
              {error === "renewed"
                ? "認証を更新しました。もう一度保存してください"
                : "作品を保存できませんでした"}
            </p>
          )}

          <button type={"submit"} disabled={pending}>
            {initial ? "保存" : "作成"}
          </button>
        </fieldset>
      </form>
    </>
  );
};
