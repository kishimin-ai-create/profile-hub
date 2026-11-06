import { useId, useRef, useState } from "react";
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
  const [error, setError] = useState<"failed" | "renewed" | "name" | "summary" | null>(null);
  const errorId = useId();
  const [urlError, setUrlError] = useState<string | null>(null);
  const [technologyError, setTechnologyError] = useState<string | null>(null);
  const technologyErrorId = useId();
  const submitting = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    setError(null);
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
    const invalidTechnologies = !technologies.length
      ? "技術を1件以上入力してください"
      : technologies.length > 50 || technologies.some((item) => item.length > 100)
        ? "技術は50件以内、各100文字以内で入力してください"
        : null;
    setTechnologyError(invalidTechnologies);
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
    if (invalidUrl || invalidTechnologies) return;
    if (!text("name")) {
      setError("name");
      return;
    }
    if (!text("summary")) {
      setError("summary");
      return;
    }
    if (!section.success || !order || !Number.isInteger(Number(order))) {
      setError("failed");
      return;
    }
    submitting.current = true;
    setPending(true);
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
            aria-invalid={error === "name" || undefined}
            aria-describedby={error === "name" ? errorId : undefined}
          />

          <label htmlFor={"summary"}>{"概要"}</label>

          <textarea
            id={"summary"}
            name={"summary"}
            defaultValue={initial?.summary ?? ""}
            maxLength={4000}
            required
            aria-invalid={error === "summary" || undefined}
            aria-describedby={error === "summary" ? errorId : undefined}
          />

          <label htmlFor={"technologies"}>{"技術（カンマ区切り）"}</label>

          <input
            id={"technologies"}
            name={"technologies"}
            defaultValue={initial?.technologies.join(", ") ?? ""}
            required
            aria-invalid={technologyError ? true : undefined}
            aria-describedby={technologyError ? technologyErrorId : undefined}
          />
          {technologyError && (
            <p id={technologyErrorId} role={"alert"}>
              {technologyError}
            </p>
          )}

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
            <p id={errorId} role={"alert"}>
              {error === "renewed"
                ? "認証を更新しました。もう一度保存してください"
                : error === "name"
                  ? "作品名を入力してください"
                  : error === "summary"
                    ? "概要を入力してください"
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
